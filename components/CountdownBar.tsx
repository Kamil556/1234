import { useState, useEffect } from 'react'

// Дата марафона — 15 сентября 2026
const MARATHON_DATE = new Date('2026-09-15T09:00:00')

export default function CountdownBar() {
  const [timeStr, setTimeStr] = useState('')

  useEffect(() => {
    function tick() {
      const diff = MARATHON_DATE.getTime() - Date.now()
      if (diff <= 0) {
        setTimeStr('🏃 Marathon Skills 2026 — Марафон начался!')
        return
      }
      const days = Math.floor(diff / 86400000)
      const hrs  = Math.floor((diff % 86400000) / 3600000)
      const mins = Math.floor((diff % 3600000) / 60000)
      const secs = Math.floor((diff % 60000) / 1000)
      setTimeStr(
        `⏱ До старта Marathon Skills 2026: ${days}д ${hrs}ч ${String(mins).padStart(2,'0')}м ${String(secs).padStart(2,'0')}с`
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return <div className="tbar">{timeStr}</div>
}
