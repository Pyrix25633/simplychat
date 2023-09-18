import path from 'path';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { settings } from './settings';

const email: string = settings.nodemailerTransport.auth.user;

const transporter: nodemailer.Transporter = nodemailer.createTransport(settings.nodemailerTransport);

export function sendEmail(mailOptions: Mail.Options, callback?: (err: Error | null) => void): void {
    if(callback == undefined) callback = (err: Error | null) => {if(err) console.log(err)};
    mailOptions.sender = email;
    transporter.sendMail(mailOptions, callback);
}