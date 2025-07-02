import type { Client, ClientOptions, REST } from "discord.js"

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
