const { GoogleGenAI } = require("@google/genai");

const MODEL = "gemini-3.6-flash";
let ai;

function client() {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("GEMINI_API_KEY is missing. Set it in server/.env to use AI features.");
    error.status = 503;
    throw error;
  }
  if (!ai) ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return ai;
}

async function generate(parts) {
  const response = await client().models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts }],
  });
  if (!response.text?.trim()) throw new Error("Gemini returned an empty response. Please try again.");
  return response.text.trim();
}

async function foodAdvice(pdfBuffer, context) {
  const content = await generate([
    { inlineData: { mimeType: "application/pdf", data: pdfBuffer.toString("base64") } },
    { text: `Review this blood report for general nutrition guidance. BMI: ${context.bmi ?? "unknown"} (${context.bmiCategory || "unknown"}). Average sleep over the last 7 days: ${context.averageSleep ?? "not logged"} hours. The person often sleeps late at night. Briefly call out any low or abnormal values, especially hemoglobin. Suggest Indian-friendly iron-rich foods and pair iron with vitamin C foods where useful. Include two practical sleep tips. Do not diagnose or recommend changing medication. End with exactly this sentence: "General guidance only - please consult a doctor."` },
  ]);
  const ending = "General guidance only - please consult a doctor.";
  const escapedEnding = ending.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return `${content.replace(new RegExp(`\\s*${escapedEnding}\\s*$`), "").trim()}\n\n${ending}`;
}

function daySummary({ date, score, breakdown }) {
  return generate([{
    text: `Write a friendly 3-4 sentence end-of-day summary and one practical tip for tomorrow. Date: ${date}. Score: ${score}/100. Categories: ${JSON.stringify(breakdown)}. Keep it encouraging and specific. Do not shame the user.`,
  }]);
}

module.exports = { daySummary, foodAdvice };
