// api/generateContent.js
import admin, { db, auth } from './_firebaseAdmin'; // <<< CORRECTED IMPORT for default 'admin'
// Import AI SDKs, e.g.,
import OpenAI from 'openai'; // Ensure 'openai' is in package.json

// Initialize OpenAI client - ensure OPENAI_API_KEY is set in Vercel
let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
    console.error("OPENAI_API_KEY environment variable is not set!");
    // openai will be undefined, calls to it will fail. Function should handle this.
}

export default async function handler(req, res) {
  if (!openai) {
    // If openai client isn't initialized, return an error immediately.
    console.error("OpenAI client not initialized due to missing API key.");
    return res.status(500).json({ error: 'Internal Server Configuration Error: AI service not available.' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  console.log("generateContent function invoked. Body:", req.body);

  const { topic, template, language, aiModelPreference } = req.body;
  const idToken = req.headers.authorization?.split('Bearer ')[1];

  if (!idToken) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  let decodedToken;
  try {
    decodedToken = await auth.verifyIdToken(idToken);
  } catch (error) {
    console.error('Error verifying ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token', details: error.message });
  }

  const userId = decodedToken.uid;

  try {
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User profile not found.' });
    }
    const userData = userDoc.data();
    let userCredits = userData.credits;
    const userPlan = userData.plan; // e.g., "Basic", "Premium", "Ultimate"

    const creditCost = template ? (Number(template.creditCost) || 10) : 10; // Ensure creditCost is a number

    if (userCredits !== -1 && userCredits < creditCost) {
      return res.status(403).json({ error: 'Not enough credits.' });
    }

    let modelToUse = "gpt-3.5-turbo"; // Default model
    let modelUsedForDisplay = "GPT-3.5 Turbo";

    // Implement your model selection logic here
    if (userPlan === "Ultimate" && aiModelPreference) {
        // Example: map friendly names from client to actual model IDs
        if (aiModelPreference === "gpt-4") { modelToUse = "gpt-4"; modelUsedForDisplay = "GPT-4"; }
        else if (aiModelPreference === "gemini-pro") { modelToUse = "gemini-1.0-pro"; modelUsedForDisplay = "Gemini Pro"; } // Need Google SDK
        // Add more models for Ultimate
    } else if (userPlan === "Premium") {
        modelToUse = "gpt-3.5-turbo"; // Or another premium-tier model
        modelUsedForDisplay = "GPT-3.5 Turbo (Premium)";
    }
    // Basic plan uses the default gpt-3.5-turbo

    console.log(`User Plan: ${userPlan}, Selected AI Pref: ${aiModelPreference}, Using model: ${modelToUse}`);
    console.log(`Attempting to use OpenAI model: ${modelToUse}`); // Log this!

    let generatedText;
    // --- Actual AI API Call ---
    if (modelToUse.startsWith("gpt")) { // Check if it's an OpenAI model
        try {
            const completion = await openai.chat.completions.create({
                model: modelToUse,
                messages: [{ role: "user", content: `Generate content about: ${topic}, based on template (if any): ${template?.name || 'General prompt'}, in language: ${language}` }],
            });
            generatedText = completion.choices[0].message.content;
            if (!generatedText) throw new Error("OpenAI returned empty content.");
        } catch (aiError) {
            console.error("OpenAI API Error:", aiError.response ? aiError.response.data : aiError.message);
            return res.status(500).json({ error: "Failed to generate content from OpenAI.", details: aiError.message });
        }
    } else if (modelToUse.startsWith("gemini")) {
        // Placeholder for Google Gemini SDK call
        console.warn("Gemini model selected but SDK integration is a placeholder.");
        generatedText = `(Placeholder for Gemini ${modelToUse}) Generated for: ${topic}`;
        // return res.status(501).json({ error: "Gemini integration not yet implemented." });
    } else {
        console.error("Unsupported model type:", modelToUse);
        return res.status(500).json({ error: "Configured AI model is not supported." });
    }
    // --- End AI API Call ---

    if (userCredits !== -1) {
      // Use the default admin export for FieldValue
      await userDocRef.update({ credits: admin.firestore.FieldValue.increment(-creditCost) });
    }
    console.log(`generateContent successful for user: ${userId}. Credits used: ${creditCost}`);
    res.status(200).json({
      text: generatedText,
      creditsUsed: creditCost,
      modelUsed: modelUsedForDisplay,
    });

  } catch (error) {
    console.error('Error in generateContent function (after auth):', error.stack);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
