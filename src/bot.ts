import { Client, Events, REST } from "discord.js"

import { CommandManager } from "~/command-manager.ts"
import { EventManager } from "~/event-manager.ts"
import type { BotOptions, DiscordContext } from "~/types.ts"

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
    this.#discord.client.once(Events.ClientReady, () => {
      console.log("Client is ready.")
    })

    this.commands._listen()
    this.events._listen()
    await this.#discord.client.login(this.#discord.token)
  }
}
