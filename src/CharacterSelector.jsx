import React from 'react';
import { characters } from './characters';
import './CharacterSelector.css';

const CharacterSelector = ({ onSelectCharacter }) => {
  return (
    <div className="character-selector-container">
      <h2>Choose Your Avatar</h2>
      <div className="character-grid">
        {characters.map((char) => (
          <div key={char.id} className="character-card" onClick={() => onSelectCharacter(char)}>
            <img src={char.baseImage} alt={char.name} />
            <h3>{char.name}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterSelector;