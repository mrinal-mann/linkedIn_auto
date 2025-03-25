import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());
const GEMINI_API_KEY = "AIzaSyAevQIxTA2ssCK_qkCCmSs8RhexbWiuWbE";
console.log("GEMINI_API_KEY", GEMINI_API_KEY);
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

app.post("/check-high-priority", async (req, res) => {
  const { highPriorityKeywords, previewText } = req.body;

  if (!highPriorityKeywords || !previewText) {
    return res
      .status(400)
      .json({ error: "Missing highPriorityKeywords or previewText" });
  }

  const prompt = `These are high priority keywords ${JSON.stringify(
    highPriorityKeywords
  )}.
This is preview text - "${previewText}".
Kindly tell if the preview text is of high priority. Answer "yes" or "no" and provide an array of most suitable one or at maximum two keywords matched.`;

  const prompt1 = `These are high priority keywords ["offer", "job"]. This is preview text - "You hae got a job offer". Kindly tell if the preview text is of high priority. Answer yes or no and provide an array of most suitable one or at maximum two keywords matched.`;
  const prompt2 = `yes ["job", "offer"]`;

  try {
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: prompt1 }],
        },
        {
          role: "model",
          parts: [{ text: prompt2 }],
        },
      ],
    });

    let result = await chat.sendMessage(prompt);

    const responseText = result.response.text().trim(); // e.g., "yes [\"job\", \"offer\"]" or "no []"
    console.log("Raw response:", responseText);

    // Parse the response into an object.
    // Expected format: "yes [\"keyword1\", \"keyword2\"]" or "no []"
    const match = responseText.match(/^(yes|no)\s+(\[.*\])$/i);
    if (match) {
      const isHighPriority = match[1].toLowerCase() === "yes";
      let keywords = [];
      try {
        keywords = JSON.parse(match[2]);
      } catch (err) {
        console.error("Error parsing keywords array:", err);
      }

      const responseObject = { isHighPriority, keywords };
      console.log("responseObject", responseObject);
      return res.json(responseObject);
    } else {
      return res
        .status(500)
        .json({ error: "Unexpected response format", raw: responseText });
    }
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res
      .status(500)
      .json({ error: "Error processing request", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`Gemini API Key Server running on port ${port}`);
});
