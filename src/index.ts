import { Ai } from '@cloudflare/ai'
import { YorClient } from 'yor.ts'
import { commands } from './commands/index.js'

export interface Env {
  AI: any
  MIYUKI_KV: KVNamespace
  APPLICATION_ID: string
  APPLICATION_PUBLIC_KEY: string
  TOKEN: string
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
}
