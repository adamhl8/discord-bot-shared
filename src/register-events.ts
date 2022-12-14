import { Client } from "discord.js"

type Event = (bot: Client) => void

interface Events {
  [name: string]: Event
}

function registerEvents(bot: Client, events: Events) {
  for (const registerEvent of Object.values(events)) registerEvent(bot)
  console.log("Registered events.")
}

export default registerEvents
export { Event, Events }
