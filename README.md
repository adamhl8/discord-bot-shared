# discord-bot-shared

A small package that makes creating [discord.js](https://github.com/discordjs/discord.js) bots a bit easier. It allows you easily create and register bot commands/events, handle runtime errors, and more.

---

<!-- toc -->

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Creating a `Bot` instance](#creating-a-bot-instance)
- [Commands](#commands)
  - [Creating a slash command](#creating-a-slash-command)
  - [Adding and registering commands](#adding-and-registering-commands)
  - [Unregistering commands](#unregistering-commands)
  - [Global Command Hook](#global-command-hook)
- [Events](#events)
  - [Listening for events](#listening-for-events)
  - [Adding events](#adding-events)
- [Error Handling](#error-handling)
  - [Commands](#commands-1)
  - [Events](#events-1)
- [Utilities](#utilities)
  - [components](#components)

<!-- tocstop -->

## Installation

Requires discord.js v15.

```sh
npm install discord-bot-shared discord.js
```

## Quick Start

Let's create a simple bot with one slash command.

In **`ping.ts`:**

```ts
import { Command } from "discord-bot-shared"
import { ChatInputCommandBuilder } from "discord.js"

const ping: Command = {
  command: new ChatInputCommandBuilder().setName("ping").setDescription("I'll respond with pong!"),
  async run(interaction) {
    await interaction.reply("Pong!")
  },
}

export default ping
```

In **`index.ts`:**

```ts
import { Bot } from "discord-bot-shared"
import { ClientOptions, GatewayIntentBits } from "discord.js"

import ping from "./ping"

// Get applicationId and token from environment variables
const applicationId = process.env.APPLICATION_ID ?? ""
const token = process.env.BOT_TOKEN ?? ""

const clientOptions: ClientOptions = {
  intents: [GatewayIntentBits.Guilds],
}

const bot = new Bot({ applicationId, token, clientOptions })

bot.commands.add(ping)

await bot.commands.register()
await bot.login()
```

That's it! You now have bot that will respond to the slash command `/ping` with "Pong!".

## Creating a `Bot` instance

The `Bot` constructor takes an object that contains your bot's `applicationId`, secret `token`, and Discord `clientOptions`. See this [discord.js guide page](https://discordjs.guide/popular-topics/intents.html) for more info on setting up bot intents.

```ts
const bot = new Bot({ applicationId, token, clientOptions })
```

Once you have your bot setup and are ready for it to start listening for the commands and events you've added:

```ts
await bot.login()
```

To log the bot out and destroy the underlying client:

```ts
await bot.logout()
```

## Commands

### Creating a slash command

Commands can be created by constructing `Command` objects that will be added to the bot later.

```ts
import { Command } from "discord-bot-shared"
import { ChatInputCommandBuilder } from "discord.js"

const ping: Command = {
  command: new ChatInputCommandBuilder().setName("ping").setDescription("I'll respond with pong!"),
  async run(interaction) {
    await interaction.reply("Pong!")
  },
}

export default ping
```

You can optionally provide a `requiredRoles` string array. If the member initiating the command has _any_ of the roles provided in this array, they will be allowed to run the command.

```ts
const ping: Command = {
  requiredRoles: ["cool guy", "cooler guy"], // Only members that have a role with the name "cool guy" OR "cooler guy" can run this command.
  command: // ...
  run: // ...
}
```

### Adding and registering commands

You can add commands to the bot like so:

```ts
bot.commands.add(ping)
```

Commands must be registered before they will appear in Discord.

```ts
await bot.commands.register()
```

This registers commands globally (for all servers). It's not really recommended to register commands every time your bot starts up as you may get rate-limited by Discord.

Alternatively, you can register commands per-guild in every guild the bot is in. This waits until the client is ready, so it's safe to call before `login()`:

```ts
await bot.commands.guildRegister()
```

### Unregistering commands

```ts
await bot.commands.unregister()
```

This will unregister all commands globally. There is also a per-guild equivalent:

```ts
await bot.commands.guildUnregister()
```

### Global Command Hook

You can optionally add a global command hook to your bot. This is a function that will be called before your command's `run` function. It allows you to perform certain actions or make checks before _any_ command runs.

The hook receives the interaction and must return a result object:

- `{ success: true }`: the initiated command will run.
- `{ success: false, message?: string }`: the command will not run and the member gets a warning reply with `message`. If `message` is omitted, a generic message is displayed instead.

For example:

```ts
import { CommandHook } from "discord-bot-shared"

const commandHook: CommandHook = (interaction) => {
  if (interaction.channelId === "123456789") {
    return { success: true }
  }
  return { success: false, message: "This command was not initiated in the right channel." }
}

bot.commands.setGlobalCommandHook(commandHook)
```

## Events

### Listening for events

You can create an `Event` object that will be added to the bot later.

```ts
import { Event } from "discord-bot-shared"
import { Events } from "discord.js"

const logNewMember: Event = {
  event: Events.GuildMemberAdd,
  handler(client, member) {
    console.log(`${member.user.username} joined the server.`)
  },
}

export default logNewMember
```

The `Client` instance is always passed as the first argument to the `handler`. The rest of the arguments will be correctly typed based on the event you specify. Also, the `handler` can be `async` if needed.

You can optionally set `once: true` to only handle the first occurrence of the event.

### Adding events

You can add events to the bot like so:

```ts
bot.events.add(logNewMember)
```

Unlike commands, events do not need to be registered separately. They will be listened for once the bot is logged in.

## Error Handling

Errors thrown while handling a command or event are caught by the bot, so you generally should _not_ try to catch/handle errors yourself.

### Commands

When an error is thrown during a command (from your `run` function or the global command hook), the bot replies to the interaction with an ephemeral error message containing the error's message. For example:

```ts
import { Command } from "discord-bot-shared"
import { ChatInputCommandBuilder } from "discord.js"

const levelUp: Command = {
  command: new ChatInputCommandBuilder().setName("level-up").setDescription("Level up if you have enough XP."),
  async run(interaction) {
    const memberXP = getMemberXP(interaction.member.id) // This might throw!

    if (memberXP < 100) {
      throw new Error("You don't have enough XP to level up!")
    }

    levelUpMember(interaction.member.id)
    await interaction.reply("Level up!")
  },
}
```

- If the member doesn't have enough XP, they will receive the "You don't have enough XP to level up!" message.
- Say `getMemberXP` throws because the underlying database call fails. The member will get a reply with that error's message instead.

### Events

For events, all errors are caught and logged with `console.error`.

## Utilities

### components

The `components` export contains helpers that build the same error/warning messages the bot uses for its own replies. Each returns an object ready to be passed to `reply`/`editReply` (a [Components v2](https://discordjs.guide/popular-topics/display-components.html) container with the appropriate flags set).

```ts
import { components } from "discord-bot-shared"

await interaction.reply(components.error("Something went wrong."))
await interaction.followUp(components.warn("You probably don't want to do that."))
```
