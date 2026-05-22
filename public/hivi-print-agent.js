#!/usr/bin/env node
/**
 * HIVI Print Agent
 * ─────────────────────────────────────────────────────
 * Ponte local entre o painel web HIVI e uma impressora
 * térmica de rede (TCP/IP, porta 9100).
 *
 * COMO USAR
 * ─────────────────────────────────────────────────────
 * 1. Descubra o IP da sua impressora (impresso na auto-
 *    configuração ou veja no roteador).
 * 2. Execute:
 *       node hivi-print-agent.js --ip 192.168.1.100
 *    Deixe o terminal aberto enquanto o restaurante
 *    estiver funcionando.
 * 3. No painel HIVI → Configurações → Impressora Térmica,
 *    selecione "Rede" e clique em "Verificar agente".
 *
 * OPÇÕES
 * ─────────────────────────────────────────────────────
 *   --ip          IP da impressora (padrão: 192.168.1.100)
 *   --port        Porta TCP da impressora (padrão: 9100)
 *   --agent-port  Porta do agente HTTP (padrão: 6557)
 *
 * REQUISITOS: Node.js 16+. Nenhuma dependência extra.
 */

const http = require('http')
const net  = require('net')

// ─── Parse CLI args ───────────────────────────────────────────────────────────
const args = process.argv.slice(2)
function arg(flag, defaultValue) {
  const idx = args.indexOf(flag)
  return idx !== -1 ? args[idx + 1] : defaultValue
}

const PRINTER_IP   = arg('--ip',         '192.168.1.100')
const PRINTER_PORT = parseInt(arg('--port',       '9100'), 10)
const AGENT_PORT   = parseInt(arg('--agent-port', '6557'), 10)

// ─── HTTP server ──────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  // CORS: allow the HIVI panel (any origin) to reach the agent
  res.setHeader('Access-Control-Allow-Origin',  '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(200)
    res.end()
    return
  }

  // ── GET /status — liveness probe ──────────────────────────────────────────
  if (req.method === 'GET' && req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, printer: `${PRINTER_IP}:${PRINTER_PORT}` }))
    return
  }

  // ── POST /print — forward raw ESC/POS bytes to printer ────────────────────
  if (req.method === 'POST' && req.url === '/print') {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      const data = Buffer.concat(chunks)
      const printer = net.createConnection(
        { host: PRINTER_IP, port: PRINTER_PORT },
        () => {
          printer.write(data)
          printer.end()
        }
      )
      // Prevent indefinite hang when the printer IP is wrong or powered off
      printer.setTimeout(5000, () => {
        printer.destroy(new Error('Timeout: impressora não respondeu em 5 segundos.'))
      })
      printer.on('close', () => {
        res.writeHead(200)
        res.end('OK')
      })
      printer.on('error', (err) => {
        console.error('[HIVI] Erro ao conectar à impressora:', err.message)
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: err.message }))
      })
    })
    return
  }

  res.writeHead(404)
  res.end()
})

server.listen(AGENT_PORT, '127.0.0.1', () => {
  console.log('╔══════════════════════════════════════╗')
  console.log('║   HIVI Print Agent — iniciado!       ║')
  console.log('╠══════════════════════════════════════╣')
  console.log(`║  Impressora : ${PRINTER_IP}:${PRINTER_PORT}`.padEnd(41) + '║')
  console.log(`║  Agente     : http://localhost:${AGENT_PORT}`.padEnd(41) + '║')
  console.log('╚══════════════════════════════════════╝')
  console.log('\nAguardando jobs de impressão... (Ctrl+C para encerrar)\n')
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[HIVI] Porta ${AGENT_PORT} já está em uso. Tente --agent-port OUTRA_PORTA`)
  } else {
    console.error('[HIVI] Erro no servidor:', err.message)
  }
  process.exit(1)
})
