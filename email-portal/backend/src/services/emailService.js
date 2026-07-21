/**
 * Minimal transactional email sender used by Better Auth's OTP flows
 * (config/auth.js -> emailOTP plugin's `sendVerificationOTP` callback).
 *
 * IMPORTANT: Better Auth itself generates, hashes, stores, expires, and
 * verifies every OTP. This file's ONLY job is delivering the email that
 * contains the code Better Auth already produced — nothing here
 * implements OTP generation/verification logic.
 *
 * If SMTP_HOST / SMTP_USER / SMTP_PASS aren't configured (e.g. local
 * development), the email is printed to the console instead of actually
 * being sent, so the OTP is still visible to whoever is testing the flow.
 */

const nodemailer = require('nodemailer');
const env = require('../config/env');

let transporter = null;
if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: Number(env.SMTP_PORT) === 465,
        auth: {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS
        }
    });
}

const SUBJECT_BY_TYPE = {
    'sign-in': 'Your sign-in code',
    'email-verification': 'Verify your email address',
    'forget-password': 'Your password reset code'
};

const MESSAGE_BY_TYPE = {
    'sign-in': (otp) => `Your one-time sign-in code is ${otp}. It expires in 5 minutes. If you didn't request this, you can ignore this email.`,
    'email-verification': (otp) => `Your email verification code is ${otp}. Enter it to activate your account. It expires in 5 minutes.`,
    'forget-password': (otp) => `Your password reset code is ${otp}. Enter it along with your new password to complete the reset. It expires in 5 minutes. If you didn't request this, you can ignore this email.`
};

/**
 * @param {Object} params
 * @param {string} params.email - Recipient address.
 * @param {string} params.otp   - The code Better Auth generated.
 * @param {'sign-in'|'email-verification'|'forget-password'} params.type
 */
exports.sendOtpEmail = async ({ email, otp, type }) => {
    const subject = SUBJECT_BY_TYPE[type] || 'Your verification code';
    const buildMessage = MESSAGE_BY_TYPE[type] || ((code) => `Your verification code is ${code}.`);
    const text = buildMessage(otp);

    if (!transporter) {
        // Dev fallback — no SMTP configured, so log instead of sending.
        console.log(`[emailService] (${type}) OTP for ${email}: ${otp}`);
        return;
    }

    await transporter.sendMail({
        from: env.SMTP_FROM || env.SMTP_USER,
        to: email,
        subject,
        text
    });
};
