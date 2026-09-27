import cron from 'node-cron'
import { refreshExternalContent } from './externalContent.js'

export function startExternalContentScheduler() {
  if (process.env.CONTENT_CRON_ENABLED === 'false') {
    console.log('External content cron is disabled; configure an external scheduler to call POST /api/content/refresh')
    return
  }

  cron.schedule('0 1 * * *', async () => {
    console.log('Starting scheduled Catholic content refresh')
    const outcome = await refreshExternalContent()
    console.log('Scheduled Catholic content refresh finished:', outcome)
  }, { timezone: 'Asia/Bangkok' })

  console.log('External content cron scheduled daily at 01:00 Asia/Bangkok')
  void refreshExternalContent().then((outcome) => {
    console.log('Initial Catholic content refresh finished:', outcome)
  })
}
