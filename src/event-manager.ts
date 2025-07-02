import type { Client, ClientEvents } from "discord.js"

import type { DiscordContext } from "./bot.ts"

type ValidEvents = keyof ClientEvents

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

export class EventManager {
  readonly #events: SingleEvent[] = []
  readonly #discord: DiscordContext

  public constructor(discord: DiscordContext) {
    this.#discord = discord
  }

  /*
   * Add an event listener
   */
  public add<N extends ValidEvents>(event: SingleEvent<N>): void {
    this.#events.push(event)
  }

  public _listen(): void {
    for (const event of this.#events) {
      const listen = async (...args: ClientEvents[typeof event.event]) => {
        try {
          // TS Error: Expression produces a union type that is too complex to represent.
          // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
          await (event.handler as EventHandler)(this.#discord.client, ...args)
        } catch (error) {
          console.error(error)
        }
      }

      this.#discord.client.on(event.event, (...args) => void listen(...args))
    }
    console.log(`Listening for (${this.#events.length.toString()}) events.`)
  }
}

export type Event = {
  [E in ValidEvents]: SingleEvent<E>
}[ValidEvents]
