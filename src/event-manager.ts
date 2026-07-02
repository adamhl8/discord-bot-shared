import type { Client, ClientEvents } from "discord.js"
import type { Result } from "ts-explicit-errors"
import { attempt, err, isErr } from "ts-explicit-errors"

import type { DiscordContext } from "#/bot.ts"
import { handleCallback } from "#/util.ts"

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
    for (const singleEvent of this.#events) this.#listen(singleEvent)

    console.log(`Listening for (${this.#events.length.toString()}) events.`)
  }

  // generic over E so `event` and `handler` stay correlated, see microsoft/TypeScript#47109
  #listen<E extends ValidEvents>(singleEvent: SingleEvent<E>): void {
    const handleEvent = async (...args: ClientEvents[E]): Promise<Result> => {
      const eventHandlerResult = await attempt(async () => singleEvent.handler(this.#discord.client, ...args))
      if (isErr(eventHandlerResult)) return err(`failed to handle event '${singleEvent.event}'`, eventHandlerResult)
    }

    this.#discord.client.on(singleEvent.event, (...args) => void handleCallback(async () => handleEvent(...args)))
  }
}

export type Event = {
  [E in ValidEvents]: SingleEvent<E>
}[ValidEvents]
