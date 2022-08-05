import mailer from 'nodemailer';
import { queryFunc } from "./sql";
import log, { error } from "./log";
import c from 'chalk';

let transporter:  mailer.Transporter | undefined;

function setUpTransporter () {
    transporter = mailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: process.env.GMAIL_USER,
            clientId: process.env.GMAIL_CLIENT_ID,
            clientSecret: process.env.GMAIL_CLIENT_SECRET,
            refreshToken: process.env.GMAIL_REFRESH_TOKEN
        }
    });

    log(c.green(`Set up Gmail mailer`));
    log`Gmail user: ${process.env.GMAIL_USER}`;
}

function mail ({
    to,
    subject,
    html,
    attachments = [],
}: {
    to: string,
    subject: string,
    html?: string,
    attachments?: Array<{
        filename: string,
        content: string,
        contentType: string,
    }>,
}): Promise<any> {

    if (!process.env.PROD) {
        error`Cannot send emails in non-prod environment`;
        return Promise.resolve();
    }

    if (!transporter) {
        setUpTransporter();
    }

    return new Promise((resolve, reject) => {
        transporter?.sendMail({
            from: process.env.GMAIL_USER,
            to,
            subject,
            html,
            attachments
        }, (err, info) => {
            if (err) {
                error`Error sending email: ${JSON.stringify(err)}`;
                reject(err);
            } else {
                log`Email sent: ${JSON.stringify(info)}`;
                resolve(info);
            }
        });
    });
}

async function sendEmailToUser (query: queryFunc, userID: string, subject: string, html: string) {
    const users  = await query`
        SELECT email
        FROM users
        WHERE id = ${userID}
    `;
    if (!users.length) {
        return 'Invalid userID';
    }
    const email = users[0].email;
    return await mail({
        to: email,
        subject,
        html,
    });
}

// Exposed

export async function forgottenPasswordEmail (query: queryFunc, userID: string, newSessionID: string) {
    return await sendEmailToUser(query, userID, 'Forgotten Password', `
        <h3>
            You have requested to reset your password.
        </h3>
        <p style="text-align: center">
            <a href="${process.env.SITE_ROOT}/set-password?s=${newSessionID}">
                Reset Password
            </a>
        </p>
    `);
}