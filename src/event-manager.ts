import { Client, ClientEvents, Events } from "discord.js"
import { DiscordContext } from "./bot.js"

type ValidEvents = Exclude<Events, Events.VoiceServerUpdate | Events.Raw>

interface Event<N extends ValidEvents = ValidEvents> {
  event: N
  handler: (context: EventContext, ...args: ClientEvents[N]) => Promise<void>
}

interface EventContext {
  client: Client
}

class EventManager {
  constructor(private discord: DiscordContext) {}

  /*
   * Add an event listener
   */
  add<N extends ValidEvents>(event: Event<N>) {
    this.discord.client.on(event.event, (...args) => {
      const context = {
        client: this.discord.client,
      }
      void event.handler(context, ...args).catch(console.error)
    })
  }
}

export default EventManager
export type { Event, EventContext }
