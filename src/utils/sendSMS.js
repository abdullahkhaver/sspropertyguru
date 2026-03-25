/**
 * Send OTP via Twilio SMS
 * 
 * Required .env variables:
 *   TWILIO_ACCOUNT_SID=your_account_sid
 *   TWILIO_AUTH_TOKEN=your_auth_token
 *   TWILIO_PHONE_NUMBER=your_twilio_number
 */

import twilio from 'twilio';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

let twilioClient = null;

if (TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN) {
    try {
        twilioClient = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
        console.log('✅ Twilio SMS client initialized');
    } catch (error) {
        console.error('❌ Twilio initialization error:', error);
    }
} else {
    console.warn('⚠️ Twilio not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER to .env');
}

/**
 * Send OTP via Twilio SMS
 * @param {string} phone - Phone number
 * @param {string} otp - 6-digit OTP code
 */
export const sendOTPViaSMS = async (phone, otp) => {
    if (!twilioClient) {
        throw new Error('SMS service not configured. Please add Twilio credentials to .env');
    }

    let formattedPhone = phone.trim().replace(/\s/g, '');
    if (formattedPhone.startsWith('0')) formattedPhone = formattedPhone.substring(1);
    if (!formattedPhone.startsWith('+')) formattedPhone = `+91${formattedPhone}`;

    console.log(`[SMS] Sending OTP to: ${formattedPhone}`);

    const message = await twilioClient.messages.create({
        body: `Your SS Property Guru OTP is: ${otp}\n\nValid for 10 minutes. Do not share with anyone.`,
        from: TWILIO_PHONE_NUMBER,
        to: formattedPhone,
    });

    console.log('✅ SMS sent. SID:', message.sid);
    return { success: true, messageId: message.sid };
};

/**
 * Check if Twilio is configured
 */
export const isTwilioConfigured = () => twilioClient !== null;
