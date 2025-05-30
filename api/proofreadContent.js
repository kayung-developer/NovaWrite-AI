// api/proofreadContent.js
import { db, auth } from './_firebaseAdmin';
// import AI SDKs for proofreading if needed

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { textToProofread } = req.body;
    const idToken = req.headers.authorization?.split('Bearer ')[1];

    if (!idToken) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    let decodedToken;
    try {
        decodedToken = await auth.verifyIdToken(idToken);
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
    const userId = decodedToken.uid;

    try {
        const userDocRef = db.collection('users').doc(userId);
        const userDoc = await userDocRef.get();
        if (!userDoc.exists) return res.status(404).json({ error: 'User not found' });

        const userData = userDoc.data();
        let userCredits = userData.credits;
        const creditCost = 5; // Example

        if (userCredits !== -1 && userCredits < creditCost) {
            return res.status(403).json({ error: 'Not enough credits for proofreading.' });
        }

        // --- Replace with actual AI Proofreading Call ---
        const improvedText = textToProofread.replace(/eror/gi, "error").replace(/teh/gi, "the");
        const suggestions = "(Vercel) Checked for common typos.";
        // --- End AI Proofreading Call ---


        if (userCredits !== -1) {
            await userDocRef.update({ credits: admin.firestore.FieldValue.increment(-creditCost) });
        }

        res.status(200).json({
            improvedText,
            suggestions,
            creditsUsed: creditCost
        });

    } catch (error) {
        console.error('Error in proofreadContent:', error);
        res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}
