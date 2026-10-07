const { GoogleGenAI } = require("@google/genai");
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL = "gemini-2.5-flash";

async function ask(parts) {
  const r = await ai.models.generateContent({ model: MODEL, contents: [{ role: "user", parts }] });
  return r.text;
}

exports.foodAdvice = (pdfBuffer, ctx) => ask([
  { inlineData: { mimeType: "application/pdf", data: pdfBuffer.toString("base64") } },
  { text: `This is my blood report. Context: BMI ${ctx.bmi || "unknown"} (${ctx.bmiCategory || ""}), average sleep ${ctx.sleep || "unknown"} hours, I often sleep late at night.
1. List any abnormal values (especially hemoglobin).
2. Suggest foods (Indian-friendly) to improve them, including iron + vitamin C pairing if hemoglobin is low.
3. Give 2 tips for better sleep.
Keep it short, with bullet points. End with: "General guidance only - please consult a doctor."` },
]);

exports.daySummary = (data) => ask([
  { text: `Write a short, friendly 3-4 sentence summary of my day and one tip for tomorrow.
Score: ${data.score}/100. Breakdown: ${JSON.stringify(data.breakdown)}.
Screen usage today: ${data.usage ? `Chrome opened ${data.usage.chromeOpens} times for ${data.usage.chromeMinutes} minutes; YouTube opened ${data.usage.youtubeOpens} times for ${data.usage.youtubeMinutes} minutes.` : "No Android app usage data was synced today."}
Comment briefly on screen time without judging the user.` },
]);
