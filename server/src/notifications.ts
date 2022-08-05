import mailer from 'nodemailer';
import { queryFunc } from "./sql";
import log, { error, warning } from "./log";
import c from 'chalk';
import { limitStr } from "./util";

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

async function mail ({
    to,
    subject,
    html,
    attachments = [],
}: {
    to: string,
    subject: string,
    html: string,
    attachments?: Array<{
        filename: string,
        content: string,
        contentType: string,
    }>,
}): Promise<true | string> {

    if (process.env.ALLOW_MAIL !== '1') {
        warning`Cannot send emails because ALLOW_MAIL is not set`;
        log`Tried to send email to ${to} '${subject}' with html: ${limitStr(html)}`;
        return true;
    }

    if (process.env.PROD !== '1') {
        return `Cannot send emails in non-prod environment`;
    }

    if (!transporter) {
        setUpTransporter();
    }

    const emailFooter = `
        <hr>
        <p>
            <small>
                This is an automated email from
                <a href="${process.env.WEB_URL}">${process.env.WEB_URL}</a>.
                <br>
                Please contact us at
                <a href="mailto:${process.env.GMAIL_USER}">${process.env.GMAIL_USER}</a> 
                if you have any questions.
            </small>
        </p>
    `;

    return await new Promise((resolve, reject) => {
        transporter?.sendMail({
            from: process.env.GMAIL_USER,
            to,
            subject,
            html: html + emailFooter,
            attachments
        }, (err, info) => {
            if (err) {
                error`Error sending email: ${JSON.stringify(err)}`;
                reject(`Error sending email: ${JSON.stringify(err)}`);
                return;
            }
            if (!info['accepted'].includes(to)) {
                reject(`Email failed to send`);
                warning`Sent email to ${to} failed: ${JSON.stringify(info)}`;
                return;
            }
            log`Sent email to ${to}`;
            resolve(true);
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

export async function forgottenPasswordEmail (query: queryFunc, userID: string, newSessionID: string): Promise <string | true> {
    return await sendEmailToUser(query, userID, 'Forgotten Password', `
        <h3>You have requested to reset your password.</h3>
        <p style="text-align: center">
            <a href="${process.env.SITE_ROOT}/set-password?s=${newSessionID}">
                Reset Password
            </a>
        </p>
    `);
}

export async function receivedHousePoint (query: queryFunc, userID: string, quantity: number) {
    let title = 'Received House Point';
    if (quantity > 1) {
        title = `Received ${quantity} House Points`;
    }
    return await sendEmailToUser(query, userID, title, `
        <h3>
            You have received ${quantity} house point${quantity > 1 ? 's' : ''}!
        </h3>
        <p>
            <a href="${process.env.SITE_ROOT}/user">
                See my house points
            </a>
        </p>
    `);
}

export async function housePointRequestAcceptedOrRejected (query: queryFunc, userID: string, hpReason: string, rejectMessage='') {
    const title = `Your House Point Request has been ${rejectMessage ? 'Rejected' : 'Accepted'}`;
    return await sendEmailToUser(query, userID, title, `
        <h3>
            Your house point request for '${hpReason}' has been ${rejectMessage ? 'rejected.' : 'accepted!'}
        </h3>
        <p>
            <a href="${process.env.SITE_ROOT}/user">
                See my house points
            </a>
        </p>
    `);
}