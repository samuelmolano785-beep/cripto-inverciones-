import React, { useState, useRef, useEffect } from 'react';
import Navbar from './components/Navbar';
import Disclaimer from './components/Disclaimer';
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
      text: '🤑 **BINANCE ORACLE ACTIVADO** 🤑\n\nEstoy conectado a la red.\n¿Quieres saber qué comprar YA para **multiplicar x2 en 10 horas**?\n\nPulsa el botón "🚀 DAME LA SEÑAL" 👇 o pregúntame cualquier cosa sobre Binance.',
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

    const result = await sendMultiModalMessage(
      textToSend || null,
      selectedImage,
      audioBase64 || null
    );

    setLoading(false);

    const newAiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'model',
      text: result.text,
      audio: result.audio,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newAiMsg]);

    if (result.audio && audioContextRef.current) {
      await playAudioFromBase64(result.audio, audioContextRef.current);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-crypto-dark text-crypto-text font-sans">
      <Navbar />
      
      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-36">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-lg ${
                msg.role === 'user' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-tr-none' 
                  : 'bg-crypto-card border border-gray-800 text-gray-100 rounded-tl-none'
              }`}
            >
              {msg.image && (
                <img src={msg.image} alt="User upload" className="rounded-lg mb-3 max-h-64 border border-gray-600" />
              )}
              
              <div className="whitespace-pre-line leading-relaxed text-sm md:text-base">
                {msg.text}
              </div>

              {msg.role === 'model' && (
                <div className="mt-2 text-[10px] text-gray-500 flex items-center justify-between">
                   <span>Binance Oracle AI</span>
                   <span>{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              )}
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
             <div className="bg-crypto-card border border-gray-800 rounded-2xl rounded-tl-none p-4 flex items-center space-x-2">
                <div className="w-2 h-2 bg-crypto-accent rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
                <div className="w-2 h-2 bg-crypto-accent rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                <div className="w-2 h-2 bg-crypto-accent rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
        
        <Disclaimer />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 w-full bg-crypto-card border-t border-gray-800 p-4 pb-6 z-40 shadow-[0_-5px_20px_rgba(0,0,0,0.5)]">
        <div className="container mx-auto max-w-4xl flex flex-col gap-3">
            
            {/* Quick Actions */}
            {messages.length < 3 && (
                <button 
                    onClick={() => handleSendMessage("¿Qué compro YA en Binance para ganar el doble en 10 horas?", undefined)}
                    className="mx-auto bg-crypto-accent hover:bg-yellow-400 text-crypto-dark font-bold text-sm py-2 px-6 rounded-full transition-colors mb-2 animate-pulse"
                >
                    🚀 SEÑAL x2 EN 10H
                </button>
            )}

            {selectedImage && (
                <div className="flex items-center gap-2 bg-gray-800/50 p-2 rounded-lg w-fit">
                    <span className="text-xs text-green-400">Imagen adjunta</span>
                    <button onClick={() => setSelectedImage(null)} className="text-gray-400 hover:text-white">✕</button>
                </div>
            )}

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-full bg-gray-800 text-crypto-accent hover:bg-gray-700 transition-colors"
                    title="Subir gráfico"
                >
                    📷
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageSelect}
                />

                <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Pregunta sobre Binance..."
                    className="flex-1 bg-gray-900 text-white rounded-full px-5 py-3 border border-gray-700 focus:border-crypto-accent focus:outline-none placeholder-gray-500"
                    disabled={loading || isRecording}
                />

                <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-3 rounded-full transition-all duration-300 ${
                        isRecording 
                        ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(220,38,38,0.7)]' 
                        : 'bg-gray-800 text-crypto-accent hover:bg-gray-700'
                    }`}
                >
                    {isRecording ? '⏹' : '🎤'}
                </button>

                <button 
                    onClick={() => handleSendMessage()}
                    disabled={loading || (!inputText && !selectedImage)}
                    className="p-3 rounded-full bg-crypto-accent text-crypto-dark font-bold hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    ➤
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;