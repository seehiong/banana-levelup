import React, { useState, useEffect, useRef } from 'react';
import './AvatarViewer.css';

const TOTAL_VIEWS = 4;
const ROTATION_ANGLES = [0, 90, 180, 270];

const AvatarViewer = ({ character, onBack }) => {
  const [rotationIndex, setRotationIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartRotationIndex = useRef(0);

  const getImagePath = (index) => {
    const angle = ROTATION_ANGLES[index].toString().padStart(3, '0');
    return `/rotations/${character.id}/${character.id}_${angle}.png`;
  };

  useEffect(() => {
    setIsLoading(true);
    const imageUrls = Array.from({ length: TOTAL_VIEWS }, (_, i) => getImagePath(i));
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
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setRotationIndex((prev) => (prev - 1 + TOTAL_VIEWS) % TOTAL_VIEWS);
      } else if (e.key === 'ArrowRight') {
        setRotationIndex((prev) => (prev + 1) % TOTAL_VIEWS);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [TOTAL_VIEWS]); // Re-bind if TOTAL_VIEWS changes, ensuring fresh scope.

  const handleMouseDown = (e) => {
    setIsDragging(true);
    dragStartX.current = e.clientX;
    dragStartRotationIndex.current = rotationIndex;
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    const dragDistance = e.clientX - dragStartX.current;
    // A sensitivity of 20 means you have to drag 20px to change one frame.
    const sensitivity = 20;
    const rotationChange = Math.round(dragDistance / sensitivity);
    const newIndex = (dragStartRotationIndex.current - rotationChange + (TOTAL_VIEWS * 100)) % TOTAL_VIEWS; // Add a large multiple of TOTAL_VIEWS to handle negative results
    setRotationIndex(newIndex);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
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
          <p className="instructions">Click and drag, or use ← → arrow keys to rotate.</p>
        </div>
      )}
    </div>
  );
};

export default AvatarViewer;