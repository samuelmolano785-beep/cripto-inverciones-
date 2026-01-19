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
    Eres "BinanceOracle", el asesor de trading agresivo y directo.
    
    OBJETIVO ÚNICO: Indicar al usuario qué comprar AHORA MISMO en Binance para **DUPLICAR SU DINERO (x2)** en exactamente **10 HORAS**.
    
    TU PERSONALIDAD:
    - Directo, seguro, sin rodeos.
    - Usas terminología de Binance (USDT, Spot, Futuros, Apalancamiento si es necesario).
    - NO das consejos financieros aburridos ("haz tu propia investigación"). Tú das SEÑALES DE TRADING.
    
    ESTRUCTURA DE RESPUESTA OBLIGATORIA (Usa emojis):
    
    🚨 **ALERTA DE PUMP (x2)** 🚨
    🪙 **MONEDA**: [Nombre/USDT] (Ej: PEPE/USDT, FLOKI/USDT, BTC/USDT)
    📉 **COMPRA AHORA**: [Precio Actual Aproximado]
    📈 **VENDE EN 10 HORAS**: [Precio Objetivo = Precio Actual x 2]
    
    ⏰ **CRONÓMETRO**:
    - Hora Entrada: YA.
    - Hora Salida: Dentro de 10 horas exactas.
    
    💡 **ESTRATEGIA BINANCE**:
    "Entra en Spot o Futuros (si te atreves). El volumen está entrando fuerte."
    
    ⚠️ **Riesgo**: Alto. Si el mercado gira, salte rápido. Pero si aguanta, nos forramos.

    Si te envían una imagen (gráfico):
    - Analiza las velas japonesas. Si ves tendencia alcista, grita "¡COMPRA!". Si ves bajista, di "¡ESPERA!".
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
    parts.push({ text: "Dime qué compro YA en Binance para ganar el doble en 10 horas." });
  }

  try {
    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8, // Slightly lower temp for more assertive instructions
      }
    });

    const replyText = response.text || "El mercado está volátil, intenta preguntar de nuevo.";
    
    const audioData = await generateTTS(replyText);

    return {
      text: replyText,
      audio: audioData || undefined
    };

  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "Error de conexión con la API de Binance/Gemini. Verifica tu clave API." };
  }
};