import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initFirebase = () => {
    if (admin.apps.length > 0) return;

    // Option 1: FIREBASE_SERVICE_ACCOUNT env var (Railway / production)
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            console.log('✅ Firebase Admin initialized from env var');
            return;
        } catch (err) {
            console.error('❌ Firebase init from env var failed:', err.message);
        }
    }

    // Option 2: Local file (development)
    const keyPath = join(__dirname, '../../firebase-admin-key.json');
    if (existsSync(keyPath)) {
        try {
            const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));
            admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
            console.log('✅ Firebase Admin initialized from local file');
            return;
        } catch (err) {
            console.error('❌ Firebase init from local file failed:', err.message);
        }
    }

    console.warn('⚠️  Firebase Admin NOT initialized. Push notifications disabled.');
    console.warn('   → Set FIREBASE_SERVICE_ACCOUNT env var on Railway to enable.');
};

initFirebase();

/**
 * Send push notification to a single FCM token
 */
export const sendPushNotification = async (token, title, body, data = {}) => {
    if (!admin.apps.length) return null;

    try {
        const response = await admin.messaging().send({
            notification: { title, body },
            data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
            token,
            android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
            apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        });
        console.log('✅ Push sent:', response);
        return response;
    } catch (err) {
        console.error('❌ Push failed:', err.message);
        return null;
    }
};

/**
 * Send push notification to multiple FCM tokens
 */
export const sendMulticastNotification = async (tokens, title, body, data = {}) => {
    if (!admin.apps.length) {
        console.warn('[FCM] Firebase not initialized, skipping multicast');
        return null;
    }

    const validTokens = tokens.filter(t => t && t.length > 10);
    if (validTokens.length === 0) return null;

    try {
        const response = await admin.messaging().sendEachForMulticast({
            notification: { title, body },
            data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
            tokens: validTokens,
            android: { priority: 'high', notification: { sound: 'default', channelId: 'default' } },
            apns: { payload: { aps: { sound: 'default', badge: 1 } } },
        });

        console.log(`✅ Multicast: ${response.successCount}/${validTokens.length} sent`);

        if (response.failureCount > 0) {
            response.responses.forEach((r, i) => {
                if (!r.success) console.error(`  Token[${i}] failed: ${r.error?.message}`);
            });
        }

        return response;
    } catch (err) {
        console.error('❌ Multicast failed:', err.message);
        return null;
    }
};

export default admin;
