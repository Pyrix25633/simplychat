import path from 'path';
import * as fs from 'fs';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

const transporter = nodemailer.createTransport({
    service: 'yahoo',
    auth: {
        user: 'simplychat25633@yahoo.com',
        pass: fs.readFileSync(path.resolve(__dirname, '../passwords/email.txt')).toString()
    }
});

export function sendEmail(mailOptions: Mail.Options, callback: (err: Error | null) => void): void {
    transporter.sendMail(mailOptions, callback);
}