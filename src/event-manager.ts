import { Client, ClientEvents } from "discord.js"
import { DiscordContext } from "./bot.js"

export interface Event<K extends keyof ClientEvents> {
  name: K
  handler: (context: EventContext, ...args: ClientEvents[K]) => Promise<void>
}

export interface EventContext {
  client: Client
}

export class EventManager {
  constructor(private discord: DiscordContext) {}

  /*
   * Add an event listener
   */
  add<K extends keyof ClientEvents>(event: Event<K>) {
    this.discord.client.on(event.name, (...args) => {
      const context = {
        client: this.discord.client,
      }
      void event.handler(context, ...args).catch(console.error)
    })
  }
}
