// v1.0 - Updated May 2026
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
    // Production on Render - use Resend
    if (process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
            to: [to],
            subject: subject,
            html: html
        });
        return;
    }

    const host = process.env.EMAIL_HOST || 'smtp.ethereal.email';
    const port = parseInt(process.env.EMAIL_PORT || '587');
    const secure = process.env.EMAIL_SECURE === 'true';
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        throw new Error('Email SMTP credentials are missing. Set EMAIL_USER and EMAIL_PASS in .env.');
    }

    const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
            user,
            pass
        }
    });
    
    await transporter.sendMail({
        from: process.env.EMAIL_FROM || `"Auth API" <${user}>`,
        to: to,
        subject: subject,
        html: html
    });
}
