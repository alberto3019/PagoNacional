import { defineConfig } from 'vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
  build: {
    rollupOptions: {
      input: multiPageInput(),
    },
  },
})
