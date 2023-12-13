const { polyfillNode } = require('esbuild-plugin-polyfill-node')

require('esbuild')
  .build({
    minify: true,
    bundle: true,
    format: 'esm',
    entryPoints: ['src/index.ts'],
    outdir: 'dist',
    platform: 'browser',
    target: 'esnext',
    sourcemap: true,
    logLevel: 'info',
    plugins: [
      polyfillNode({
        polyfills: {
          url: true,
          util: true,
        },
      }),
    ],
  }).catch(() => process.exit(1))
