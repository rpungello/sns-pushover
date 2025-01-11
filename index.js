const http = require('http');
const Validator = require('sns-payload-validator');
const br2nl = require('@derhuerst/br2nl')
const validator = new Validator();
const getRawBody = require('raw-body');

/**
 * @param {string} message
 * @param {string} title
 * @returns {Promise<Response>}
 */
async function sendNotification(message, title) {
    return fetch("https://api.pushover.net/1/messages.json", {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user: process.env.PUSHOVER_USER,
            token: process.env.PUSHOVER_TOKEN,
            title: title,
            message: br2nl(message)
        }),
    })
}

if (process.env.PUSHOVER_USER === undefined || process.env.PUSHOVER_TOKEN === undefined) {
    console.error('Missing environment variables');
    process.exit(1);
}

http.createServer(function (req, res) {
    console.log('Received request');

    getRawBody(req).then((buf) => {
        validator.validate(buf.toString()).then(payload => {
            console.log('Validated payload', payload);

            if (payload.Type === 'SubscriptionConfirmation') {
                fetch(payload.SubscribeURL).then(response => {
                    if (response.ok) {
                        console.log('Confirmed subscription');

                        res.writeHead(200, {'Content-Type': 'text/plain'});
                        res.end('OK\n');
                    } else {
                        response.text().then(text => {
                            console.log('Unable to confirm subscription', text);
                        });

                        res.writeHead(500, {'Content-Type': 'text/plain'});
                        res.end('Unable to confirm subscription\n');
                    }
                });
            } else if (payload.Type === 'Notification') {
                sendNotification(payload.Message, payload.Subject).then(response => {
                    if (response.ok) {
                        console.log('Sent notification');

                        res.writeHead(200, {'Content-Type': 'text/plain'});
                        res.end('OK\n');
                    } else {
                        response.text().then(text => {
                            console.log('Unable to send notification', text);
                        });

                        res.writeHead(500, {'Content-Type': 'text/plain'});
                        res.end('Unable to send notification\n');
                    }
                });
            }
        }).catch(() => {
            console.log('Invalid SNS payload');

            res.writeHead(400, {'Content-Type': 'text/plain'});
            res.end('Invalid SNS payload\n');
        });
    });
}).listen(80);

console.log('Listening');