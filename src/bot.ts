import { Client, ClientOptions, Events, REST } from "discord.js"
import { CommandManager } from "./command-manager.js"
import { EventManager } from "./event-manager.js"

export interface BotOptions {
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
  #discord: DiscordContext

  readonly commands: CommandManager
  readonly events: EventManager

  constructor(options: BotOptions) {
    this.#discord = {
      applicationId: options.applicationId,
      token: options.token,
      client: new Client(options.clientOptions),
      rest: new REST().setToken(options.token),
    }

    this.commands = new CommandManager(this.#discord)
    this.events = new EventManager(this.#discord)
  }

  async login() {
    this.#discord.client.once(Events.ClientReady, () => {
      console.log("Client is ready.")
    })

    await this.commands._register()
    this.commands._listen()

    await this.#discord.client.login(this.#discord.token)
  }
}
