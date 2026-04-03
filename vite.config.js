import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { cleanPathToDevHtml } from './src/lib/routes.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function cleanRoutesDevPlugin() {
  return {
    name: 'clean-routes-dev',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url || req.method !== 'GET') return next()
        const q = req.url.indexOf('?')
        const pathPart = q === -1 ? req.url : req.url.slice(0, q)
        const target = cleanPathToDevHtml[pathPart]
        if (target) {
          req.url = q === -1 ? target : `${target}${req.url.slice(q)}`
        }
        next()
      })
    },
  }
}

function multiPageInput() {
  const inputs = { main: path.resolve(__dirname, 'index.html') }
  const pagesDir = path.join(__dirname, 'src/pages')
  for (const file of fs.readdirSync(pagesDir)) {
    if (file.endsWith('.html')) {
      const key = path.join('src', 'pages', file).replace(/\\/g, '/').replace('.html', '')
      inputs[key] = path.join(pagesDir, file)
    }
  }
  return inputs
}

export default defineConfig({
  plugins: [cleanRoutesDevPlugin()],
  build: {
    rollupOptions: {
      input: multiPageInput(),
    },
  },
})
