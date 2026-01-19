import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import { sendMultiModalMessage } from './services/geminiService';
import { ChatMessage } from './types';

// Utility to decode and play audio
const playAudioFromBase64 = async (base64: string, ctx: AudioContext) => {
  try {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const audioBuffer = await ctx.decodeAudioData(bytes.buffer);
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch (e) {
    console.error("Error playing audio", e);
  }
};

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '👋 ¡Hola! Soy tu CriptoAmigo. \n\nMi misión es simple: **Que metas 10 y saques 20**. 🚀💰 \n\nDime "¿Qué compro?" y te digo la hora exacta de entrar y salir para ganar el doble.',
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    scrollToBottom();
    // Initialize Audio Context on user interaction (handled lazily usually, but good to have ref)
    if (!audioContextRef.current) {
       audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
    }
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- Image Handling ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data url prefix for API
        const cleanBase64 = base64.split(',')[1];
        setSelectedImage(cleanBase64); 
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Audio Recording ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          handleSendMessage(null, base64String);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Permiso de micrófono denegado.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  // --- Send Logic ---
  const handleSendMessage = async (textOverride?: string | null, audioBase64?: string) => {
    const textToSend = textOverride !== undefined ? textOverride : inputText;
    
    if (!textToSend && !selectedImage && !audioBase64) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: audioBase64 ? '🎤 Mensaje de voz enviado' : (textToSend || '📷 Imagen enviada'),
      image: selectedImage ? `data:image/jpeg;base64,${selectedImage}` : undefined,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setSelectedImage(null);
    setLoading(true);

    // Call API
    const response = await sendMultiModalMessage(
      textToSend || null,
      selectedImage, // Pass the clean base64
      audioBase64 || null
    );

    const newModelMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: response.text,
      audio: response.audio,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newModelMsg]);
    setLoading(false);

    // Auto-play audio if present
    if (response.audio && audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }
        playAudioFromBase64(response.audio, audioContextRef.current);
    }
  };

  const triggerStrategy = () => {
      handleSendMessage("Dime qué comprar para meter 10 y sacar 20. Dime la hora exacta de entrar y salir.");
  };

  return (
    <div className="flex flex-col h-screen bg-crypto-dark text-gray-100 font-sans overflow-hidden">
      <Navbar />

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 ${
                msg.role === 'user'
                  ? 'bg-crypto-card border border-gray-700 text-right'
                  : 'bg-gradient-to-br from-gray-800 to-gray-900 border border-crypto-accent/30 shadow-[0_0_10px_rgba(252,213,53,0.1)]'
              }`}
            >
              {msg.image && (
                <img src={msg.image} alt="Upload" className="rounded-lg mb-2 max-h-48 object-cover border border-gray-600" />
              )}
              
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {msg.text}
              </div>

              {msg.audio && (
                  <button 
                    onClick={() => audioContextRef.current && msg.audio && playAudioFromBase64(msg.audio, audioContextRef.current)}
                    className="mt-2 text-crypto-accent text-xs flex items-center gap-1 font-bold"
                  >
                      🔊 Escuchar consejo
                  </button>
              )}
              
              <span className="text-[10px] text-gray-500 block mt-1 opacity-70">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
             <div className="bg-gray-800 rounded-2xl p-4 flex gap-2 items-center">
                <div className="w-2 h-2 bg-crypto-accent rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-crypto-accent rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-crypto-accent rounded-full animate-bounce delay-150"></div>
                <span className="text-xs text-gray-400 ml-2">Revisando el mercado...</span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Action Button for Strategy */}
      <div className="absolute bottom-24 right-4 z-10">
         <button 
           onClick={triggerStrategy}
           className="bg-crypto-green text-white font-bold py-3 px-6 rounded-full shadow-lg border-2 border-green-400 animate-pulse text-sm flex items-center gap-2"
         >
           🚀 Buscar x2 (Mete 10 saca 20)
         </button>
      </div>

      {/* Input Area */}
      <div className="bg-crypto-card border-t border-gray-800 p-3 pb-6 fixed bottom-0 w-full z-20">
        {selectedImage && (
            <div className="flex items-center gap-2 mb-2 px-2">
                <span className="text-xs text-crypto-accent bg-gray-800 px-2 py-1 rounded">Foto lista para analizar</span>
                <button onClick={() => setSelectedImage(null)} className="text-red-400 text-xs">✕</button>
            </div>
        )}
        
        <div className="flex items-center gap-2">
          {/* Image Upload */}
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-3 bg-gray-800 rounded-full text-crypto-muted hover:text-white transition-colors"
          >
            📷
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleImageSelect} 
            accept="image/*" 
            className="hidden" 
          />

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage(null)}
            placeholder="Escribe aquí..."
            className="flex-1 bg-gray-900 border border-gray-700 text-white rounded-full px-4 py-3 focus:outline-none focus:border-crypto-accent text-sm"
          />

          {/* Mic Button */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-full transition-all ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse scale-110' 
                : 'bg-gray-800 text-crypto-muted hover:text-white'
            }`}
          >
            {isRecording ? '⏹️' : '🎙️'}
          </button>

          {/* Send Button */}
          {!isRecording && (inputText || selectedImage) && (
            <button
              onClick={() => handleSendMessage(null)}
              className="p-3 bg-crypto-accent text-crypto-dark rounded-full font-bold hover:bg-yellow-400"
            >
              ➤
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;