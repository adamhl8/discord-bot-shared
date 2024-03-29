import { Client, ClientEvents, Events } from "discord.js"
import { DiscordContext } from "./bot.js"

type ValidEvents = Exclude<Events, Events.VoiceServerUpdate | Events.Raw>

type EventHandler<E extends ValidEvents = ValidEvents> = (
  client: Client,
  ...args: ClientEvents[E]
) => void | Promise<void>

type EventHandlerMap = {
  [E in ValidEvents]: EventHandler<E>
}

interface SingleEvent<E extends ValidEvents = ValidEvents> {
  event: E
  handler: EventHandlerMap[E]
}

class EventManager {
  #events: SingleEvent[] = []
  #discord: DiscordContext

  constructor(discord: DiscordContext) {
    this.#discord = discord
  }

  /*
   * Add an event listener
   */
  add<N extends ValidEvents>(event: SingleEvent<N>) {
    this.#events.push(event)
  }

  _listen() {
    for (const event of this.#events) {
      this.#discord.client.on(event.event, async (...args) => {
        try {
          await (event.handler as EventHandler)(this.#discord.client, ...args)
        } catch (error) {
          console.error(error)
        }
      })
    }
    console.log(`Listening for (${this.#events.length}) events.`)
  }
}

type Event = {
  [E in ValidEvents]: SingleEvent<E>
}[ValidEvents]

export default EventManager
export type { Event }
