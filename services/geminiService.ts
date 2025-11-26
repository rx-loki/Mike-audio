
import { GoogleGenAI } from "@google/genai";
import { TEXT_MODEL } from "../constants";

// Do not cache the instance globally to ensure fresh API key on usage if changed
const getAI = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const translateText = async (
  text: string,
  targetLanguage: string,
  sourceLanguage: string = 'auto'
): Promise<string> => {
  try {
    const client = getAI();
    
    // Construct prompt based on whether source language is specified
    const sourceInstruction = sourceLanguage !== 'auto' 
      ? ` from ${sourceLanguage}` 
      : '';
      
    const prompt = `Translate the following text${sourceInstruction} into ${targetLanguage}. Return only the translated text, no additional commentary.\n\nText: "${text}"`;

    const response = await client.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
    });
    
    return response.text || "Translation failed.";
  } catch (error) {
    console.error("Translation Error:", error);
    throw error;
  }
};
