// ── Horário de funcionamento das entregas ─────────────────────────────────────

export type DaySchedule = {
  open: boolean
  from: string   // "HH:MM" — 24 h
  to: string     // "HH:MM" — 24 h
}

export type DeliveryHoursConfig = {
  enabled: boolean      // false = sem restrição, sempre aberto
  sameForAll: boolean   // true = mesmo horário todos os dias
  allFrom: string       // usado quando sameForAll = true
  allTo: string
  days: Record<string, DaySchedule>  // chaves "0"–"6" (Domingo–Sábado)
}

export const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
export const DAY_NAMES_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']

export const DEFAULT_DELIVERY_HOURS: DeliveryHoursConfig = {
  enabled: false,
  sameForAll: true,
  allFrom: '10:00',
  allTo: '22:00',
  days: {
    '0': { open: false, from: '10:00', to: '22:00' },
    '1': { open: true,  from: '10:00', to: '22:00' },
    '2': { open: true,  from: '10:00', to: '22:00' },
    '3': { open: true,  from: '10:00', to: '22:00' },
    '4': { open: true,  from: '10:00', to: '22:00' },
    '5': { open: true,  from: '10:00', to: '22:00' },
    '6': { open: true,  from: '10:00', to: '20:00' },
  },
}

/** Retorna se a entrega está aberta agora, e uma mensagem para o cliente. */
export function checkDeliveryOpen(cfg: DeliveryHoursConfig): {
  open: boolean
  closedMessage: string   // ex: "Fechado agora · Abre às 10:00"
  scheduleLines: string[] // ex: ["Seg–Sex: 10:00 – 22:00", "Sáb: 10:00 – 20:00", "Dom: fechado"]
} {
  if (!cfg.enabled) return { open: true, closedMessage: '', scheduleLines: [] }

  const now = new Date()
  const dow = now.getDay()  // 0 = domingo
  const hh  = String(now.getHours()).padStart(2, '0')
  const mm  = String(now.getMinutes()).padStart(2, '0')
  const cur = `${hh}:${mm}`

  // ── Calcula scheduleLines uma vez ─────────────────────────────────────────
  const scheduleLines: string[] = []

  if (cfg.sameForAll) {
    scheduleLines.push(`Todos os dias: ${cfg.allFrom} – ${cfg.allTo}`)
  } else {
    // Agrupa dias consecutivos com mesmo horário (compacta "Seg–Sex: 10:00–22:00")
    const rows: { label: string; from: string; to: string; open: boolean }[] = []
    for (let d = 0; d <= 6; d++) {
      const day = cfg.days[String(d)] ?? { open: false, from: '00:00', to: '00:00' }
      rows.push({ label: DAY_NAMES[d], from: day.from, to: day.to, open: day.open })
    }

    // Agrupamento simples: dias consecutivos com open+from+to iguais
    let i = 0
    while (i < rows.length) {
      const cur2 = rows[i]
      let j = i + 1
      while (
        j < rows.length &&
        rows[j].open === cur2.open &&
        rows[j].from === cur2.from &&
        rows[j].to === cur2.to
      ) j++
      const span = j - i
      const label = span === 1
        ? cur2.label
        : `${cur2.label}–${rows[j - 1].label}`
      if (cur2.open) {
        scheduleLines.push(`${label}: ${cur2.from} – ${cur2.to}`)
      } else {
        scheduleLines.push(`${label}: fechado`)
      }
      i = j
    }
  }

  // ── Verifica se está aberto agora ─────────────────────────────────────────
  if (cfg.sameForAll) {
    if (cur >= cfg.allFrom && cur <= cfg.allTo) {
      return { open: true, closedMessage: '', scheduleLines }
    }
    const msg = cur < cfg.allFrom
      ? `Fecha: abre às ${cfg.allFrom}`
      : `Fecha: abre amanhã às ${cfg.allFrom}`
    return { open: false, closedMessage: msg, scheduleLines }
  }

  const todaySchedule = cfg.days[String(dow)]
  if (!todaySchedule?.open) {
    // Procura próximo dia aberto
    let nextMsg = 'Próximo dia com entregas em breve'
    for (let delta = 1; delta <= 7; delta++) {
      const nextDay = cfg.days[String((dow + delta) % 7)]
      if (nextDay?.open) {
        const name = DAY_NAMES_FULL[(dow + delta) % 7]
        nextMsg = delta === 1 ? `Abre amanhã às ${nextDay.from}` : `Abre ${name} às ${nextDay.from}`
        break
      }
    }
    return { open: false, closedMessage: nextMsg, scheduleLines }
  }

  if (cur >= todaySchedule.from && cur <= todaySchedule.to) {
    return { open: true, closedMessage: '', scheduleLines }
  }

  const msg = cur < todaySchedule.from
    ? `Abre hoje às ${todaySchedule.from}`
    : (() => {
        // Busca próximo dia aberto
        for (let delta = 1; delta <= 7; delta++) {
          const nextDay = cfg.days[String((dow + delta) % 7)]
          if (nextDay?.open) {
            const name = DAY_NAMES_FULL[(dow + delta) % 7]
            return delta === 1 ? `Abre amanhã às ${nextDay.from}` : `Abre ${name} às ${nextDay.from}`
          }
        }
        return 'Entregas temporariamente indisponíveis'
      })()

  return { open: false, closedMessage: msg, scheduleLines }
}
