import type { YorSlashCommand } from 'yor.ts'
import { ChatCommand } from './chat.js'
import { PromptsCommand } from './prompts.js'

export const commands: YorSlashCommand[] = [
  new ChatCommand() as YorSlashCommand,
  new PromptsCommand() as YorSlashCommand,
]
