import { readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

async function registerEvents(projectMetaURL: string) {
  const eventsDirectory = fileURLToPath(new URL('events', projectMetaURL))
  const eventFiles = await readdir(eventsDirectory).catch(console.error)
  if (!eventFiles) return
  for (const file of eventFiles) {
    await import(`${eventsDirectory}/${file}`)
  }
}

export default registerEvents
