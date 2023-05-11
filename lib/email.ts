import path from 'path';
import * as fs from 'fs';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

const email: string = 'simplychat@zohomail.eu';

const transporter: nodemailer.Transporter = nodemailer.createTransport({
    host: 'smtp.zoho.eu',
    port: 465,
    secure: true,
    auth: {
        user: email,
        pass: fs.readFileSync(path.resolve(__dirname, '../passwords/email.txt')).toString()
    }
});

export function sendEmail(mailOptions: Mail.Options, callback: (err: Error | null) => void): void {
    mailOptions.sender = email;
    transporter.sendMail(mailOptions, callback);
}