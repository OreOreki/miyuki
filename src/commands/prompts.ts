import type { CommandContext } from 'yor.ts'
import { YorSlashCommand } from 'yor.ts'
import { SlashCommandBuilder } from 'yor.ts/builders'

export class PromptsCommand extends YorSlashCommand {
  public builder = new SlashCommandBuilder()
    .setName('prompts')
    .setDescription('Shows your history of prompts')
    .addNumberOption(option => option.setName('page').setDescription('Page number').setRequired(false))

  // @ts-expect-error - need to somehow let extended context pass
  public execute = async (context: CommandContext & { database: D1Database }) => {
    const page = context.getNumberOption('page', 0, false)

    await context.defer()

    // get prompts
    const rows = await context.database
      .prepare('SELECT prompt FROM prompts WHERE user = ?')
      .bind(String(context.raw.member?.user.id))
      .all()

    const prompts = rows.results.map(row => row.prompt)

    const offset = ((page || 1) - 1) * 10
    const end = offset + 10

    await context.editReply({
      content: `${prompts.slice(offset, end).join('\n')} page: ${page || 1}/${Math.ceil(prompts.length / 10)}`,
    })
  }
}
