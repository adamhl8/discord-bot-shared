import type { ClientOptions } from "discord.js"
import { Client, Events, REST } from "discord.js"
import { attempt, isErr } from "ts-explicit-errors"

import { CommandManager } from "~/command-manager.ts"
import { EventManager } from "~/event-manager.ts"

interface BotOptions {
  applicationId: string
  token: string
  clientOptions: ClientOptions
}

export interface DiscordContext {
  applicationId: string
  token: string
  client: Client
  rest: REST
}

export class Bot {
  readonly #discord: DiscordContext

  public readonly commands: CommandManager
  public readonly events: EventManager

  public constructor(options: BotOptions) {
    this.#discord = {
      applicationId: options.applicationId,
      token: options.token,
      client: new Client(options.clientOptions),
      rest: new REST().setToken(options.token),
    }

    this.commands = new CommandManager(this.#discord)
    this.events = new EventManager(this.#discord)
  }

  public async login(): Promise<void> {
    this.#discord.client.once(Events.ClientReady, (readyClient) => {
      console.log(`Client is ready. Logged in as '${readyClient.user.tag}'.`)
    })

    this.commands._listen()
    this.events._listen()

    const loginResult = await attempt(() => this.#discord.client.login(this.#discord.token))
    if (isErr(loginResult)) console.error(`failed to login: ${loginResult.messageChain}`)
  }
}
