// api/generateContent.js
import admin, { db, auth, isFirebaseAdminInitialized } from './_firebaseAdmin';
import OpenAI from 'openai'; // Ensure 'openai' is in package.json

// Initialize OpenAI client - ensure OPENAI_API_KEY is set in Vercel
let openai;
if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
} else {
    console.error("CRITICAL: OPENAI_API_KEY environment variable is not set!");
    // openai will be undefined, calls to it will fail. The handler must check this.
}

export default async function handler(req, res) {
    // 1. Check Firebase Admin SDK initialization
    if (!isFirebaseAdminInitialized || !db || !auth) {
        console.error("CRITICAL: Firebase Admin SDK not initialized in generateContent. Check _firebaseAdmin.js logs and environment variables.");
        return res.status(500).json({ error: "Internal Server Configuration Error: Backend services unavailable." });
    }

    // 2. Check OpenAI client initialization
    if (!openai) {
        // This means the API key was missing at startup.
        console.error("CRITICAL: OpenAI client not initialized due to missing API key. Cannot generate content.");
        return res.status(500).json({ error: 'Internal Server Configuration Error: AI service not available.' });
    }

    // 3. Method Check
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
        const userPlan = userData.plan;

        const creditCost = template ? (Number(template.creditCost) || 10) : 10;

        if (userCredits !== -1 && userCredits < creditCost) {
            return res.status(403).json({ error: 'Not enough credits.' });
        }

        let modelToUse = "gpt-3.5-turbo";
        let modelUsedForDisplay = "GPT-3.5 Turbo";

        if (userPlan === "Ultimate" && aiModelPreference) {
            if (aiModelPreference === "gpt-4") { modelToUse = "gpt-4"; modelUsedForDisplay = "GPT-4"; }
            else if (aiModelPreference === "gemini-pro") { modelToUse = "gemini-1.0-pro"; modelUsedForDisplay = "Gemini Pro"; }
            // Add more models for Ultimate
        } else if (userPlan === "Premium") {
            modelToUse = "gpt-3.5-turbo"; // Or another suitable model like "gemini-1.0-pro"
            modelUsedForDisplay = "GPT-3.5 Turbo (Premium)"; // Adjust display name if model changes
        }
        // Basic plan uses the default gpt-3.5-turbo

        console.log(`User Plan: ${userPlan}, Selected AI Pref: ${aiModelPreference}, Attempting to use model: ${modelToUse}`);

        let generatedText;
        if (modelToUse.startsWith("gpt")) {
            try {
                const completion = await openai.chat.completions.create({
                    model: modelToUse,
                    messages: [{ role: "user", content: `Generate content about: ${topic}, based on template (if any): ${template?.name || 'General prompt'}, in language: ${language}` }],
                });
                generatedText = completion.choices[0].message.content;
                if (!generatedText || generatedText.trim() === "") {
                     console.warn(`OpenAI returned empty or whitespace content for topic: "${topic}" with model ${modelToUse}.`);
                     generatedText = generatedText || ""; // Ensure it's at least an empty string
                }
            } catch (aiError) {
                console.error("OpenAI API Call Error:", aiError); // Log the whole error object
                let detailMessage = "Failed to generate content due to an AI service error.";
                let statusCode = 500;

                if (aiError instanceof OpenAI.APIError) {
                    statusCode = aiError.status || 500;
                    detailMessage = aiError.message; // OpenAI SDK v4+ errors are usually descriptive
                    console.error(`OpenAI API Error Details: Status ${aiError.status}, Type: ${aiError.type}, Code: ${aiError.code}, Message: ${aiError.message}`);
                } else {
                    detailMessage = aiError.message || "An unexpected error occurred while contacting the AI service.";
                }
                return res.status(statusCode).json({ error: "Failed to generate content from AI model.", details: detailMessage });
            }
        } else if (modelToUse.startsWith("gemini")) {
            console.warn("Gemini model selected but SDK integration is a placeholder for Vercel function.");
            generatedText = `(Placeholder for Vercel Gemini ${modelToUse}) Generated for: ${topic}`;
            // If you want to explicitly block this path until implemented:
            // return res.status(501).json({ error: "Gemini integration not yet implemented in this Vercel function." });
        } else {
            console.error("Unsupported model type:", modelToUse);
            return res.status(500).json({ error: "Configured AI model is not supported." });
        }

        if (userCredits !== -1) {
            await userDocRef.update({ credits: admin.firestore.FieldValue.increment(-creditCost) });
        }
        console.log(`generateContent successful for user: ${userId}. Credits used: ${creditCost}. Model: ${modelUsedForDisplay}`);
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
