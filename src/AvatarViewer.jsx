// src/AvatarViewer.jsx

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import gifshot from 'gifshot';
import './AvatarViewer.css';
import { describeError } from './errors';

const ALL_VIEWS = [
  { name: 'front', ext: 'png' },
  { name: 'front_right', ext: 'jpeg' },
  { name: 'right', ext: 'png' },
  { name: 'back_right', ext: 'jpeg' },
  { name: 'back', ext: 'png' },
  { name: 'back_left', ext: 'jpeg' },
  { name: 'left', ext: 'png' },
  { name: 'front_left', ext: 'jpeg' },
];

const PNG_VIEWS = [
  { name: 'front', ext: 'png' },
  { name: 'right', ext: 'png' },
  { name: 'back', ext: 'png' },
  { name: 'left', ext: 'png' },
];

const AvatarViewer = ({ character, onBack, onUpdateCharacter }) => {
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showAll8, setShowAll8] = useState(false);
  const [jpegAvailable, setJpegAvailable] = useState(false);
  const [checkingJpeg, setCheckingJpeg] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  // New States for AI generation
  const [isGeneratingRotations, setIsGeneratingRotations] = useState(false);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [actionError, setActionError] = useState(null);

  const dragStartX = useRef(0);
  const dragStartRotationIndex = useRef(0);
  const touchStartX = useRef(0);
  const avatarDisplayRef = useRef(null);

  const customHasViews = character?.isCustom && character?.views && character.views.length === 4;
  const currentViews = showAll8 ? ALL_VIEWS : PNG_VIEWS;
  const totalViews = character?.isCustom ? (customHasViews ? 4 : 1) : currentViews.length;

  // Check if mobile on resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getImagePath = (index) => {
    if (!character) return '';
    if (character.isCustom) {
      if (customHasViews) return character.views[index];
      return character.baseImage;
    }
    const view = currentViews[index];
    if (!view) return '';
    return `${import.meta.env.BASE_URL}rotations/${character.id}/${character.id}_${view.name}.${view.ext}`;
  };

  // Check JPEG availability
  useEffect(() => {
    if (!character || character.isCustom) return;
    
    setCheckingJpeg(true);
    const jpegViews = ALL_VIEWS.filter(view => view.ext === 'jpeg');
    let loadedJpegs = 0;
    let failedJpegs = 0;

    const checkComplete = () => {
      if (loadedJpegs + failedJpegs === jpegViews.length) {
        setJpegAvailable(loadedJpegs > 0);
        setCheckingJpeg(false);
      }
    };

    jpegViews.forEach((view) => {
      const img = new Image();
      const url = `${import.meta.env.BASE_URL}rotations/${character.id}/${character.id}_${view.name}.${view.ext}`;
      img.src = url;
      img.onload = () => {
        loadedJpegs++;
        checkComplete();
      };
      img.onerror = () => {
        failedJpegs++;
        checkComplete();
      };
    });
  }, [character]);

  useEffect(() => {
    setIsLoading(true);
    if (character?.isCustom) {
      if (customHasViews) {
        let loaded = 0;
        character.views.forEach(src => {
          const img = new Image();
          img.src = src;
          img.onload = () => { loaded++; if (loaded === 4) setIsLoading(false); };
          img.onerror = () => { loaded++; if (loaded === 4) setIsLoading(false); };
        });
      } else {
        const img = new Image();
        img.src = character.baseImage;
        img.onload = () => setIsLoading(false);
        img.onerror = () => setIsLoading(false);
      }
      return;
    }

    const imageUrls = Array.from({ length: totalViews }, (_, i) => getImagePath(i));
    let loadedImages = 0;
    const handleImageLoad = () => {
      loadedImages++;
      if (loadedImages === totalViews) setIsLoading(false);
    };

    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = handleImageLoad;
      img.onerror = () => {
        console.error(`Failed to load image: ${url}`);
        handleImageLoad();
      };
    });
  }, [character, showAll8, totalViews, customHasViews]);

  // Reset showAll8 if JPEG becomes unavailable
  useEffect(() => {
    if (!jpegAvailable && showAll8) {
      setShowAll8(false);
    }
  }, [jpegAvailable, showAll8]);

  // Reset rotation index when switching between modes
  useEffect(() => {
    setRotationIndex(0);
  }, [showAll8, character]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (totalViews <= 1) return;
      if (e.key === 'ArrowLeft') {
        setRotationIndex((prev) => (prev - 1 + totalViews) % totalViews);
      } else if (e.key === 'ArrowRight') {
        setRotationIndex((prev) => (prev + 1) % totalViews);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalViews]);

  // Effect for handling the wheel event
  useEffect(() => {
    const element = avatarDisplayRef.current;
    if (!element || totalViews <= 1) return;

    const handleWheel = (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setRotationIndex((prev) => (prev - 1 + totalViews) % totalViews);
      } else {
        setRotationIndex((prev) => (prev + 1) % totalViews);
      }
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [isLoading, totalViews]);

  const handleMouseDown = (e) => {
    if (totalViews <= 1) return;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartRotationIndex.current = rotationIndex;
  };

  const handleMouseMove = (e) => {
    if (!isDragging || totalViews <= 1) return;
    const dragDistance = e.clientX - dragStartX.current;
    const sensitivity = 20;
    const rotationChange = Math.floor(dragDistance / sensitivity);
    const newIndex = (dragStartRotationIndex.current - rotationChange % totalViews + totalViews) % totalViews;
    setRotationIndex(newIndex);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch events for mobile
  const handleTouchStart = (e) => {
    if (totalViews <= 1) return;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current || totalViews <= 1) return;
    const touchX = e.touches[0].clientX;
    const diffX = touchX - touchStartX.current;
    
    if (Math.abs(diffX) > 30) {
      if (diffX > 0) {
        setRotationIndex((prev) => (prev - 1 + totalViews) % totalViews);
      } else {
        setRotationIndex((prev) => (prev + 1) % totalViews);
      }
      touchStartX.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
  };

  const toggleViewMode = () => {
    if (jpegAvailable) {
      setShowAll8(!showAll8);
    }
  };

  const handleThumbnailClick = (index) => {
    setRotationIndex(index);
  };

  const handleNext = () => {
    if (totalViews <= 1) return;
    setRotationIndex((prev) => (prev + 1) % totalViews);
  };

  const handlePrevious = () => {
    if (totalViews <= 1) return;
    setRotationIndex((prev) => (prev - 1 + totalViews) % totalViews);
  };

  const downloadCurrentImage = async () => {
    const url = getImagePath(rotationIndex);
    if (!url) return;
    try {
      let blobUrl = url;
      if (url.startsWith('http') || url.startsWith('/')) {
        const response = await fetch(url);
        const blob = await response.blob();
        blobUrl = URL.createObjectURL(blob);
      }
      const link = document.createElement('a');
      let ext = 'png';
      if (url.includes('image/jpeg') || url.endsWith('.jpeg') || url.endsWith('.jpg')) ext = 'jpg';
      link.download = `${character.name.replace(/\s+/g, '-').toLowerCase()}-view-${rotationIndex + 1}.${ext}`;
      link.href = blobUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      if (blobUrl !== url) URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Failed to download image:", err);
      window.open(url, '_blank');
    }
  };

  const generateSingleView = async (prompt, provider) => {
    if (provider === 'google') {
      const key = localStorage.getItem('gemini_api_key');
      const model = localStorage.getItem('ai_image_model') || 'gemini-3.1-flash-image';
      if (!key) throw new Error("Google API Key not found.");
      const ai = new GoogleGenAI({ apiKey: key });
      const response = await ai.models.generateContent({ model, contents: prompt });
      if (response?.promptFeedback?.blockReason) {
        throw new Error(`Blocked by safety filters (${response.promptFeedback.blockReason}).`);
      }
      const part = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
      if (!part) throw new Error("No image data returned from Google API.");
      return `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
    } else {
      const key = localStorage.getItem('openrouter_api_key');
      const model = localStorage.getItem('ai_image_model') || 'google/gemini-3.1-flash-image';
      if (!key) throw new Error("OpenRouter API Key not found.");
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          modalities: ["image", "text"]
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || "OpenRouter request failed.");

      const message = data?.choices?.[0]?.message;
      const inlineImage = message?.images?.[0]?.image_url?.url || message?.images?.[0]?.url;
      if (inlineImage) return inlineImage;

      const match = typeof message?.content === 'string'
        ? message.content.match(/(https?:\/\/[^\s)]+\.(?:png|jpe?g|webp)[^\s)]*)/i)
        : null;
      if (!match) throw new Error("That model didn't return an image — pick an image model in the AI Assistant settings.");
      return match[0];
    }
  };

  const generateRotations = async () => {
    setIsGeneratingRotations(true);
    setActionError(null);
    try {
      const provider = localStorage.getItem('ai_provider') || 'google';
      const basePrompt = character.description;
      
      // Enhance the prompt to enforce strict stylistic and subject consistency
      const consistencyPrompt = " Maintain the EXACT same character design, clothing, proportions, lighting, style, and a plain solid background. This is a strict 3D character turnaround sheet view.";
      
      const views = [
        character.baseImage,
        await generateSingleView(`${basePrompt}, EXACT left profile side view.${consistencyPrompt}`, provider),
        await generateSingleView(`${basePrompt}, EXACT direct back view, viewed from behind.${consistencyPrompt}`, provider),
        await generateSingleView(`${basePrompt}, EXACT right profile side view.${consistencyPrompt}`, provider)
      ];
      
      if (onUpdateCharacter) {
        onUpdateCharacter({ ...character, views });
      }
    } catch (err) {
      console.error(err);
      const model = localStorage.getItem('ai_image_model') || '';
      setActionError(describeError(err, model));
    } finally {
      setIsGeneratingRotations(false);
    }
  };

  const generateGif = () => {
    setIsGeneratingGif(true);
    gifshot.createGIF({
      images: character.views,
      gifWidth: 400,
      gifHeight: 400,
      interval: 0.25, // 4 frames per second
      numFrames: 4,
    }, function(obj) {
      setIsGeneratingGif(false);
      if(!obj.error) {
        const link = document.createElement('a');
        link.download = `${character.id}-rotation.gif`;
        link.href = obj.image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        setActionError("😵 Couldn't build the GIF from these views. Try regenerating the rotations first.");
      }
    });
  };

  const allowRotation = !character.isCustom || customHasViews;

  return (
    <div className="avatar-viewer-container">
      <button onClick={onBack} className="back-button">← Back to Selection</button>
      
      {!character.isCustom && (
        <div className="view-toggle" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <button 
            onClick={toggleViewMode} 
            className={`toggle-button ${!jpegAvailable ? 'disabled' : ''}`}
            disabled={!jpegAvailable}
            title={!jpegAvailable ? 'JPEG images not available for this character' : ''}
          >
            {checkingJpeg ? 'Checking...' : (showAll8 ? 'Show 4 Views' : 'Show 8 Views')}
          </button>
          <button 
             onClick={downloadCurrentImage}
             className="toggle-button"
             style={{ background: '#3b82f6', color: 'white', border: 'none', marginLeft: 'auto' }}
          >
             📥 Download Image
          </button>
          <span className="view-counter">{rotationIndex + 1} / {totalViews}</span>
        </div>
      )}
      
      {character.isCustom && (
        <div className="view-toggle" style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
          <button 
             onClick={downloadCurrentImage}
             className="toggle-button"
             style={{ background: '#3b82f6', color: 'white', border: 'none', marginLeft: 'auto' }}
          >
             📥 Download Image
          </button>
          {customHasViews && (
            <span className="view-counter">{rotationIndex + 1} / {totalViews}</span>
          )}
        </div>
      )}

      <div className="avatar-info">
        <h1>{character.name}</h1>
        <p>{character.description}</p>
      </div>
      
      {character.isCustom && (
        <div className="custom-actions" style={{ margin: '1rem 0', display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!customHasViews ? (
            <button 
              className="toggle-button" 
              onClick={generateRotations} 
              disabled={isGeneratingRotations}
              style={{ background: 'linear-gradient(135deg, #10b981, #3b82f6)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isGeneratingRotations ? 'Generating Views (This takes a moment)...' : '✨ Generate 3D Rotations'}
            </button>
          ) : (
            <button 
              className="toggle-button" 
              onClick={generateGif} 
              disabled={isGeneratingGif}
              style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '24px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {isGeneratingGif ? 'Encoding GIF...' : '📥 Download Animated GIF'}
            </button>
          )}
        </div>
      )}

      {actionError && (
        <div className="action-error" role="alert">
          {actionError.split('\n').filter(Boolean).map((line, i) => (
            <p key={i}>{line.replace(/\*\*/g, '')}</p>
          ))}
          <button className="action-error-dismiss" onClick={() => setActionError(null)}>Dismiss</button>
        </div>
      )}

      {isLoading ? (
        <div className="loading-indicator">
          <p>Polishing the figurine...</p>
        </div>
      ) : (
        <>
          <div 
            className="avatar-display"
            ref={avatarDisplayRef}
            onMouseDown={!isMobile && allowRotation ? handleMouseDown : null}
            onMouseMove={!isMobile && allowRotation && isDragging ? handleMouseMove : null}
            onMouseLeave={!isMobile && allowRotation ? handleMouseUp : null}
            onMouseUp={!isMobile && allowRotation ? handleMouseUp : null}
            onTouchStart={isMobile && allowRotation ? handleTouchStart : null}
            onTouchMove={isMobile && allowRotation ? handleTouchMove : null}
            onTouchEnd={isMobile && allowRotation ? handleTouchEnd : null}
            style={{ cursor: allowRotation ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
          >
            <img 
              src={getImagePath(rotationIndex)} 
              alt={`${character.name} view`} 
            />
            
            {/* Mobile navigation arrows */}
            {isMobile && allowRotation && (
              <div className="mobile-nav">
                <button className="nav-arrow left-arrow" onClick={handlePrevious}>‹</button>
                <button className="nav-arrow right-arrow" onClick={handleNext}>›</button>
              </div>
            )}
            
            {allowRotation && (
              <p className="instructions">
                {!isMobile ? "Scroll, click & drag, or use ← → arrow keys to rotate." : "Swipe, tap arrows, or tap thumbnails to rotate."}
                {!character.isCustom && (showAll8 ? ' (8 views)' : ' (4 views)')}
              </p>
            )}
          </div>

          {/* Thumbnail grid for mobile */}
          {isMobile && allowRotation && (
            <div className="thumbnails-grid">
              {(character.isCustom ? PNG_VIEWS : currentViews).map((view, index) => (
                <div 
                  key={index}
                  className={`thumbnail ${index === rotationIndex ? 'active' : ''}`}
                  onClick={() => handleThumbnailClick(index)}
                >
                  <img 
                    src={getImagePath(index)} 
                    alt={`${view.name} view`}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AvatarViewer;