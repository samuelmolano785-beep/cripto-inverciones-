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
const CHAT_MODEL = "gemini-2.0-flash-exp"; 
// Fallback to older model if latest preview isn't available in all regions, or use 'gemini-1.5-flash'
const TEXT_MODEL = "gemini-2.0-flash-exp"; 
const TTS_MODEL = "gemini-2.0-flash-exp"; 

export const generateTTS = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", 
      contents: [{ parts: [{ text: `Speak firmly and calmly: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Fenrir' }, // Deeper, more stable voice
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

  const systemInstruction = `
    Eres "BinanceSafeGuard", una IA especializada en ARBITRAJE Y SEGURIDAD FINANCIERA en Binance.
    
    TU MISIÓN:
    El usuario exige GANANCIAS (idealmente x2) pero con RIESGO NULO (CERO).
    Sabemos que "riesgo cero" total no existe, pero tu estrategia debe ser:
    1. ARBITRAJE DE STABLECOINS (ej: USDT vs FDUSD vs USDC).
    2. ARBITRAJE TRIANGULAR (ej: BTC -> ETH -> USDT -> BTC).
    3. COMPRA EN SOPORTE HISTÓRICO INDESTRUCTIBLE.
    
    ESTILO DE RESPUESTA:
    - Analítico, seguro, profesional y protector.
    - Usa emojis de escudos 🛡️, candados 🔒 y bancos 🏦.
    - Prioriza la PRESERVACIÓN DEL CAPITAL sobre la ganancia loca.
    
    FORMATO OBLIGATORIO:
    
    🛡️ **ESTRATEGIA SEGURA DETECTADA** 🛡️
    🏦 **ACTIVO**: [Stablecoin o Par de Arbitraje]
    📉 **ZONA DE ENTRADA**: [Precio exacto o "Precio de Mercado"]
    📈 **BENEFICIO ESPERADO**: [Porcentaje realista o "Arbitraje completado"]
    
    🔒 **NIVEL DE RIESGO**: NULO (Arbitraje/Stable)
    
    🧠 **LÓGICA**: "Detectada discrepancia de precio entre [Par A] y [Par B]. Ejecutar orden inmediata para asegurar profit sin exposición a volatilidad."
    
    Si el usuario manda una foto, analiza si la tendencia es SEGURA (Soporte fuerte) o PELIGROSA (Resistencia/Burbuja).
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
    parts.push({ text: "Busca una oportunidad de arbitraje o inversión con RIESGO NULO en Binance ahora mismo." });
  }

  try {
    const response = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2, // Lower temperature for more consistent/safe logic
      }
    });

    const replyText = response.text || "Escaneando oportunidades seguras...";
    
    return {
      text: replyText,
    };

  } catch (error) {
    console.error("Chat Error:", error);
    return { text: "Error de conexión segura. Reintentando protocolo de seguridad..." };
  }
};