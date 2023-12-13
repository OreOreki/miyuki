import type { YorSlashCommand } from 'yor.ts'
import { ChatCommand } from './chat.js'

export const commands: YorSlashCommand[] = [
  new ChatCommand() as YorSlashCommand,
]
