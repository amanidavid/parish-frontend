// Shared OTP resend cooldown in seconds. Set in .env.local via NEXT_PUBLIC_OTP_RESEND_SECONDS.
export const OTP_RESEND_SECONDS = Number(process.env.NEXT_PUBLIC_OTP_RESEND_SECONDS) || 180;
