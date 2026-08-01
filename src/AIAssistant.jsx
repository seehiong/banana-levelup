// src/AIAssistant.jsx

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { MessageCircle, X, Send, Settings, Bot } from 'lucide-react';
import { characters } from './characters';
import './AIAssistant.css';
import { describeError } from './errors';

// Minimal inline markdown: **bold**, `code`, and [text](url).
// Enough for our own status messages and typical model replies — not a full parser.
const renderInline = (line) => {
  const tokens = line.split(/(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return tokens.map((token, i) => {
    if (!token) return null;
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={i}>{token.slice(1, -1)}</code>;
    }
    const link = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      // Only allow http(s) targets so a model reply can't inject javascript: URLs.
      const href = /^https?:\/\//i.test(link[2]) ? link[2] : null;
      return href
        ? <a key={i} href={href} target="_blank" rel="noopener noreferrer">{link[1]}</a>
        : <span key={i}>{link[1]}</span>;
    }
    return <span key={i}>{token}</span>;
  });
};

const AIAssistant = ({ onGenerateAvatar }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Settings State
  const [googleKey, setGoogleKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [provider, setProvider] = useState('google');
  const [chatModel, setChatModel] = useState('gemini-2.5-flash');
  const [imageModel, setImageModel] = useState('gemini-3.1-flash-image');
  
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi there! I am the Banana Level Up guide. I can tell you all about the different characters.\n\n✨ **New**: You can now generate your own avatar! Try typing:\n`/generate a cute cyberpunk cat hacker with neon green glasses holding a banana, rendered as a 3D photorealistic collectible figurine on a white base.`' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);
  
  // Ref to hold the ai instance to avoid recreating it on every render
  const aiRef = useRef(null);
  // Ref for the chat session (Google only)
  const chatSessionRef = useRef(null);

  const characterContext = characters.map(c => 
    `- ${c.name}: ${c.description}`
  ).join('\n');

  const systemInstruction = `You are a helpful and friendly guide for a 3D avatar viewer app called "Banana Level Up". 
Your job is to help users learn about the different characters available in the app.
Here are the characters available in the app:
${characterContext}

Keep your answers concise, friendly, and focused on the characters. Do not make up characters that aren't in this list.`;

  // Initialize API key from local storage on mount
  useEffect(() => {
    const savedGoogleKey = localStorage.getItem('gemini_api_key');
    const savedOpenRouterKey = localStorage.getItem('openrouter_api_key');
    const savedProvider = localStorage.getItem('ai_provider') || 'google';
    const savedChatModel = localStorage.getItem('ai_chat_model') || (savedProvider === 'google' ? 'gemini-2.5-flash' : 'google/gemini-2.5-flash');
    const savedImageModel = localStorage.getItem('ai_image_model') || (savedProvider === 'google' ? 'gemini-3.1-flash-image' : 'google/gemini-3.1-flash-image');
    
    if (savedGoogleKey) setGoogleKey(savedGoogleKey);
    if (savedOpenRouterKey) setOpenRouterKey(savedOpenRouterKey);

    const activeKey = savedProvider === 'google' ? savedGoogleKey : savedOpenRouterKey;
    
    if (activeKey) {
      setProvider(savedProvider);
      setChatModel(savedChatModel);
      setImageModel(savedImageModel);
      setIsConfiguring(false);
      
      if (savedProvider === 'google') {
        initializeGoogleAI(savedGoogleKey, savedChatModel);
      }
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const initializeGoogleAI = (key, modelToUse) => {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      aiRef.current = ai;
      
      chatSessionRef.current = ai.chats.create({
        model: modelToUse,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.7,
        }
      });
    } catch (error) {
      console.error("Failed to initialize AI:", error);
    }
  };

  const handleProviderChange = (e) => {
    const newProvider = e.target.value;
    setProvider(newProvider);
    if (newProvider === 'openrouter') {
      setChatModel('google/gemini-2.5-flash');
      setImageModel('google/gemini-3.1-flash-image');
    } else {
      setChatModel('gemini-2.5-flash');
      setImageModel('gemini-3.1-flash-image');
    }
  };

  const handleSaveKey = () => {
    const activeKey = provider === 'google' ? googleKey : openRouterKey;
    if (activeKey.trim()) {
      if (googleKey.trim()) localStorage.setItem('gemini_api_key', googleKey.trim());
      if (openRouterKey.trim()) localStorage.setItem('openrouter_api_key', openRouterKey.trim());
      
      localStorage.setItem('ai_provider', provider);
      localStorage.setItem('ai_chat_model', chatModel);
      localStorage.setItem('ai_image_model', imageModel);
      
      setIsConfiguring(false);
      if (provider === 'google') {
        initializeGoogleAI(googleKey.trim(), chatModel);
      }
    }
  };

  const clearKey = () => {
    localStorage.removeItem('gemini_api_key');
    localStorage.removeItem('openrouter_api_key');
    localStorage.removeItem('ai_provider');
    localStorage.removeItem('ai_chat_model');
    localStorage.removeItem('ai_image_model');
    setGoogleKey('');
    setOpenRouterKey('');
    setIsConfiguring(true);
    aiRef.current = null;
    chatSessionRef.current = null;
  };

  const generateOpenRouterImage = async (prompt) => {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: imageModel,
        messages: [{ role: "user", content: prompt }],
        // Required for OpenRouter to return generated images rather than text.
        modalities: ["image", "text"]
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "OpenRouter Image API failed.");

    const message = data?.choices?.[0]?.message;
    if (!message) {
      throw new Error("The image model returned an empty response. Try a different model in ⚙️ Settings.");
    }

    // OpenRouter returns generated images on message.images[] as data URLs.
    const inlineImage = message.images?.[0]?.image_url?.url || message.images?.[0]?.url;
    if (inlineImage) return inlineImage;

    // Some models instead link the image from the text body.
    const urlMatch = typeof message.content === 'string'
      ? message.content.match(/(https?:\/\/[^\s)]+\.(?:png|jpe?g|webp)[^\s)]*)/i)
      : null;
    if (urlMatch) return urlMatch[0];

    throw new Error("That model didn't return an image — it may be text-only. Pick an image model such as `google/gemini-3.1-flash-image` in ⚙️ Settings.");
  };

  const chatOpenRouter = async (userMessage) => {
    const apiMessages = [
      { role: "system", content: systemInstruction },
      // Local error notices are UI-only — replaying them as assistant turns confuses the model.
      ...messages.filter(m => !m.isError && (m.role === 'user' || m.role === 'assistant')).map(m => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessage }
    ];

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openRouterKey.trim()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: chatModel,
        messages: apiMessages
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || "OpenRouter Chat API failed.");

    const reply = data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error("The chat model returned an empty response. Try again or pick another model in ⚙️ Settings.");
    return reply;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      if (userMessage.startsWith('/generate')) {
        const prompt = userMessage.replace('/generate', '').trim();
        if (!prompt) {
          throw new Error("Tell me what to draw, e.g. `/generate a robot chef holding a banana whisk`.");
        }
        let imageUrl = '';

        if (provider === 'google') {
          if (!aiRef.current) throw new Error("Google GenAI not initialized.");
          const response = await aiRef.current.models.generateContent({
            model: imageModel,
            contents: prompt
          });
          // A blocked or empty response has no candidates at all — reaching into
          // parts[0] blindly would throw an opaque TypeError instead of the real reason.
          const blockReason = response?.promptFeedback?.blockReason;
          if (blockReason) {
            throw new Error(`Blocked by safety filters (${blockReason}).`);
          }
          const part = response?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (!part) {
            throw new Error("The model replied without an image. Try describing the avatar in more visual detail.");
          }
          imageUrl = `data:${part.inlineData.mimeType || 'image/jpeg'};base64,${part.inlineData.data}`;
        } else {
          imageUrl = await generateOpenRouterImage(prompt);
        }
        
        const newAvatar = {
          id: 'custom-' + Date.now(),
          name: 'Custom Avatar',
          description: prompt,
          baseImage: imageUrl,
          isCustom: true
        };
        
        if (onGenerateAvatar) {
          onGenerateAvatar(newAvatar);
        }
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Here is your custom avatar!',
          image: imageUrl
        }]);
      } else {
        let replyText = '';
        if (provider === 'google') {
          if (!chatSessionRef.current) throw new Error("Google GenAI chat not initialized.");
          const response = await chatSessionRef.current.sendMessage({ message: userMessage });
          replyText = response.text;
        } else {
          replyText = await chatOpenRouter(userMessage);
        }
        setMessages(prev => [...prev, { role: 'assistant', content: replyText }]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: describeError(error, userMessage.startsWith('/generate') ? imageModel : chatModel),
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="ai-assistant-wrapper">
      {isOpen && (
        <div className="ai-assistant-panel">
          <div className="ai-header">
            <h3><Bot size={20} color="#6366f1" /> Banana Guide</h3>
            <div className="ai-header-actions">
              <button 
                className="icon-button" 
                onClick={() => setIsConfiguring(!isConfiguring)}
                title="Settings"
              >
                <Settings size={18} />
              </button>
              <button 
                className="icon-button" 
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {isConfiguring ? (
            <div className="settings-view">
              <h4>Setup AI Assistant</h4>
              <p>Configure your provider and models.</p>
              
              <div className="provider-toggle">
                <label className="provider-radio">
                  <input 
                    type="radio" 
                    value="google" 
                    checked={provider === 'google'} 
                    onChange={handleProviderChange} 
                  /> Google AI Studio
                </label>
                <label className="provider-radio">
                  <input 
                    type="radio" 
                    value="openrouter" 
                    checked={provider === 'openrouter'} 
                    onChange={handleProviderChange} 
                  /> OpenRouter
                </label>
              </div>

              <label>
                {provider === 'google' ? 'Google API Key' : 'OpenRouter API Key'}
                <input 
                  type="password" 
                  value={provider === 'google' ? googleKey : openRouterKey} 
                  onChange={(e) => provider === 'google' ? setGoogleKey(e.target.value) : setOpenRouterKey(e.target.value)}
                  placeholder={provider === 'google' ? "AIzaSy..." : "sk-or-v1-..."}
                />
              </label>

              <label>
                Chat Model
                <input 
                  type="text" 
                  value={chatModel} 
                  onChange={(e) => setChatModel(e.target.value)}
                  placeholder={provider === 'google' ? "e.g. gemini-2.5-flash" : "e.g. google/gemini-2.5-flash"}
                />
              </label>

              <label>
                Image Model
                <input 
                  type="text" 
                  value={imageModel} 
                  onChange={(e) => setImageModel(e.target.value)}
                  placeholder={provider === 'google' ? "e.g. gemini-3.1-flash-image" : "e.g. google/gemini-3.1-flash-image"}
                />
              </label>

              <button className="save-key-btn" onClick={handleSaveKey}>Save Configuration</button>
              
              {(localStorage.getItem('gemini_api_key') || localStorage.getItem('openrouter_api_key')) && (
                <button className="icon-button" style={{ color: '#ef4444', width: 'fit-content', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid #ef4444', marginTop: '1rem' }} onClick={clearKey}>
                  Clear Settings
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="ai-content">
                {messages.map((msg, index) => (
                  <div key={index} className={`message ${msg.role}${msg.isError ? ' error' : ''}`}>
                    {/* Render message simply for now */}
                    {msg.content.split('\n').map((line, i) => {
                      if (line.startsWith('`/generate')) {
                        return <p key={i} className="prompt-suggestion" onClick={() => setInputValue(line.replace(/`/g, ''))}>{line.replace(/`/g, '')}</p>
                      }
                      return <p key={i}>{renderInline(line)}</p>
                    })}
                    {msg.image && <img src={msg.image} alt="Generated" className="chat-generated-image" />}
                  </div>
                ))}
                {isTyping && (
                  <div className="typing-indicator">
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              <form className="ai-input-area" onSubmit={handleSendMessage}>
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask about characters or /generate..."
                  disabled={isTyping}
                />
                <button type="submit" className="send-button" disabled={!inputValue.trim() || isTyping}>
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {!isOpen && (
        <button className="ai-assistant-toggle" onClick={() => setIsOpen(true)}>
          <MessageCircle size={28} />
        </button>
      )}
    </div>
  );
};

export default AIAssistant;
