import type { Ai } from '@cloudflare/ai'
import type { CommandContext } from 'yor.ts'
import { YorSlashCommand } from 'yor.ts'
import { SlashCommandBuilder } from 'yor.ts/builders'
import Filter from 'bad-words'

export class ChatCommand extends YorSlashCommand {
  public builder = new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Chat with the AI')
    .addStringOption(option => option.setName('prompt').setDescription('The prompt to send to the AI').setRequired(true))

  // @ts-expect-error - need to somehow let extended context pass
  public execute = async (context: CommandContext & { ai: Ai, kv: KVNamespace, database: D1Database }) => {
    const prompt = context.getStringOption('prompt', 0, true)

    await context.defer()

    const filter = new Filter()

    if (filter.isProfane(prompt)) {
      return context.editReply({
        content: 'That prompt contains profanity.',
      })
    }

    const ratelimit = Number.parseInt((await context.kv.get('ratelimit')) || '0')
    ratelimit > 1 && await context.kv.put('ratelimit', (ratelimit + 1).toString(), {
      // expire in one minute, limit is 60 prompts per minute
      expirationTtl: ratelimit + 1 > 60 ? 60 : ratelimit + 1,
    })

    // check for ratelimit
    if (ratelimit >= 60) {
      return context.editReply({
        content: 'You are being rate limited. Please try again in a minute.',
      })
    }

    const response = await context.ai.run('@cf/meta/llama-2-7b-chat-int8', {
      messages: [
        {
          role: 'system',
          content:
						'Miyuki is an anime girl who loves programming and watching anime. As a smart AI, she is designed to be helpful and kind.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    })

    await context.editReply({
      content: response.response,
    })

    // save prompt and save it along with users, to make it easier to search
    await context.database
      .prepare('INSERT INTO prompts (prompt, user) VALUES (?, ?)')
      .bind(prompt, String(context.raw.member?.user.id))
      .run()
  }
}
