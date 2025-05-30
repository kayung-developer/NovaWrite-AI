// api/generateContent.js
import { db, auth } from './_firebaseAdmin'; // Use the helper
// Import AI SDKs, e.g.,
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

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
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
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
    const userPlan = userData.plan;

    const creditCost = template ? (template.creditCost || 10) : 10;

    if (userCredits !== -1 && userCredits < creditCost) {
      return res.status(403).json({ error: 'Not enough credits.' });
    }

    let modelToUse = "default-ai-model";
    let modelUsedForDisplay = "Standard AI";
    // ... (Your AI model selection logic based on userPlan, aiModelPreference) ...
    // ... (Use process.env.OPENAI_API_KEY etc. for AI SDKs) ...

    // --- Replace with actual AI API Call ---
    // Example with OpenAI (ensure 'openai' package is in package.json and OPENAI_API_KEY is set)
    /*
    let generatedText;
    try {
        const completion = await openai.chat.completions.create({
            model: modelToUse, // e.g., "gpt-3.5-turbo" or "gpt-4" if userPlan allows
            messages: [{ role: "user", content: `Generate content about: ${topic}, template: ${template?.name || 'General'}, language: ${language}` }],
        });
        generatedText = completion.choices[0].message.content;
    } catch (aiError) {
        console.error("AI API Error:", aiError);
        return res.status(500).json({ error: "Failed to generate content from AI." });
    }
    */
    let generatedText = `(Vercel) Generated for: ${topic} using ${modelUsedForDisplay} in ${language}. Template: ${template?.name}`;
    // --- End AI API Call ---

    if (userCredits !== -1) {
      await userDocRef.update({ credits: admin.firestore.FieldValue.increment(-creditCost) });
    }

    res.status(200).json({
      text: generatedText,
      creditsUsed: creditCost,
      modelUsed: modelUsedForDisplay,
    });

  } catch (error) {
    console.error('Error in generateContent function:', error);
    res.status(500).json({ error: 'Internal Server Error', details: error.message });
  }
}
