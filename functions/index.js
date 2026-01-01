const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { GoogleGenAI } = require("@google/genai");
const cors = require('cors')({ origin: true });

// Initialize Firebase Admin
admin.initializeApp();
const db = admin.firestore();

// Access the API key from Firebase environment variables
// Set this using: firebase functions:config:set gemini.key="YOUR_API_KEY"
const API_KEY = functions.config().gemini ? functions.config().gemini.key : process.env.GEMINI_API_KEY;

exports.generateContent = functions.https.onCall(async (data, context) => {
    // 1. Check authentication (Optional but recommended)
    // if (!context.auth) {
    //   throw new functions.https.HttpsError('unauthenticated', 'The function must be called while authenticated.');
    // }

    const { modelName, prompt, parts, config } = data;

    if (!API_KEY) {
        throw new functions.https.HttpsError('failed-precondition', 'API Key not configured.');
    }

    const genAI = new GoogleGenAI({ apiKey: API_KEY });
    const model = genAI.getGenerativeModel({ model: modelName || 'gemini-1.5-flash' });

    try {
        let result;
        if (parts) {
            // Multi-part content (images + text)
            result = await model.generateContent({
                contents: { role: 'user', parts: parts },
                ...config
            });
        } else {
            // Simple text prompt
            result = await model.generateContent(prompt);
        }

        const response = await result.response;
        return {
            text: response.text(),
            candidates: response.candidates
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
