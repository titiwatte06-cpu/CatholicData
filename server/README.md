# External Catholic Content

The server stores short excerpts and source links from the Bangkok Archdiocese Catechetical Center and Catholic Media Thailand. It does not store or republish full source articles.

## API

- `GET /api/daily-reading/today` returns the Bangkok-date reading, falling back to the latest saved reading when today's scrape is unavailable.
- `GET /api/news` returns saved Catholic news, newest first.
- `POST /api/content/refresh` refreshes both sources. It requires `Authorization: Bearer <CONTENT_REFRESH_SECRET>`.

## Render Web Service

The Express server uses `node-cron` to refresh content every day at 01:00 in `Asia/Bangkok`. It also starts one refresh after MongoDB connects, so the pages are populated on first deploy. No additional cron configuration is needed for a persistent Render Web Service.

Set `CONTENT_REFRESH_SECRET` in the Render environment if the authenticated refresh endpoint will be used. Keep this value private.

## External Scheduler

For a serverless deployment, set `CONTENT_CRON_ENABLED=false` to disable in-process cron and configure an external scheduler such as cron-job.org:

- Method: `POST`
- URL: `https://<your-api-host>/api/content/refresh`
- Header: `Authorization: Bearer <CONTENT_REFRESH_SECRET>`
- Schedule: daily at 01:00, Bangkok time

## Local Test Scripts

Run from the `server` directory:

```powershell
node scripts/test-fetch-sermon.js
node scripts/test-fetch-news.js
```
