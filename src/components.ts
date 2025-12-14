import { ContainerBuilder, MessageFlags, SeparatorSpacingSize } from "discord.js"

const error = (message: string) =>
  ({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xff_00_00)
        .addTextDisplayComponents((t) => t.setContent("**Error**"))
        .addSeparatorComponents((s) => s.setSpacing(SeparatorSpacingSize.Small))
        .addTextDisplayComponents((t) => t.setContent(message)),
    ],
    flags: [MessageFlags.IsComponentsV2],
  }) as const

const warn = (message: string) =>
  ({
    components: [
      new ContainerBuilder()
        .setAccentColor(0xff_bf_00)
        .addTextDisplayComponents((t) => t.setContent("**Warning**"))
        .addSeparatorComponents((s) => s.setSpacing(SeparatorSpacingSize.Small))
        .addTextDisplayComponents((t) => t.setContent(message)),
    ],
    flags: [MessageFlags.IsComponentsV2],
  }) as const

export const components = {
  error,
  warn,
} as const
