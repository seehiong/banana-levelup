import React, { useState, useEffect, useRef } from 'react';
import './AvatarViewer.css';

const TOTAL_VIEWS = 4;
const ROTATION_ANGLES = [0, 90, 180, 270];

const AvatarViewer = ({ character, onBack }) => {
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const currentRotationIndex = useRef(0);

  const getImagePath = (index) => {
    const angle = ROTATION_ANGLES[index].toString().padStart(3, '0');
    return `/rotations/${character.id}/${character.id}_${angle}.png`;
  };

  useEffect(() => {
    setIsLoading(true);
    const imageUrls = ROTATION_ANGLES.map((_, index) => getImagePath(index));
    // Reset auto-rotation when a new character is selected
    setIsAutoRotating(true); 
    let loadedImages = 0;

    const handleImageLoad = () => {
      loadedImages++;
      if (loadedImages === TOTAL_VIEWS) {
        setIsLoading(false);
      }
    };

    imageUrls.forEach((url) => {
      const img = new Image();
      img.src = url;
      img.onload = handleImageLoad;
      // Optional: handle image loading errors
      img.onerror = handleImageLoad;
    });
  }, [character]);

  useEffect(() => {
    if (isAutoRotating && !isLoading) {
      const interval = setInterval(() => {
        setRotationIndex((prev) => (prev + 1) % TOTAL_VIEWS);
      }, 800); // Rotate every 800ms

      return () => clearInterval(interval);
    }
  }, [isAutoRotating, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        // Stop auto-rotation on manual interaction
        setIsAutoRotating(false);
        setRotationIndex((prev) => (prev - 1 + TOTAL_VIEWS) % TOTAL_VIEWS);
      } else if (e.key === 'ArrowRight') {
        // Stop auto-rotation on manual interaction
        setIsAutoRotating(false);
        setRotationIndex((prev) => (prev + 1) % TOTAL_VIEWS);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [TOTAL_VIEWS]); // Re-bind if TOTAL_VIEWS changes, ensuring fresh scope.

  const handleMouseDown = (e) => {
    // Stop auto-rotation on manual interaction
    setIsAutoRotating(false);
    setIsDragging(true);
    dragStartX.current = e.clientX;
    currentRotationIndex.current = rotationIndex;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dragDistance = e.clientX - dragStartX.current;
    // Adjust sensitivity by changing the divisor
    const rotationChange = Math.round(dragDistance / 50); // Less sensitive for fewer frames
    const newIndex = (currentRotationIndex.current - rotationChange + TOTAL_VIEWS) % TOTAL_VIEWS;
    setRotationIndex(newIndex);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleAutoRotate = () => {
    setIsAutoRotating(!isAutoRotating);
  };

  return (
    <div className="avatar-viewer-container">
      <button onClick={onBack} className="back-button">← Back to Selection</button>
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
          onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves the area
        >
          <img src={getImagePath(rotationIndex)} alt={`${character.name} rotated`} />
          <div className="controls-container">
            <button onClick={toggleAutoRotate} className="control-button">
              {isAutoRotating ? '❚❚ Pause' : '► Play'}
            </button>
            <p className="instructions">Click and drag, or use ← → arrow keys to rotate.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarViewer;