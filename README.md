# discord-bot-shared

A module that makes creating discord.js bots a bit easier.

## Installation/Usage

```
npm install discord-bot-shared
```

- This module expects a `BOT_TOKEN` and `CLIENT_ID` environment variable to login.
  - By default, commands are registered globally. To register commands to a specific guild, you can optionally provide `GUILD_ID`.

```
// index.ts
import login from 'discord-bot-shared'
import { ClientOptions, GatewayIntentBits as Intents, Partials } from 'discord.js'

const botIntents: ClientOptions = {
  intents: [Intents.Guilds],
  partials: [Partials.Reaction],
}

const bot = await login(botIntents, import.meta.url)

export default bot
```

**You must have a directory names `events` and `commands` next to your `index.ts` (or wherever you are importing `login()` from).**

```
.
└── src/
    ├── events/
    │   └── someEvent.ts
    ├── commands/
    │   └── someCommand.ts
    └── index.ts
```

### Events

This module registers your bot's events by `import`ing each file under your `events` directory. Events are registered as a side-effect of the import.

```
// guildMemberAdd.ts
import bot from '../index.js'

bot.on('guildMemberAdd', (member) => {
  // do stuff
})
```

### Commands

Your commands are registered by `import`ing the default export of each command file.

```
// myCommand.ts
import { Command } from 'discord-bot-shared'
import { SlashCommandBuilder } from 'discord.js'

const myCommand: Command = {
  command: new SlashCommandBuilder()
    .setName('my-command')
    .setDescription('This command does stuff.') as SlashCommandBuilder,
  run: (interaction) => {
    // do stuff
  },
}

export default myCommand
```

Your `run` function is passed the command interaction that initiated the command.

### Exports

The following functions and interfaces/types are exported by this module:

---

#### `function login`

```
async function login(
  botIntents: ClientOptions,
  projectMetaURL: string,
  interactionCheck?: InteractionCheck,
): Promise<Client>
```

- `botIntents` is a discord.js `ClientOptions` object.
- `projectMetaURL` should always be passed `import.meta.url`. This is used to find and register your events and commands.
- Optionally provide an `interactionCheck` function that returns a boolean. This function is called right before trying to run a command. The command will only run if `interactionCheck` returns true.
  - The `InteractionCheck` type is also exported by this module.

---

#### `function getGuildCache`

Returns an object that contains the guild and the following freshly fetched guild collections: `channels, emojis, members, roles`.

```
async function getGuildCache()
```

- For example, a common pattern I use is something like this:

```
const { members } = await getGuildCache()
// do stuff with members
```

---

#### `interface Command`

This interface defines the structure of your bot's commands. See above for an example of a command.

```
interface Command {
  requiredRoles?: string[]
  command: SlashCommandBuilder
  run: (interaction: ChatInputCommandInteraction) => void | Promise<void>
}
```

- Optionally provide `requiredRoles` string array. If the member initiating the command has _any_ of the roles provided in this array, they will be allowed to run the command.
- **You may have to type cast your command `as SlashCommandBuilder` due to the way discord.js' `SlashCommandBuilder` works.**
- `run` is the final function that will be called to run your command.

---

#### `function getChannelByName`

Returns a guild channel of the given name and type, otherwise returns `undefined`.

```
async function getChannelByName<T extends NonThreadGuildBasedChannel>(
  channelName: string,
  channelType: NonThreadGuildBasedChannelType,
): Promise<T | undefined>
```

- `T` can be one of `TextChannel | VoiceChannel | NewsChannel | StageChannel | CategoryChannel`.
- `channelType` is a discord.js `ChannelType`. Can be one of `GuildText | GuildVoice | GuildNews | GuildStageVoice | GuildCategory` (prepended with `ChannelType`).
- It is intended that you pass in a type for `T` that matches `channelType`. The returned channel is cast as whatever type is passed in.
- For example:

```
const someTextChannel = await getChannelByName<TextChannel>('some-text-channel', ChannelType.GuildText)
```

---

#### Channel Type Guards

These are channel type guards that you may need to use.

```
function isTextChannel(channel: BaseChannel | APIPartialChannel): channel is TextChannel
```

```
function isCategoryChannel(channel: BaseChannel): channel is CategoryChannel
```

- Almost every channel type in discord.js extends `BaseChannel`, so you should be able to pass in whatever channel you need to here.
