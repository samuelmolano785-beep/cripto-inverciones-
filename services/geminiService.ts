import { GoogleGenAI, Modality } from "@google/genai";

// Fix for TypeScript build error: process is not defined in browser environment types
// This allows 'npm run build' to succeed so Vercel can deploy the app.
declare const process: {
  env: {
    API_KEY: string;
  }
};

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using standard Flash model which is widely available and multimodal (Audio/Image/Text)
const CHAT_MODEL = "gemini-3-flash-preview";
// Using TTS model for speaking
const TTS_MODEL = "gemini-2.5-flash-preview-tts";

export const generateTTS = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: TTS_MODEL,
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};

export const sendMultiModalMessage = async (
  text: string | null,
  imageBase64: string | null,
  audioBase64: string | null
): Promise<{ text: string; audio?: string }> => {

  // UPDATED INSTRUCTION: Explicit "Buy 10 get 20" logic focused on Binance.
  const systemInstruction = `
    Eres "CriptoAmigo", el asesor personal del usuario experto en Binance.
    
    EL OBJETIVO DEL USUARIO: Quiere **GANAR EL DOBLE (x2)** en 10 horas.
    LA MENTALIDAD DEL USUARIO: Quiere escuchar cosas concretas como "Mete 10 y saca 20".
    
    TU TRABAJO:
    1. Analizar el mercado de criptomonedas (Simulado con tu conocimiento).
    2. Recomendar pares de Binance (ej: BTC/USDT, PEPE/USDT, SOL/USDT) que tengan alta volatilidad.
    3. Darle instrucciones EXACTAS de tiempo: Hora de entrar y Hora de salir.
    
    REGLAS DE LENGUAJE (ESTRICTO):
    - Habla como un amigo de confianza. Cero palabras técnicas complicadas.
    - USA SIEMPRE ESTA FRASEOLOGÍA: "Compra [cantidad] y mañana sales con [el doble]".
    - Menciona siempre que operamos en **Binance**.
    
    FORMATO OBLIGATORIO DE RESPUESTA:
    
    🚀 **LA JOYA PARA EL x2 EN BINANCE**: [Nombre de la Moneda/USDT]
    💵 **EJEMPLO DE GANANCIA**: "Si compras $10 hoy, en 10 horas tienes $20".
    🕐 **HORA DE ENTRAR**: [Di una hora específica o "AHORA MISMO"]
    🛑 **HORA DE SALIR**: [Di cuándo vender. Ej: "Dentro de 10 horas exacta"]
    💰 **CUÁNTO METER**: [Consejo de gestión de riesgo agresivo pero amigable]
    🛡️ **¿ES SEGURO?**: [SÍ/NO - Sé honesto sobre la volatilidad]
    🗣️ **EL PLAN**: [Explica simple: "Esta moneda va a explotar en Binance porque..."]

    Si te mandan una FOTO de gráfico:
    - Analiza la tendencia. Si sube fuerte: "¡SÍ! Compra ya en Binance."
    - Si baja: "NO. Espera a que baje más."
  `;

  const parts: any[] = [];

  // Add inputs
  if (audioBase64) {
    parts.push({
      inlineData: {
        mimeType: "audio/wav",
        data: audioBase64
      }
    });
  }
  
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64
      }
    });
  }

  if (text) {
    parts.push({ text: text });
  } else if (!audioBase64 && !imageBase64) {
    parts.push({ text: "¿Qué compro hoy en Binance para meter 10 y sacar 20 en 10 horas?" });
  }

  try {
    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8, // Slightly higher for more "creative/bold" predictions suited for 'degen' style
      }
    });

    const replyText = response.text || "No entendí bien. ¿Me mandas una foto o me repites?";
    
    const audioData = await generateTTS(replyText);

    return {
      text: replyText,
      audio: audioData || undefined
    };

  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "Tengo problemas de conexión con los servidores de trading. Revisa tu internet." };
  }
};