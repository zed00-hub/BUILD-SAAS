const functions = require("firebase-functions");
const admin = require("firebase-admin");
// Note: @google/genai is used inside the function to avoid global scope issues or conflicts
// const { GoogleGenAI } = require("@google/genai");
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

exports.generateContent = functions
    .runWith({
        secrets: ["GEMINI_API_KEY"],
        timeoutSeconds: 540,
        memory: "2GB"
    })
    .https.onCall(async (data, context) => {
        // Get API key from secret (injected as environment variable)
        const API_KEY = process.env.GEMINI_API_KEY;

        if (!API_KEY) {
            throw new functions.https.HttpsError('failed-precondition', 'API Key not configured.');
        }

        const { modelName, prompt, parts, config } = data;

        // Initialize the new GenAI Client
        const { GoogleGenAI } = require("@google/genai");
        const client = new GoogleGenAI({ apiKey: API_KEY });

        try {
            // Prepare contents
            const contents = parts ?
                [{ role: 'user', parts: parts }] :
                [{ role: 'user', parts: [{ text: prompt }] }];

            // Call the new API method
            const result = await client.models.generateContent({
                model: modelName || 'gemini-1.5-flash',
                contents: contents,
                config: config
            });

            // Handle response - check both paths
            console.log("Gemini API Response Keys:", Object.keys(result));
            const candidates = result.candidates || result.response?.candidates;

            if (!candidates) {
                console.warn("Gemini API returned no candidates. Full result:", JSON.stringify(result));
            }

            // Helper to get text safely
            const text = candidates?.[0]?.content?.parts?.[0]?.text || "";

            return {
                text: text,
                candidates: candidates || []
            };
        } catch (error) {
            console.error("Gemini API Error:", error);
            throw new functions.https.HttpsError('internal', error.message);
        }
    });
/**
 * Scheduled function to cleanup old PAID user orders
 * Runs daily at midnight UTC
 * Deletes orders older than 30 days for users with accountType = 'paid'
 * Note: Trial users don't have saved work (they must download immediately)
 */
exports.cleanupPaidUserOrders = functions.pubsub
    .schedule('0 0 * * *') // Every day at midnight UTC
    .timeZone('UTC')
    .onRun(async (context) => {
        console.log('Starting paid user orders cleanup (30 day retention)...');

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

        try {
            // 1. Get all paid users
            const paidUsersSnapshot = await db.collection('users')
                .where('accountType', '==', 'paid')
                .get();

            if (paidUsersSnapshot.empty) {
                console.log('No paid users found.');
                return null;
            }

            const paidUserIds = paidUsersSnapshot.docs.map(doc => doc.id);
            console.log(`Found ${paidUserIds.length} paid users.`);

            let totalDeleted = 0;

            // 2. For each paid user, delete orders older than 30 days
            // Process in batches to avoid timeout
            const batchSize = 500;

            for (const userId of paidUserIds) {
                const oldOrdersSnapshot = await db.collection('orders')
                    .where('userId', '==', userId)
                    .where('createdAt', '<', cutoffTimestamp)
                    .limit(batchSize)
                    .get();

                if (oldOrdersSnapshot.empty) continue;

                const batch = db.batch();
                oldOrdersSnapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                    totalDeleted++;
                });

                await batch.commit();
                console.log(`Deleted ${oldOrdersSnapshot.size} old orders for paid user ${userId}`);
            }

            console.log(`Cleanup complete. Total orders deleted: ${totalDeleted}`);
            return { deletedCount: totalDeleted };

        } catch (error) {
            console.error('Error during cleanup:', error);
            throw error;
        }
    });

/**
 * HTTP endpoint to manually trigger cleanup (for testing)
 * Can be called by admin only
 * Cleans up paid user orders older than 30 days
 */
exports.manualCleanupPaidOrders = functions.https.onCall(async (data, context) => {
    // Check if user is admin
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated.');
    }

    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || !userDoc.data().isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required.');
    }

    console.log('Manual cleanup triggered by admin:', context.auth.uid);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

    try {
        const paidUsersSnapshot = await db.collection('users')
            .where('accountType', '==', 'paid')
            .get();

        const paidUserIds = paidUsersSnapshot.docs.map(doc => doc.id);
        let totalDeleted = 0;

        for (const userId of paidUserIds) {
            const oldOrdersSnapshot = await db.collection('orders')
                .where('userId', '==', userId)
                .where('createdAt', '<', cutoffTimestamp)
                .get();

            if (oldOrdersSnapshot.empty) continue;

            const batch = db.batch();
            oldOrdersSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
                totalDeleted++;
            });

            await batch.commit();
        }

        return {
            success: true,
            deletedCount: totalDeleted,
            message: `Deleted ${totalDeleted} old orders from paid users (30+ days old).`
        };

    } catch (error) {
        console.error('Manual cleanup error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
