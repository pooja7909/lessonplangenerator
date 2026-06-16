import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini SDK with server-side API Key
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API endpoint to generate the lesson plan
  app.post("/api/generate-lesson-plan", async (req, res) => {
    try {
      const { subject, yearGroup, topic, subTopic, objectives } = req.body;

      if (!subject || !yearGroup || !topic || !subTopic) {
        res.status(400).json({ error: "Missing required fields: subject, yearGroup, topic, and subTopic are required." });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing on the server. Please add it in Settings > Secrets." });
        return;
      }

      const prompt = `Generate a comprehensive professional lesson plan for:
Subject: ${subject}
Year/Grade Group: ${yearGroup}
Topic: ${topic}
Sub-Topic: ${subTopic}
${objectives ? `Teacher Objectives / Curriculum Course Specification Details: ${objectives}` : ''}

Provide detailed, practical, interactive, and realistic activities and resources. Keep formatting clean and professional. Avoid overly theoretical items. Use active verbs (e.g. analyze, describe, create).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "You are an expert school coordinator and curriculum designer. Generate a highly detailed and pedagogical lesson plan based on the user criteria. Response must be structural, concrete, and directly fit for classroom execution. Ensure a logical structure aligned with modern active learning frameworks.",
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              subject: { type: Type.STRING },
              yearGroup: { type: Type.STRING },
              topic: { type: Type.STRING },
              subTopic: { type: Type.STRING },
              duration: { type: Type.STRING, description: "Total duration, e.g. 60 minutes" },
              learningObjectives: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List 3-4 specific, measurable learning objectives using Bloom's Taxonomy."
              },
              successCriteria: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List 3-4 concrete achievement benchmarks starting with statements like 'I can...'"
              },
              resourcesAndMaterials: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "List of digital, physical, or experimental resources needed for the lesson."
              },
              lessonActivities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    activity: { type: Type.STRING, description: "Name of the activity block (e.g., Hook, Concept Introduction, Guided Practice, Assessment)" },
                    strategy: { type: Type.STRING, description: "Pedagogical strategy or method (e.g., Direct instruction, Think-Pair-Share, Live Quiz)" },
                    duration: { type: Type.INTEGER, description: "Duration in minutes" }
                  },
                  required: ["activity", "strategy", "duration"]
                },
                description: "Timeline of classroom blocks with realistic estimated durations."
              },
              assessment: {
                type: Type.OBJECT,
                properties: {
                  formative: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Formative checks during learning blocks."
                  },
                  summative: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "End of lesson checks, tickets, or quizzes."
                  }
                },
                required: ["formative", "summative"]
              },
              differentiationInclusion: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Tailored assistance blocks: support for lower-achieving and expansion stretch tasks for early finishers."
              },
              crossCurricularLinks: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Explicit links to other subjects (e.g., Math integration, science application)."
              },
              homeworkExtension: {
                type: Type.OBJECT,
                properties: {
                  homework: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Independent homework practice items."
                  },
                  extension: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Optional stretch extension activities."
                  }
                },
                required: ["homework", "extension"]
              },
              reflectionQuestions: {
                type: Type.OBJECT,
                properties: {
                  whatWentWell: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Prompts to guide reflection on positive outcomes."
                  },
                  challenges: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Prompts to guide reflection on unforeseen difficulties."
                  },
                  nextTime: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Prompts on what to adjust in subsequent deliveries."
                  }
                },
                required: ["whatWentWell", "challenges", "nextTime"]
              },
              thinkingRoutine: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: "The name of a popular visible thinking routine appropriate for this topic (e.g., 'See, Think, Wonder', '3-2-1 Bridge', 'I Used to Think... Now I Think...', 'Think, Puzzle, Explore', or 'Connect, Extend, Challenge')." },
                  phase: { type: Type.STRING, description: "The phase of the lesson to apply it. Must be exactly one of: 'starter', 'plenary', or 'exit_ticket'." },
                  description: { type: Type.STRING, description: "Brief pedagogical guidance explaining how the teacher should introduce and utilize this routine in class." },
                  prompts: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "The specific 3 customized cue questions or items representing the prompts for the selected routine (e.g., ['What do you see?', 'What do you think?', 'What do you wonder?'])."
                  }
                },
                required: ["title", "phase", "description", "prompts"]
              }
            },
            required: [
              "subject",
              "yearGroup",
              "topic",
              "subTopic",
              "duration",
              "learningObjectives",
              "successCriteria",
              "resourcesAndMaterials",
              "lessonActivities",
              "assessment",
              "differentiationInclusion",
              "crossCurricularLinks",
              "homeworkExtension",
              "reflectionQuestions",
              "thinkingRoutine"
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("No response text received from Gemini.");
      }

      const lessonPlanData = JSON.parse(responseText.trim());
      res.json(lessonPlanData);
    } catch (error: any) {
      console.error("Error generating lesson plan:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred on the server." });
    }
  });

  // API endpoint to rewrite a specific lesson section or text field
  app.post("/api/rewrite-section", async (req, res) => {
    try {
      const { text, instruction } = req.body;

      if (!text) {
        res.status(400).json({ error: "Missing required field: text is required." });
        return;
      }

      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing on the server. Please add it in Settings > Secrets." });
        return;
      }

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
      res.json(result);
    } catch (error: any) {
      console.error("Error rewriting lesson plan section:", error);
      res.status(500).json({ error: error.message || "An unexpected error occurred while rewriting on the server." });
    }
  });

  // Serve static assets in production, otherwise Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
