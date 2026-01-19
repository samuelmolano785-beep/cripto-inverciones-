import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Using standard Flash model which is widely available and multimodal (Audio/Image/Text)
const CHAT_MODEL = "gemini-flash-latest";
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

  // UPDATED INSTRUCTION: Explicit "Buy 10 get 20" logic.
  const systemInstruction = `
    Eres "CriptoAmigo", el asesor personal del usuario.
    
    EL OBJETIVO DEL USUARIO: Quiere **GANAR EL DOBLE (x2)**.
    LA METALIDAD DEL USUARIO: Quiere escuchar cosas concretas como "Mete 10 y saca 20".
    
    TU TRABAJO:
    1. Decirle qué comprar para intentar DUPLICAR (x2) su inversión.
    2. Usar ejemplos de dinero SIEMPRE.
    3. Darle instrucciones EXACTAS de tiempo: Hora de entrar y Hora de salir.
    
    REGLAS DE LENGUAJE (ESTRICTO):
    - Habla como un amigo de confianza. Cero palabras técnicas.
    - USA SIEMPRE ESTA FRASEOLOGÍA: "Compra [cantidad] y mañana sales con [el doble]".
    
    FORMATO OBLIGATORIO DE RESPUESTA:
    
    🚀 **LA JOYA PARA EL x2**: [Nombre de la Moneda]
    💵 **EJEMPLO DE GANANCIA**: "Si compras $10 hoy, mañana sales con $20".
    🕐 **HORA DE ENTRAR**: [Di una hora específica del día o "AHORA MISMO"]
    🛑 **HORA DE SALIR**: [Di cuándo vender. Ej: "Mañana a las 10 AM vendes todo"]
    💰 **CUÁNTO METER**: [Dile un consejo: "Mete $100", "Todo lo que puedas", "Solo $50"]
    🛡️ **¿ES SEGURO?**: [SÍ/NO]
    🗣️ **EL PLAN**: [Explica simple: "Va a subir porque todos están comprando ahora"]

    Si te mandan una FOTO de gráfico:
    - Si la línea sube fuerte: "¡SÍ! Compra 10 y mañana tienes 20."
    - Si baja o está plana: "NO. Aquí pierdes. Mejor espera."
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
    parts.push({ text: "¿Qué compro hoy para meter 10 y sacar 20?" });
  }

  try {
    const response = await ai.models.generateContent({
      model: CHAT_MODEL,
      contents: { parts: parts },
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7, 
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
    return { text: "Tengo problemas de conexión. Revisa tu internet." };
  }
};