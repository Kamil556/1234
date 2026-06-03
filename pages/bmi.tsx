import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import Header from '../components/Header'
import withAuth from '../components/withAuth'
import styles from './bmi.module.css'

type Gender = 'Мужской' | 'Женский'

function bmiCategory(val: number): { cat: string; color: string; icon: string } {
  if (val < 18.5) return { cat: 'Недостаточный вес',  color: '#E74C3C', icon: '😟' }
  if (val < 25)   return { cat: 'Здоровый вес',        color: '#27AE60', icon: '🏃' }
  if (val < 30)   return { cat: 'Избыточный вес',      color: '#F39C12', icon: '⚠️' }
  return           { cat: 'Ожирение',                  color: '#C0392B', icon: '🚨' }
}

function arrowPos(val: number): number {
  // шкала 15–40, мап в 0–100%
  const clamped = Math.max(15, Math.min(40, val))
  return ((clamped - 15) / 25) * 100
}

function BmiPage() {
  const router = useRouter()
  const [gender, setGender] = useState<Gender>('Мужской')
  const [height, setHeight] = useState('170')
  const [weight, setWeight] = useState('70')
  const [result, setResult] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function calc() {
    const h = parseFloat(height) / 100
    const w = parseFloat(weight)
    if (!h || !w || h <= 0 || w <= 0) return
    setResult(Math.round((w / (h * h)) * 10) / 10)
    setSaved(false)
  }

  function reset() {
    setHeight('170')
    setWeight('70')
    setResult(null)
    setSaved(false)
  }

  async function save() {
    if (result === null) return
    setSaving(true)
    try {
      const res = await fetch('/api/participants/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bmi: result }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => router.push('/'), 1200)
      }
    } finally {
      setSaving(false)
    }
  }

  const info = result !== null ? bmiCategory(result) : null

  return (
    <>
      <Head><title>BMI — Marathon Skills 2026</title></Head>
      <div className={styles.page}>
        <Header
          showBack
          backHref="/"
          title="BMI CALCULATOR"
          showParticipants
        />

        <div className={styles.scroll}>
          <p className={styles.ptitle}>BMI калькулятор</p>

          <div className={styles.grid}>
            {/* Left: inputs */}
            <div>
              <div className={styles.illus}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://images.unsplash.com/photo-1594737625785-a6cbdabd333c?w=900&q=80"
                  alt="BMI"
                  onError={(e) => { e.currentTarget.style.display='none' }}
                />
                <div className={styles.illusOverlay}><span>Оцените свою физическую форму</span></div>
              </div>

              <p className={styles.desc}>
                Индекс массы тела (BMI) — показатель, вычисляемый как отношение массы тела (кг)
                к квадрату роста (м²). Используется для оценки весовой категории.
              </p>

              <div className={styles.genderRow}>
                <button
                  className={`btn ${gender === 'Мужской' ? 'btn-dark' : 'btn-secondary'}`}
                  onClick={() => setGender('Мужской')}
                >👨 Мужской</button>
                <button
                  className={`btn ${gender === 'Женский' ? 'btn-dark' : 'btn-secondary'}`}
                  onClick={() => setGender('Женский')}
                >👩 Женский</button>
              </div>

              <div className={styles.hwRow}>
                <span className={styles.hwLbl}>Рост:</span>
                <input className="finput" type="number" value={height} onChange={e => setHeight(e.target.value)} style={{ width: 70 }} />
                <span className={styles.hwUnit}>см</span>
              </div>
              <div className={styles.hwRow}>
                <span className={styles.hwLbl}>Вес:</span>
                <input className="finput" type="number" value={weight} onChange={e => setWeight(e.target.value)} style={{ width: 70 }} />
                <span className={styles.hwUnit}>кг</span>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button className="btn btn-dark" onClick={calc}>Рассчитать</button>
                <button className="btn btn-secondary" onClick={reset}>Сброс</button>
              </div>
            </div>

            <div />

            {/* Right: result */}
            <div className={styles.resultCol}>
              <div className={styles.icon}>{info ? info.icon : '🏃'}</div>
              <div className={styles.cat} style={{ color: info?.color || '#999' }}>
                {info ? info.cat : ''}
              </div>
              <div className={styles.val}>{result !== null ? result.toFixed(1) : '—'}</div>

              {/* Scale */}
              <div className={styles.scaleWrap}>
                {result !== null && (
                  <div
                    className={styles.arrow}
                    style={{ left: `${arrowPos(result)}%` }}
                  />
                )}
                <div className={styles.bar}>
                  <div style={{ background: '#E74C3C', borderRadius: '3px 0 0 3px' }} />
                  <div style={{ background: '#27AE60' }} />
                  <div style={{ background: '#F39C12' }} />
                  <div style={{ background: '#C0392B', borderRadius: '0 3px 3px 0' }} />
                </div>
                <div className={styles.barLabels}>
                  <span style={{ color: '#E74C3C' }}>Недост.</span>
                  <span style={{ color: '#27AE60' }}>Здоровый</span>
                  <span style={{ color: '#F39C12' }}>Избыточ.</span>
                  <span style={{ color: '#C0392B' }}>Ожирение</span>
                </div>
              </div>

              {result !== null && (
                <button className="btn btn-success" onClick={save} disabled={saving || saved} style={{ marginTop: 20 }}>
                  {saved ? '✔ Сохранено!' : saving ? 'Сохранение...' : '💾 Сохранить BMI'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          {result !== null
            ? `BMI ${result.toFixed(1)} — ${info?.cat} | Пол: ${gender}`
            : 'Введите рост и вес, затем нажмите «Рассчитать»'}
        </div>
      </div>
    </>
  )
}

export default withAuth(BmiPage)
