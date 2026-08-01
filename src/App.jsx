// src/App.jsx

import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import './App.css';
import CharacterSelector from './CharacterSelector';
import AvatarViewer from './AvatarViewer';
import AIAssistant from './AIAssistant';

function App() {
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [customCharacters, setCustomCharacters] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadAvatars = async () => {
      try {
        // Migrate legacy avatars from localStorage if they exist
        const legacyAvatars = localStorage.getItem('custom_avatars');
        if (legacyAvatars) {
          const parsedLegacy = JSON.parse(legacyAvatars);
          await localforage.setItem('custom_avatars', parsedLegacy);
          localStorage.removeItem('custom_avatars');
          setCustomCharacters(parsedLegacy);
        } else {
          // Normal load from IndexedDB
          const saved = await localforage.getItem('custom_avatars');
          if (saved) {
            setCustomCharacters(saved);
          }
        }
      } catch (e) {
        console.error("Error loading avatars:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadAvatars();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localforage.setItem('custom_avatars', customCharacters).catch(e => {
        console.error("Failed to save avatars to localforage:", e);
      });
    }
  }, [customCharacters, isLoaded]);

  const handleSelectCharacter = (character) => {
    setSelectedCharacter(character);
  };

  const handleBackToSelection = () => {
    setSelectedCharacter(null);
  };

  const handleGenerateAvatar = (newAvatar) => {
    setCustomCharacters(prev => [...prev, newAvatar]);
  };

  const handleUpdateCharacter = (updatedChar) => {
    setCustomCharacters(prev => prev.map(c => c.id === updatedChar.id ? updatedChar : c));
    if (selectedCharacter && selectedCharacter.id === updatedChar.id) {
      setSelectedCharacter(updatedChar);
    }
  };

  if (!isLoaded) {
    return <div className="App"><div style={{padding: '4rem', textAlign: 'center'}}>Loading your collection...</div></div>;
  }

  return (
    <div className="App">
      {selectedCharacter ? (
        <AvatarViewer 
          character={selectedCharacter} 
          onBack={handleBackToSelection} 
          onUpdateCharacter={handleUpdateCharacter}
        />
      ) : (
        <CharacterSelector 
          onSelectCharacter={handleSelectCharacter} 
          customCharacters={customCharacters} 
        />
      )}
      <AIAssistant onGenerateAvatar={handleGenerateAvatar} />
    </div>
  );
}

export default App