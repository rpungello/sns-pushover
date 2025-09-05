# SNS Pushover Bridge

## Usage

```bash
docker run -d \
  --name sns-pushover \
  -e PUSHOVER_USER=your_pushover_user_key \
  -e PUSHOVER_TOKEN=your_pushover_api_token \
  -p 8080:80 \
  ghcr.io/rpungello/sns-pushover
```

Once running, configure Amazon SNS to send HTTP/HTTPS notifications to `http(s)://<your-server-ip>:8080/notify`.
SNS will send a confirmation request to this endpoint, which the service will automatically handle.

Any validated (based on signature) SNS messages will then be forwarded to your Pushover account.