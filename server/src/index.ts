import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })
// API_PORT évite la collision avec la variable PORT que certains outils injectent pour le front
const PORT = Number(process.env.API_PORT || 8787)

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/api/status', (_req, res) => {
  res.json({ ok: true, app: 'habanera-mvp' })
})

// ---------- front (build) ----------
const dist = path.resolve(__dirname, '../../client/dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

app.listen(PORT, () => {
  console.log(`▸ HABANERA MVP server on http://localhost:${PORT}`)
})
