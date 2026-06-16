import { GoogleGenAI, Type } from "@google/genai";

export default async function handler(req: any, res: any) {
  // Check method
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const { text, instruction } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Missing required field: text is required." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing on the server. Please add it to your project environment variables on Vercel." });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build-vercel',
        }
      }
    });

    const prompt = `You are a professional educational copywriter and curriculum consultant.
Rewrite or improve the following text from a school lesson plan.
Original text: "${text}"
Teacher's preference/instruction/tone target: "${instruction || "Improve general professional style and clarity"}"

Please make sure the output:
- Responds directly to the request
- Keeps formatting short and concise (suitable for a single text field or bullet point in a lesson plan table/list)
- Returns the final rewritten text inside the JSON payload.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful educational consultant. Improve, simplify, explain, or rewrite a snippet of a lesson plan per the user's specific request. Provide a clean, short, punchy, and professional pedagogical replacement.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rewrittenText: { type: Type.STRING, description: "The final rewritten and polished version of the input text snippet." }
          },
          required: ["rewrittenText"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response text received from Gemini.");
    }

    const result = JSON.parse(responseText.trim());
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error rewriting lesson plan section on Vercel:", error);
    return res.status(500).json({ error: error.message || "An unexpected error occurred while rewriting on the server." });
  }
}
