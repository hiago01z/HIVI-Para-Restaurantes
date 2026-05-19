import { networkInterfaces } from 'os'
import { spawn, exec } from 'child_process'
import { platform } from 'process'
import { fileURLToPath } from 'url'
import { resolve, dirname } from 'path'

const PORT = 3000
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const NEXT_BIN = resolve(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next')

function getLocalIP() {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return null
}

function openBrowser(url) {
  const cmd =
    platform === 'win32' ? `start "" "${url}"` :
    platform === 'darwin' ? `open "${url}"` :
    `xdg-open "${url}"`
  exec(cmd)
}

function printBanner(localIP) {
  const pcUrl     = `http://localhost:${PORT}`
  const mobileUrl = localIP ? `http://${localIP}:${PORT}` : null

  console.clear()
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║         HIVI Para Restaurantes               ║')
  console.log('╠══════════════════════════════════════════════╣')
  console.log(`║  💻  PC:      ${pcUrl.padEnd(31)}║`)
  if (mobileUrl) {
    console.log(`║  📱  Celular: ${mobileUrl.padEnd(31)}║`)
  } else {
    console.log('║  📱  Celular: IP local não encontrado         ║')
  }
  console.log('╠══════════════════════════════════════════════╣')
  console.log('║  Pressione Ctrl+C para parar o servidor       ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log('')
}

const localIP = getLocalIP()
printBanner(localIP)

// Chama o binário do Next.js diretamente via Node — sem shell, sem npx
const server = spawn(
  process.execPath,
  [NEXT_BIN, 'dev', '--hostname', '0.0.0.0', '--port', String(PORT)],
  { stdio: 'inherit', cwd: ROOT }
)

// Abre o navegador no PC após o servidor subir
setTimeout(() => openBrowser(`http://localhost:${PORT}`), 2500)

server.on('close', (code) => process.exit(code ?? 0))

process.on('SIGINT', () => {
  server.kill('SIGINT')
  process.exit(0)
})
