
import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Ensure API_KEY is available in the environment.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash';

export const translateText = async (text: string, context: string): Promise<string> => {
  const prompt = `You are an expert translator specializing in academic papers. Translate the following text into Japanese. Maintain a formal, accurate, and academic tone.
  
  The text is part of a larger document with the following overall content, use this for context:
  --- CONTEXT ---
  ${context.substring(0, 2000)}... 
  --- END CONTEXT ---

  Translate ONLY this text:
  --- TEXT TO TRANSLATE ---
  ${text}
  --- END TEXT TO TRANSLATE ---
  
  Return ONLY the translated Japanese text.`;
  
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Gemini API Error (translateText):', error);
    return "Error: Could not translate the text.";
  }
};

export const explainTerm = async (term: string, context: string): Promise<string> => {
  const prompt = `You are an expert in scientific communication. In the context of the following research paper, explain the term "${term}" in simple, easy-to-understand Japanese for a beginner in the field.
  
  --- PAPER CONTEXT (for context only) ---
  ${context.substring(0, 4000)}...
  --- END PAPER CONTEXT ---
  
  Provide a concise explanation for the term "${term}".`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error('Gemini API Error (explainTerm):', error);
    return `Error: Could not explain the term "${term}".`;
  }
};

export const extractTerms = async (text: string): Promise<string[]> => {
  const prompt = `From the following research paper text, identify and extract up to 15 key technical terms or concepts. Focus on terms that are central to the paper's topic.
  
  --- PAPER TEXT ---
  ${text.substring(0, 8000)}...
  --- END PAPER TEXT ---
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            terms: {
              type: Type.ARRAY,
              description: "A list of key technical terms from the text.",
              items: { type: Type.STRING }
            }
          }
        }
      }
    });
    
    const json = JSON.parse(response.text);
    return json.terms || [];
  } catch (error) {
    console.error('Gemini API Error (extractTerms):', error);
    return [];
  }
};
