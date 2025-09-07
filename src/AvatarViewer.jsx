import React, { useState, useEffect, useRef } from 'react';
import './AvatarViewer.css';

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

const AvatarViewer = ({ character, onBack }) => {
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [showAll8, setShowAll8] = useState(false); // Default to 4 images
  const [jpegAvailable, setJpegAvailable] = useState(false);
  const [checkingJpeg, setCheckingJpeg] = useState(true);
  const dragStartX = useRef(0);
  const dragStartRotationIndex = useRef(0);

  const currentViews = showAll8 ? ALL_VIEWS : PNG_VIEWS;
  const totalViews = currentViews.length;

  const getImagePath = (index) => {
    const view = currentViews[index];
    if (!character || !view) return '';
    return `/rotations/${character.id}/${character.id}_${view.name}.${view.ext}`;
  };

  // Check JPEG availability
  useEffect(() => {
    if (!character) return;
    
    setCheckingJpeg(true);
    const jpegViews = ALL_VIEWS.filter(view => view.ext === 'jpeg');
    let loadedJpegs = 0;
    let failedJpegs = 0;

    const checkComplete = () => {
      if (loadedJpegs + failedJpegs === jpegViews.length) {
        setJpegAvailable(loadedJpegs > 0); // Available if at least one JPEG loaded
        setCheckingJpeg(false);
      }
    };

    jpegViews.forEach((view) => {
      const img = new Image();
      const url = `/rotations/${character.id}/${character.id}_${view.name}.${view.ext}`;
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
    const imageUrls = Array.from({ length: totalViews }, (_, i) => getImagePath(i));
    let loadedImages = 0;

    const handleImageLoad = () => {
      loadedImages++;
      if (loadedImages === totalViews) {
        setIsLoading(false);
      }
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
  }, [character, showAll8, totalViews]);

  // Reset showAll8 if JPEG becomes unavailable
  useEffect(() => {
    if (!jpegAvailable && showAll8) {
      setShowAll8(false);
    }
  }, [jpegAvailable, showAll8]);

  // Reset rotation index when switching between modes
  useEffect(() => {
    setRotationIndex(0);
  }, [showAll8]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setRotationIndex((prev) => (prev - 1 + totalViews) % totalViews);
      } else if (e.key === 'ArrowRight') {
        setRotationIndex((prev) => (prev + 1) % totalViews);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [totalViews]);

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartRotationIndex.current = rotationIndex;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dragDistance = e.clientX - dragStartX.current;
    const sensitivity = 20;
    const rotationChange = Math.round(dragDistance / sensitivity);
    const newIndex = (dragStartRotationIndex.current - rotationChange + (totalViews * 100)) % totalViews;
    setRotationIndex(newIndex);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleViewMode = () => {
    if (jpegAvailable) {
      setShowAll8(!showAll8);
    }
  };

  return (
    <div className="avatar-viewer-container">
      <button onClick={onBack} className="back-button">← Back to Selection</button>
      
      <div className="view-toggle">
        <button 
          onClick={toggleViewMode} 
          className={`toggle-button ${!jpegAvailable ? 'disabled' : ''}`}
          disabled={!jpegAvailable}
          title={!jpegAvailable ? 'JPEG images not available for this character' : ''}
        >
          {checkingJpeg ? 'Checking...' : (showAll8 ? 'Show 4 Views' : 'Show 8 Views')}
        </button>
        <span className="view-counter">{rotationIndex + 1} / {totalViews}</span>
      </div>

      <div className="avatar-info">
        <h1>{character.name}</h1>
        <p>{character.description}</p>
      </div>
      
      {isLoading ? (
        <div className="loading-indicator">
          <p>Polishing the figurine...</p>
        </div>
      ) : (
        <div 
          className="avatar-display"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img 
            src={getImagePath(rotationIndex)} 
            alt={`Missing: ${getImagePath(rotationIndex)}`} 
          />
          <p className="instructions">
            Click and drag, or use ← → arrow keys to rotate. 
            {showAll8 ? ' (8 views)' : ' (4 views)'}
          </p>
        </div>
      )}
    </div>
  );
};

export default AvatarViewer;