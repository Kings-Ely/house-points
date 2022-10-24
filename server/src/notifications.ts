// import mailer from 'nodemailer';
import { queryFunc } from './sql';
import log from './log';
import { spawn } from "child_process";

// let transporter: mailer.Transporter | undefined;
//
// function setUpTransporter() {
//     transporter = mailer.createTransport({
//         sendmail: true
//     });
// }

async function mail({
    to,
    subject = 'House Points',
    html = ''
}: {
    to: string;
    subject?: string;
    html?: string;
}): Promise<true | string> {
    if (process.env.ALLOW_MAIL !== '1') {
        log.warn`Cannot send emails because ALLOW_MAIL is set to '${process.env.ALLOW_MAIL}' (${typeof process.env.ALLOW_MAIL})`;
        log.log`Tried to send email to ${to} '${subject}'`;
        return true;
    }

    if (process.env.REROUTE_MAIL) {
        html = `<p>This email was rerouted from '${to}' (env.REROUTE_MAIL is set)</p>` + html;
        to = process.env.REROUTE_MAIL;
    }

    // if (!transporter) {
    //     setUpTransporter();
    // }

    const emailFooter = `<hr>
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
    
    return await new Promise(resolve => {
        const ls = spawn("php", ["mail.php", to, subject, html + emailFooter]);
        let startedError = false;
    
        ls.stdout.on("data", data => {
            if (!startedError) {
                console.log(`Error in sending mail to '${to}' (${subject})`);
                startedError = true;
            }
            log.error(`stdout: ${data}`);
        });
    
        ls.stderr.on("data", data => {
            if (!startedError) {
                console.log(`Error in sending mail to '${to}' (${subject})`);
                startedError = true;
            }
            log.error(`stderr: ${data}`);
        });
    
        ls.on('error', (error) => {
            if (!startedError) {
                console.log(`Error in sending mail to '${to}' (${subject})`);
                startedError = true;
            }
            log.error(`error: ${error.message}`);
        });
    
        ls.on("close", code => {
            log.verbose(`'mail' child process exited with code ${code}`);
            resolve(true);
        });
    });

    // return await new Promise((resolve, reject) => {
    //
    //     log.log`Sending email to '${to}' from '${process.env.MAIL_FROM}': '${subject}'`;
    //
    //     transporter?.sendMail(
    //         {
    //             from: process.env.MAIL_FROM,
    //             to,
    //             subject,
    //             html: html + emailFooter
    //         },
    //         (err, info) => {
    //             if (err) {
    //                 log.error`Error sending email: ${JSON.stringify(err)}`;
    //                 reject(`Error sending email: ${JSON.stringify(err)}`);
    //                 return;
    //             }
    //             if (!info['accepted'].includes(to)) {
    //                 reject(`Email failed to send`);
    //                 log.warn`Sent email to ${to} failed: ${JSON.stringify(info)}`;
    //                 return;
    //             }
    //             log.verbose`Sent email successfully to ${to}`;
    //             resolve(true);
    //         }
    //     );
    // });
}

async function sendEmailToUser(query: queryFunc, userId: string, subject: string, html: string) {
    const users = await query`
        SELECT email
        FROM users
        WHERE id = ${userId}
    `;
    if (!users[0] || !users.length) {
        return 'Invalid userId';
    }
    const email = users[0].email;
    return await mail({
        to: email,
        subject,
        html
    });
}

// Exposed

export async function forgottenPasswordEmail(
    query: queryFunc,
    userId: string,
    newSessionId: string
): Promise<string | true> {
    log.error`Sending forgotten password email to ${userId}`;
    return await sendEmailToUser(
        query,
        userId,
        'Forgotten Password',
        `
        <h3>You have requested to reset your password.</h3>
        <p style="padding: 20px;">
            To reset your password, click the link, which will expire in 1 hour.
            <b>
            <a href="${process.env.SITE_ROOT}/set-password?s=${newSessionId}">
                Reset Password
            </a>
        </p>
    `
    );
}

export async function receivedHousePoint(query: queryFunc, userId: string, quantity: number) {
    let title = 'Received House Point';
    if (quantity > 1) {
        title = `Received ${quantity} House Points`;
    }
    return await sendEmailToUser(
        query,
        userId,
        title,
        `
        <h3>
            You have received ${quantity} house point${quantity > 1 ? 's' : ''}!
        </h3>
        <p>
            <a href="${process.env.SITE_ROOT}/user">
                See my house points
            </a>
        </p>
    `
    );
}

export async function housePointRequestAcceptedOrRejected(
    query: queryFunc,
    userId: string,
    hpReason: string,
    rejectMessage: any = ''
) {
    const title = `Your House Point Request has been ${rejectMessage ? 'Rejected' : 'Accepted'}`;
    return await sendEmailToUser(
        query,
        userId,
        title,
        `
        <h3>
            Your house point request for '${hpReason}' has been
            ${rejectMessage ? 'rejected.' : 'accepted!'}
        </h3>
        <p>
            <a href="${process.env.SITE_ROOT}/user">
                See my house points
            </a>
        </p>
    `
    );
}
