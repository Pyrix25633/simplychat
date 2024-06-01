import { TempUser, User } from '@prisma/client';
import { Request } from 'express';
import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { settings } from './settings';

const email: string = settings.nodemailerTransport.auth.user;

const transporter: nodemailer.Transporter = nodemailer.createTransport(settings.nodemailerTransport);

function sendEmail(mailOptions: Mail.Options, callback?: (err: Error | null) => void): void {
    if(callback == undefined) callback = (err: Error | null) => { if(err) console.log(err); };
    mailOptions.sender = email;
    try {
        transporter.sendMail(mailOptions, callback);
    } catch(e: any) {
        console.error('Error while sending email: ', e);
    }
}

export function sendVerificationCode(email: string, tempUser: TempUser): void {
    sendEmail({
        to: email,
        subject: 'Simply Chat Verification Code',
        text: 'Your Verification Code for Username ' + tempUser.username + ' is ' + tempUser.verificationCode + '.',
        html: 'Your Verification Code for Username ' + tempUser.username + ' is ' + tempUser.verificationCode + '.<br>' +
            'Click <a href=https://"' + settings.https.hostname + '/temp-users/' + tempUser.username + '/confirm?verificationCode=' + tempUser.verificationCode +
            '">here</a> to confirm your Registration or open <a href=https://"' + settings.https.hostname +
            '/confirm">this Link</a> and enter Username and Verification Code.'
    });
}

export function sendSecurityNotification(type: 'login' | 'settings', user: User, req: Request): void {
    const loginSettingsLine = type == 'login' ?
        ('A new Login to your Simply Chat Account (' + user.username + ') has been detected!\n') :
        ('Your Account (' + user.username + ') Settings have been modified!\n');
    const tfaLine = user.tfaKey == null ?
        'We recommend that you turn on Two Factor Authentication!\n' :
        'Two Factor Authentication is already active!\n';
    sendEmail({
        to: user.email,
        subject: 'Simply Chat Security Notification',
        text: loginSettingsLine +
            'If it was you, you don\'t need to do anything. If not, you should take action.\n' +
            tfaLine +
            'User Agent: ' + req.headers['user-agent'] + '\nIP Address: ' + req.ip
    });
}