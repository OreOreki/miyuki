import type { CommandContext } from 'yor.ts'
import { YorSlashCommand } from 'yor.ts'
import { EmbedBuilder, SlashCommandBuilder } from 'yor.ts/builders'

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

    const embed = new EmbedBuilder().setTitle(`Your prompts, page ${page || 1} out of ${Math.ceil(prompts.length / 10)}`).addFields(
      prompts.slice(offset, end).map((prompt, index) => ({
        name: `Prompt ${offset + index + 1}`,
        value: `prompt: ${prompt}`,
      })),
    )

    await context.editReply({
      embeds: [embed.toJSON()],
    })
  }
}
