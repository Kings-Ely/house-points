import mailer from 'nodemailer';
import { queryFunc } from "./sql";
import log, { error } from "./log";

let transporter:  mailer.Transporter | undefined;

function setUpTransporter () {
    transporter = mailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_PASSWORD,
        }
    });
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
}) {

    if (!process.env.PROD) {
        error`Cannot send emails in non-prod environment`;
        return Promise.resolve();
    }

    if (!transporter) {
        setUpTransporter();
    }

    return new Promise((resolve, reject) => {
        transporter?.sendMail({
            from: '',
            to,
            subject,
            html,
            attachments
        }, (err, info) => {
            if (err) {
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

export function forgottenPassword (query: queryFunc, userID: string, newSessionID: string) {
    return sendEmailToUser(query, userID, 'Forgotten Password', `
        <h1>
            You have requested to reset your password.
        </h1>
        <p>
            <a href="${process.env.SITE_ROOT}/reset-password?id=${newSessionID}">
                Reset Password
            </a>
        </p>
    `);
}