const http = require('http');
const Validator = require('sns-payload-validator');
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
            message: message
        }),
    })
}

http.createServer(function (req, res) {
    getRawBody(req).then((buf) => {
        validator.validate(buf.toString()).then(payload => {
            if (payload.Type === 'SubscriptionConfirmation') {
                fetch(payload.SubscribeURL).then(response => {
                    if (response.ok) {
                        res.writeHead(200, {'Content-Type': 'text/plain'});
                        res.end('OK\n');
                    } else {
                        res.writeHead(500, {'Content-Type': 'text/plain'});
                        res.end('Unable to confirm subscription\n');
                    }
                });
            } else if (payload.Type === 'Notification') {
                sendNotification(payload.Message, payload.Subject).then(response => {
                    if (response.ok) {
                        res.writeHead(200, {'Content-Type': 'text/plain'});
                        res.end('OK\n');
                    } else {
                        res.writeHead(500, {'Content-Type': 'text/plain'});
                        res.end('Unable to send notification\n');
                    }
                });
            }
        }).catch(() => {
            res.writeHead(400, {'Content-Type': 'text/plain'});
            res.end('Invalid SNS payload\n');
        });
    });
}).listen(80);