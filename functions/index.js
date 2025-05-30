// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin"); // For accessing Firestore from functions
admin.initializeApp();
const db = admin.firestore();

// Example: OpenAI (GPT)
const { Configuration, OpenAIApi } = require("openai");
const openaiConfiguration = new Configuration({
  apiKey: functions.config().openai.key, // Access secret key from environment
});
const openai = new OpenAIApi(openaiConfiguration);

// Example: Google Gemini
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(functions.config().google.key);


// Helper function to check auth and get user data
async function authenticateAndGetUser(context) {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }
    const userDoc = await db.collection("users").doc(context.auth.uid).get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User data not found.");
    }
    return { uid: context.auth.uid, ...userDoc.data() };
}

// Helper to deduct credits (simplified, consider transactions for production)
async function deductUserCredits(uid, amount) {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) throw new Error("User not found for credit deduction");

    const userData = userDoc.data();
    if (userData.plan === "Ultimate" || userData.credits === -1) return true; // Unlimited

    if (userData.credits < amount) {
        throw new functions.https.HttpsError("failed-precondition", "Not enough credits.");
    }
    await userRef.update({ credits: admin.firestore.FieldValue.increment(-amount) });
    return true;
}


exports.generateContent = functions.https.onCall(async (data, context) => {
    const { topic, template, language, aiModelPreference } = data;
    let user;
    try {
        user = await authenticateAndGetUser(context);
    } catch (error) {
        console.error("Auth/User fetch error:", error);
        throw error; // Re-throw HttpsError
    }

    const planDetails = getPlanDetailsForFunction(user.plan); // You'll need a similar getPlanDetails on the backend
    const creditsNeeded = template ? template.creditCost : 20; // Or fetch template from DB

    try {
        await deductUserCredits(user.uid, creditsNeeded);
    } catch (error) {
        console.error("Credit deduction error:", error);
        throw error; // Re-throw HttpsError
    }

    let actualModelToUse = "";
    let llmProvider = "";

    if (user.plan === "Ultimate") {
        actualModelToUse = aiModelPreference || planDetails.selectableModels[0]; // e.g., "gpt-4", "gemini-pro"
        if (["gpt-3.5-turbo", "gpt-4", "gpt-4-turbo"].includes(actualModelToUse)) llmProvider = "openai";
        else if (["gemini-pro", "gemini-1.0-pro"].includes(actualModelToUse)) llmProvider = "google";
        else if (actualModelToUse.startsWith("claude")) llmProvider = "anthropic"; // Conceptual
        else llmProvider = "openai"; // Default for ultimate if somehow not matched
    } else if (user.plan === "Premium") {
        // Premium might have a preferred model or a rotation
        actualModelToUse = planDetails.defaultModel || "gpt-3.5-turbo"; // e.g. "gpt-3.5-turbo" or "gemini-pro"
        if (["gpt-3.5-turbo", "gpt-4"].includes(actualModelToUse)) llmProvider = "openai";
        else if (["gemini-pro"].includes(actualModelToUse)) llmProvider = "google";
    } else { // Basic
        actualModelToUse = planDetails.defaultModel || "gpt-3.5-turbo"; // e.g. a cost-effective model
        llmProvider = "openai";
    }

    let prompt = `Topic: ${topic}\n`;
    if (template) prompt += `Template: ${template.name}\nInstructions: ${template.description}\n`;
    prompt += `Language: ${language}\n\nGenerate content:`;

    try {
        let llmResponseText = "";
        if (llmProvider === "openai") {
            console.log(`Calling OpenAI model: ${actualModelToUse}`);
            const completion = await openai.createChatCompletion({
                model: actualModelToUse, // e.g., "gpt-3.5-turbo", "gpt-4"
                messages: [{ role: "user", content: prompt }],
                // max_tokens: 500, // Optional
            });
            llmResponseText = completion.data.choices[0].message.content.trim();
        } else if (llmProvider === "google") {
             console.log(`Calling Google Gemini model: ${actualModelToUse}`); // e.g., "gemini-pro"
            const model = genAI.getGenerativeModel({ model: actualModelToUse });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            llmResponseText = response.text();
        } else if (llmProvider === "anthropic") {
            // Placeholder for Anthropic Claude API call
            console.log(`Calling Anthropic Claude model (conceptual): ${actualModelToUse}`);
            llmResponseText = `Simulated Claude response for: ${topic} using ${actualModelToUse}.`;
            // You'd use the Anthropic SDK here
        } else {
             throw new functions.https.HttpsError("internal", "Unsupported LLM provider specified by plan.");
        }

        return { text: llmResponseText, creditsUsed: creditsNeeded, modelUsed: actualModelToUse };
    } catch (error) {
        console.error("LLM API call error:", error.response ? error.response.data : error.message);
        throw new functions.https.HttpsError("internal", "Failed to generate content from AI model.");
    }
});

// You'll need a backend version of this
function getPlanDetailsForFunction(planName) {
    const plans = {
        Basic: { name: "Basic", defaultModel: "gpt-3.5-turbo", credits: 10000, /* ... other backend relevant details */ },
        Premium: { name: "Premium", defaultModel: "gemini-pro", /* or a specific GPT model */ credits: 50000, /* ... */ },
        Ultimate: { name: "Ultimate", selectableModels: ["gpt-4", "gemini-pro", "claude-2"], credits: -1 /* Infinity */, /* ... */ }
    };
    return plans[planName || "Basic"];
}

// Set API keys in Firebase config (DO NOT COMMIT KEYS TO CODE)
// firebase functions:config:set openai.key="YOUR_OPENAI_API_KEY"
// firebase functions:config:set google.key="YOUR_GOOGLE_AI_STUDIO_KEY"
// firebase deploy --only functions