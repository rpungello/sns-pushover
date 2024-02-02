import { Validator } from 'sns-cloudflare-validator';

export default {
    /**
     * @param {Request} request
     * @param env
     * @returns {Promise<Response>}
     */
    async fetch(request, env) {
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

        try {
            const validator = new Validator();
            const payload = await validator.validate(request);

            return sendNotification(payload.Message, payload.Subject).then(response => {
                if(response.ok) {
                    return new Response('Notification sent')
                } else {
                    return new Response('Unable to send notification', { status: 500 });
                }
            });
        } catch (error) {
            return new Response('Error: ' + error.message, { status: 400 });
        }
    },
};
