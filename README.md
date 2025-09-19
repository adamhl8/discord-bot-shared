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
  - [Adding and registering events](#adding-and-registering-events)
- [Error Handling](#error-handling)
  - [Commands](#commands-1)
  - [Events](#events-1)
- [Utilities](#utilities)
  - [getChannel](#getchannel)

<!-- tocstop -->

## Installation

```sh
npm install discord-bot-shared
```

## Quick Start

Let's create a simple bot with one slash command.

In **`ping.ts`:**

```ts
import { Command } from "discord-bot-shared"
import { SlashCommandBuilder } from "discord.js"

const ping: Command = {
  command: new SlashCommandBuilder().setName("ping").setDescription("I'll respond with pong!").toJSON(),
  async run(interaction) {
    await interaction.reply("Pong!")
  },
}

export default ping
```

In **`index.ts`:**

```ts
import Bot from "discord-bot-shared"
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

## Commands

### Creating a slash command

Commands can be created by constructing `Command` objects that will be added to the bot later.

```ts
import { Command } from "discord-bot-shared"
import { SlashCommandBuilder } from "discord.js"

const ping: Command = {
  command: new SlashCommandBuilder().setName("ping").setDescription("I'll respond with pong!").toJSON(),
  async run(interaction) {
    await interaction.reply("Pong!")
  },
}

export default ping
```

Make sure to call `.toJSON()` on `SlashCommandBuilder`.

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

### Unregistering commands

```ts
await bot.commands.unregisterApplicationCommands()
```

This will unregister all commands globally.

### Global Command Hook

You can optionally add a global command hook to your bot. This is a function that will be called before your command's `run` function.

- The global command hook function must return a `boolean`.
- If `true` is returned, the initiated command will run.

```ts
bot.commands.setGlobalCommandHook(commandHook)
```

This allows you to perform certain actions or make checks before _any_ command runs. For example, you could do something like this:

```ts
function commandHook(interaction: ChatInputCommandInteraction<"cached">) {
  if (interaction.channelId === "123456789") {
    return true
  } else {
    throwUserError("This command was not initiated in the right channel.")
  }
}

bot.commands.setGlobalCommandHook(commandHook)
```

It's intended that you throw an error in the case you don't want the command to run rather than returning `false`. Otherwise, a generic error message will be displayed: `The global command hook returned false.`

`throwUserError` is a special helper function. See [Error Handling](#error-handling) for more info.

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

### Adding and registering events

You can add events to the bot like so:

```ts
bot.events.add(logNewMember)
```

Unlike commands, events do not need to be registered separately. They will be listened for once the bot is logged in.

## Error Handling

This package makes it much easier to handle errors that are thrown during a command or event.

There are two helper functions you can import for throwing errors: `throwError` and `throwUserError`. (These also conveniently allow you to throw an error as an expression.)

- `throwError(message: string)`: Throw a `new Error` with `message`.
- `throwUserError(message: string)`: Throw a `new UserError` with `message`.

The usage of these is explained below.

### Commands

**TLDR:** Use `throwError` to display an error **with the stack trace** in the interaction reply. Use `throwUserError` to display the error message **only** in the interaction reply. That means by default, any instance of `Error` thrown (say by some function you don't own), will be displayed in the interaction reply with its stack trace (which is probably what you want).

When an error is thrown during a command, the interaction is replied to with the error message. For example:

```ts
import { Command, throwError } from "discord-bot-shared"
import { SlashCommandBuilder } from "discord.js"

const ping: Command = {
  command: new SlashCommandBuilder().setName("ping").setDescription("I'll respond with pong!").toJSON(),
  async run(interaction) {
    if (interaction.member.id === "12345") {
      await interaction.reply("Pong!")
    } else {
      throwError("Expected member with ID: 12345")
    }
  },
}
```

If a member with an ID of `12345` does not initiate this command, the bot will respond with `There was an error while running this command.` along with the error **and stack trace**.

In most cases, you probably want to display a clean (i.e. without the stack trace) error message. That's where `throwUserError` comes in. If this type of error is thrown, only the provided error message is displayed.

As a more complete example, let's say we have some command that allows a member to level up when they have enough XP:

```ts
import { Command, throwUserError } from "discord-bot-shared"
import { SlashCommandBuilder } from "discord.js"

const levelUp: Command = {
  command: new SlashCommandBuilder().setName("level-up").setDescription("Level up if you have enough XP.").toJSON(),
  async run(interaction) {
    const memberXP = getMemberXP(interaction.member.id) // This might throw!

    if (memberXP >= 100) {
      levelUpMember(interaction.member.id)
      await interaction.reply("Level up!")
    } else {
      throwUserError("You don't have enough XP to level up!")
    }
  },
}
```

- Say `getMemberXP` throws because the underlying database call fails. The member that initiated the command will get a response with the error message and stack trace (which they can then send to you so you can debug the error).
- If the member doesn't have enough XP, they will receive the message about not having enough XP (no stack trace).

**This means that you should generally _not_ try to catch/handle errors in your commands and let it be handled by the bot.**

### Events

For events, all errors are caught and logged with `console.error`.

## Utilities

### getChannel

Returns the guild channel of the given name/ID and type, otherwise throws.

```ts
import { getChannel } from "discord-bot-shared"
import { ChannelType } from "discord.js"

// guild is of type Guild from discord.js
const someTextChannel = await getChannel(guild, "some-text-channel", ChannelType.GuildText)
```

Getting a properly typed channel with discord.js can be a bit of a pain, so this is an alternative.
