
import { GoogleGenAI, Type } from "@google/genai";
import { DevotionalPost } from "../types";

// Always use the process.env.API_KEY string directly when initializing the @google/genai client instance
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const geminiService = {
  async generateSundayReflection(posts: DevotionalPost[]): Promise<string> {
    const postsSummary = posts.map(p => `- ${p.scripture}: ${p.lesson}`).join('\n');
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise estes devocionais da semana e crie uma mensagem de encorajamento (estilo áudio de 1 minuto transcrito) focada em "O que Deus construiu em nós esta semana?". 
      Seja caloroso, bíblico e encorajador.
      
      Devocionais:\n${postsSummary}`,
      config: {
        systemInstruction: "Você é um mentor espiritual encorajador em um grupo de devocional. Seu tom é amigável, acolhedor e focado na graça.",
      }
    });

    return response.text || "Deus trabalhou em nossos corações esta semana de forma maravilhosa. Continuem firmes!";
  },

  async getDailyEncouragement(): Promise<string> {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Dê uma frase curta e poderosa de encorajamento para alguém que acabou de fazer seu devocional diário.",
      config: {
        systemInstruction: "Seja breve, inspirador e use um tom de comunidade cristã.",
      }
    });
    return response.text || "Bom trabalho em manter a constância!";
  }
};
