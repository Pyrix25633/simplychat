import path from 'path';
import * as fs from 'fs';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'simplychat25633@gmail.com',
        pass: fs.readFileSync(path.resolve(__dirname, '../passwords/email.txt')).toString()
    }
});

export function sendEmail(mailOptions: Mail.Options, callback: (err: Error | null) => void): void {
    transporter.sendMail(mailOptions, callback);
}