import Head from 'next/head'
import { useEffect, useState } from 'react'
import Header from '../components/Header'
import CountdownBar from '../components/CountdownBar'
import withAuth from '../components/withAuth'
import styles from './participants.module.css'

interface Participant {
  id: number
  name: string
  surname: string
  email: string
  role: string
  bmi: number | null
  active: boolean
}

function ParticipantsPage() {
  const [all, setAll] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Все роли')
  const [sortBy, setSortBy] = useState('Имени')

  useEffect(() => {
    fetch('/api/participants')
      .then(r => r.json())
      .then(data => { setAll(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = all
    .filter(r => {
      if (roleFilter !== 'Все роли' && r.role !== roleFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return r.name.toLowerCase().includes(q) ||
               r.surname.toLowerCase().includes(q) ||
               r.email.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      if (sortBy === 'Фамилии') return a.surname.localeCompare(b.surname)
      if (sortBy === 'Email')   return a.email.localeCompare(b.email)
      return a.name.localeCompare(b.name)
    })

  return (
    <>
      <Head><title>Участники — Marathon Skills 2026</title></Head>
      <div className={styles.page}>
        <Header showBack backHref="/" showAdmin />

        <div className={styles.hero}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1400&q=80"
            alt="Участники"
            onError={(e) => { e.currentTarget.style.display='none' }}
          />
          <div className={styles.heroText}>
            <p className={styles.heroTitle}>Список зарегистрированных участников</p>
            <span className={styles.countBadge}>{filtered.length} чел.</span>
          </div>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.fg}>
            <label>Фильтр по ролям:</label>
            <select className="fsel" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option>Все роли</option>
              <option>Бегун</option>
              <option>Координатор</option>
            </select>
          </div>
          <div className={styles.fg}>
            <label>Сортировать по:</label>
            <select className="fsel" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option>Имени</option>
              <option>Фамилии</option>
              <option>Email</option>
            </select>
          </div>
          <div className={styles.fg}>
            <label>Поиск:</label>
            <input className="finput" value={search} onChange={e => setSearch(e.target.value)} style={{ minWidth: 160 }} />
          </div>
        </div>

        <div className={styles.cnt}>Всего: <strong>{filtered.length}</strong></div>

        <div className={styles.tableWrap}>
          {loading ? (
            <p style={{ padding: 20, color: '#888' }}>Загрузка...</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ИМЯ</th><th>ФАМИЛИЯ</th><th>EMAIL</th><th>РОЛЬ</th><th>BMI</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} style={{ opacity: r.active === false ? 0.45 : 1 }}>
                    <td>{r.name}</td>
                    <td>{r.surname}</td>
                    <td>{r.email}</td>
                    <td>
                      <span className="badge" style={{ background: r.role === 'Координатор' ? '#2c3e50' : '#E74C3C' }}>
                        {r.role}
                      </span>
                    </td>
                    <td>{r.bmi != null ? Number(r.bmi).toFixed(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <CountdownBar />
      </div>
    </>
  )
}

export default withAuth(ParticipantsPage)
