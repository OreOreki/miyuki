import { Ai } from '@cloudflare/ai'
import { WebhookClient, YorClient } from 'yor.ts'
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from 'yor.ts/builders'
import { ButtonStyle } from 'discord-api-types/v10'
import { commands } from './commands/index.js'
import type { NekosAPIResponse } from './interfaces/NekosAPI.js'

export interface Env {
  AI: any
  MIYUKI_KV: KVNamespace
  MIYUKI_DB: D1Database
  APPLICATION_ID: string
  APPLICATION_PUBLIC_KEY: string
  TOKEN: string
  WEBHOOK: string
}

export default {
  fetch: async (request: Request, env: Env, context: ExecutionContext): Promise<Response> => {
    if (request.method !== 'POST')
      return new Response('Method not allowed', { status: 405 })

    const client = new YorClient({
      application: {
        id: env.APPLICATION_ID,
        publicKey: env.APPLICATION_PUBLIC_KEY,
      },
      token: env.TOKEN,
    })

    client.registerCommands(commands)

    const ai = new Ai(env.AI)

    client.createMiddleware('command', (context) => {
      context.decorate('ai', ai)
      context.decorate('env', env)
      context.decorate('kv', env.MIYUKI_KV)
      context.decorate('database', env.MIYUKI_DB)
    })

    const url = new URL(request.url)
    const pathname = url.pathname

    if (pathname.startsWith('/interactions')) {
      const promise = client.handleInteraction(request)
      context.waitUntil(promise)

      const response = await promise

      return new Response(JSON.stringify(response))
    }

    if (pathname.startsWith('/deploy')) {
      try {
        const response = await client.deployCommands()
        return new Response(JSON.stringify(response))
      }
      catch (error) {
        return new Response(JSON.stringify(error))
      }
    }

    return new Response('Not found', { status: 404 })
  },
  scheduled: async (event: ScheduledController, env: Env, context: ExecutionContext) => {
    const webhook = new WebhookClient(env.WEBHOOK)

    const response = await fetch('https://api.nekosapi.com/v3/images/random')
    if (!response.ok)
      return

    const data = (await response.json()) as { items: NekosAPIResponse[] }
    const randomImage = data.items[Math.floor(Math.random() * data.items.length)]

    await webhook.send({
      wait: true,
      username: 'Nekos API',
      embeds: [
        new EmbedBuilder()
          .setTitle('Hourly Neko')
          .setDescription(`[Neko](${randomImage.image_url})`)
          .setImage(randomImage.image_url)
          .setColor([randomImage.color_dominant[0], randomImage.color_dominant[1], randomImage.color_dominant[2]])
          .toJSON(),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>()
          .addComponents(new ButtonBuilder().setLabel('View source').setStyle(ButtonStyle.Link).setURL(randomImage.source))
          .toJSON(),
      ],
    })
  },
} as ExportedHandler
