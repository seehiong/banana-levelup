// src/CharacterSelector.jsx

import React from 'react';
import { characters } from './characters';
import './CharacterSelector.css';

const CharacterSelector = ({ onSelectCharacter, customCharacters = [] }) => {
  const allCharacters = [...characters, ...customCharacters];

  return (
    <div className="character-selector-container">
      <h2>Choose Your Avatar</h2>
      <div className="character-grid">
        {allCharacters.map((char) => (
          <div key={char.id} className="character-card" onClick={() => onSelectCharacter(char)}>
            <img 
              src={char.isCustom ? char.baseImage : `${import.meta.env.BASE_URL}${char.baseImage.slice(1)}`} 
              alt={char.name} 
            />
            <h3>{char.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterSelector;