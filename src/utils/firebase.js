import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const serviceAccountPath = join(__dirname, '../../firebase-admin-key.json');

try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });

    console.log('✅ Firebase Admin initialized');
} catch (error) {
    console.error('❌ Firebase Admin initialization error:', error.message);
    console.warn('Push notifications will not work without a valid firebase-admin-key.json');
}

/**
 * Send Push Notification to a specific token
 */
export const sendPushNotification = async (token, title, body, data = {}) => {
    if (!admin.apps.length) return null;

    const message = {
        notification: { title, body },
        data: {
            ...data,
            click_action: 'FLUTTER_NOTIFICATION_CLICK', // Common for RN too
        },
        token: token,
    };

    try {
        const response = await admin.messaging().send(message);
        console.log('✅ Successfully sent message:', response);
        return response;
    } catch (error) {
        console.error('❌ Error sending message:', error);
        return null;
    }
};

/**
 * Send Push Notification to multiple tokens
 */
export const sendMulticastNotification = async (tokens, title, body, data = {}) => {
    if (!admin.apps.length || !tokens || tokens.length === 0) return null;

    const message = {
        notification: { title, body },
        data,
        tokens: tokens.filter(t => t && t !== 'dummy_token'),
    };

    if (message.tokens.length === 0) return null;

    try {
        const response = await admin.messaging().sendEachForMulticast(message);
        console.log(`${response.successCount} messages were sent successfully`);
        return response;
    } catch (error) {
        console.error('❌ Error sending multicast message:', error);
        return null;
    }
};

export default admin;
