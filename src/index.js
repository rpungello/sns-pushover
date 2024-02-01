/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npx wrangler dev src/index.js` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npx wrangler publish src/index.js --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        if (url.pathname !== '/notify') {
            return new Response("Invalid request", {
                status: 400
            });
        } else if (request.method !== 'POST') {
            return new Response("Invalid request", {
                status: 400
            });
        }

        /**
         * @param {Request} request
         */
        async function parseRequest(request) {
            const {headers} = request;
            const contentType = headers.get("content-type") || "";
            if (contentType.includes("application/json")) {
                return request.json();
            }

            return request.text().then(text => {
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return text;
                }
            });
        }

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
                    user: `${env.PUSHOVER_USER}`,
                    token: `${env.PUSHOVER_TOKEN}`,
                    title: title,
                    message: message
                }),
            })
        }

        return parseRequest(request).then(data => {
            if (typeof data == "object") {
                if (data.Type === "SubscriptionConfirmation") {
                    return sendNotification(data.SubscribeURL, "Confirm SNS Subscription");
                } else if (data.Type === "Notification") {
                    return sendNotification(data.Message, data.Subject);
                }
            }

            return new Response("Invalid request", {
                status: 400
            });
        });
    },
};
