import React, { useState } from 'react';
import './App.css';
import CharacterSelector from './CharacterSelector';
import AvatarViewer from './AvatarViewer';

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const handleSelectCharacter = (character) => {
    setSelectedCharacter(character);
  };

  const handleBackToSelection = () => {
    setSelectedCharacter(null);
  };

  return (
    <div className="App">
      {selectedCharacter ? (
        <AvatarViewer character={selectedCharacter} onBack={handleBackToSelection} />
      ) : (
        <CharacterSelector onSelectCharacter={handleSelectCharacter} />
      )}
    </div>
  );
}

export default App