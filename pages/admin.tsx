import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Header from '../components/Header'
import withAuth from '../components/withAuth'
import styles from './admin.module.css'

interface Participant {
  id: number
  user_id: string
  name: string
  surname: string
  email: string
  role: string
  bmi: number | null
  active: boolean
  country: string
  notes: string
}

interface Stats {
  runners: number
  coords: number
  active: number
  blocked: number
  withBmi: number
  noBmi: number
  avgBmi: string | null
  total: number
}

function AdminPage() {
  const [all, setAll] = useState<Participant[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [selected, setSelected] = useState<Participant | null>(null)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Все роли')
  const [editForm, setEditForm] = useState<Partial<Participant>>({})
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  async function load() {
    const [pRes, sRes] = await Promise.all([
      fetch('/api/participants'),
      fetch('/api/admin/stats'),
    ])
    if (sRes.status === 403) { setForbidden(true); return }
    setAll(await pRes.json())
    setStats(await sRes.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

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
    .sort((a, b) => a.name.localeCompare(b.name))

  function selectRow(r: Participant) {
    setSelected(r)
    setEditForm({ ...r })
    setStatus('')
  }

  async function save() {
    if (!selected) return
    const res = await fetch(`/api/admin/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm),
    })
    if (res.ok) {
      const updated = await res.json()
      setAll(prev => prev.map(p => p.id === updated.id ? updated : p))
      setSelected(updated)
      setStatus(`✔ Данные ${updated.name} ${updated.surname} сохранены.`)
      load()
    }
  }

  async function toggleActive() {
    if (!selected) return
    const newActive = selected.active === false ? true : false
    const res = await fetch(`/api/admin/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: newActive }),
    })
    if (res.ok) {
      const updated = await res.json()
      setAll(prev => prev.map(p => p.id === updated.id ? updated : p))
      setSelected(updated)
      setEditForm(f => ({ ...f, active: updated.active }))
      setStatus(newActive ? `✔ ${updated.name} разблокирован(а).` : `🔒 ${updated.name} заблокирован(а).`)
      load()
    }
  }

  async function makeCoord() {
    if (!selected) return
    const res = await fetch(`/api/admin/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'Координатор' }),
    })
    if (res.ok) {
      const updated = await res.json()
      setAll(prev => prev.map(p => p.id === updated.id ? updated : p))
      setSelected(updated)
      setEditForm(f => ({ ...f, role: 'Координатор' }))
      setStatus(`⭐ ${updated.name} назначен(а) координатором.`)
      load()
    }
  }

  async function resetBmi() {
    if (!selected) return
    const res = await fetch(`/api/admin/${selected.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bmi: null }),
    })
    if (res.ok) {
      const updated = await res.json()
      setAll(prev => prev.map(p => p.id === updated.id ? updated : p))
      setSelected(updated)
      setStatus(`↺ BMI для ${updated.name} сброшен.`)
      load()
    }
  }

  async function deleteParticipant() {
    if (!selected) return
    if (!confirm(`Удалить участника ${selected.name} ${selected.surname}?`)) return
    const name = `${selected.name} ${selected.surname}`
    await fetch(`/api/admin/${selected.id}`, { method: 'DELETE' })
    setAll(prev => prev.filter(p => p.id !== selected.id))
    setSelected(null)
    setStatus(`🗑 Участник ${name} удалён.`)
    load()
  }

  if (forbidden) {
    return (
      <div className={styles.page}>
        <Header showBack backHref="/" title="⚙ ПАНЕЛЬ АДМИНИСТРАТОРА" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 48 }}>🔒</div>
          <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--dark)' }}>Доступ запрещён</p>
          <p style={{ fontSize: 13, color: '#666' }}>Только Координаторы могут открывать панель администратора.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head><title>Админ — Marathon Skills 2026</title></Head>
      <div className={styles.page}>
        <Header showBack backHref="/" title="⚙ ПАНЕЛЬ АДМИНИСТРАТОРА" />

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>Загрузка...</div>
        ) : (
          <div className={styles.body}>
            {/* LEFT */}
            <div className={styles.left}>
              {/* Stats */}
              {stats && (
                <>
                  <div className={styles.statGrid1}>
                    <StatCard label="🏃 Бегунов"       val={stats.runners} color="var(--dark)" />
                    <StatCard label="⭐ Координаторов" val={stats.coords}  color="#2C3E50" />
                    <StatCard label="✔ Активных"       val={stats.active}  color="#27AE60" />
                    <StatCard label="🔒 Заблокировано" val={stats.blocked} color="#E74C3C" />
                  </div>
                  <div className={styles.statGrid2}>
                    <StatCard label="📊 С BMI"     val={stats.withBmi} color="#8E44AD" sm />
                    <StatCard label="— Без BMI"    val={stats.noBmi}   color="#D35400" sm />
                    <StatCard label="⌀ Ср. BMI"   val={stats.avgBmi ?? '—'} color="#16A085" sm />
                  </div>
                </>
              )}

              {/* Filter */}
              <div className={styles.filterRow}>
                <label style={{ fontSize: 13, color: 'var(--label)' }}>Роль:</label>
                <select className="fsel" style={{ width: 'auto' }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                  <option>Все роли</option><option>Бегун</option><option>Координатор</option>
                </select>
                <input className="finput" style={{ flex: 1 }} placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>

              <div style={{ padding: '0 14px 6px', fontSize: 13, fontWeight: 700, color: 'var(--dark)' }}>
                Всего: {filtered.length}
              </div>

              <div className={styles.tableWrap}>
                <table>
                  <thead>
                    <tr>
                      <th>ИМЯ</th><th>ФАМИЛИЯ</th><th>EMAIL</th><th>РОЛЬ</th><th>BMI</th><th>СТ.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(r => (
                      <tr
                        key={r.id}
                        onClick={() => selectRow(r)}
                        className={[
                          r.active === false ? styles.blocked : '',
                          selected?.id === r.id ? styles.selRow : '',
                        ].join(' ')}
                      >
                        <td>{r.name}</td>
                        <td>{r.surname}</td>
                        <td>{r.email}</td>
                        <td><span className="badge" style={{ background: r.role === 'Координатор' ? '#2c3e50' : '#E74C3C' }}>{r.role}</span></td>
                        <td>{r.bmi != null ? Number(r.bmi).toFixed(1) : '—'}</td>
                        <td style={{ textAlign: 'center' }}>
                          {r.active === false
                            ? <span style={{ color: '#E74C3C' }}>🔒</span>
                            : <span style={{ color: '#27AE60' }}>✔</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: Edit panel */}
            <div className={styles.right}>
              <div className={styles.editHdr}>Редактирование участника</div>

              {!selected ? (
                <div className={styles.editEmpty}>
                  <div style={{ fontSize: 40 }}>👆</div>
                  <p>Выберите участника из таблицы</p>
                </div>
              ) : (
                <div className={styles.editBody}>
                  <label className={styles.efl}>Имя</label>
                  <input className="finput" value={editForm.name || ''} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                  <label className={styles.efl}>Фамилия</label>
                  <input className="finput" value={editForm.surname || ''} onChange={e => setEditForm(f => ({ ...f, surname: e.target.value }))} />
                  <label className={styles.efl}>Email</label>
                  <input className="finput" value={editForm.email || ''} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
                  <label className={styles.efl}>Роль</label>
                  <select className="fsel" value={editForm.role || 'Бегун'} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))}>
                    <option>Бегун</option>
                    <option>Координатор</option>
                  </select>
                  <label className={styles.efl}>Страна</label>
                  <input className="finput" value={editForm.country || ''} onChange={e => setEditForm(f => ({ ...f, country: e.target.value }))} />
                  <label className={styles.efl}>Примечания</label>
                  <textarea className="finput" value={editForm.notes || ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} style={{ resize: 'vertical', minHeight: 56 }} />

                  <div className={styles.actions}>
                    <button className="btn btn-success" style={{ width: '100%' }} onClick={save}>💾 Сохранить</button>
                    <div className={styles.btn2}>
                      <button className="btn btn-dark" onClick={makeCoord}>⭐ Координатор</button>
                      <button className="btn btn-secondary" onClick={resetBmi}>↺ Сброс BMI</button>
                    </div>
                    <button
                      className={`btn ${selected.active === false ? 'btn-success' : 'btn-primary'}`}
                      style={{ width: '100%' }}
                      onClick={toggleActive}
                    >
                      {selected.active === false ? '✔ Разблокировать' : '🔒 Заблокировать'}
                    </button>
                    <button className="btn btn-danger" style={{ width: '100%' }} onClick={deleteParticipant}>
                      🗑 Удалить участника
                    </button>
                  </div>

                  {status && <div className={styles.statusBar}>{status}</div>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function StatCard({ label, val, color, sm }: { label: string; val: any; color: string; sm?: boolean }) {
  return (
    <div className={styles.statCard} style={{ background: color }}>
      <div className={styles.scLbl}>{label}</div>
      <div className={styles.scVal} style={{ fontSize: sm ? 22 : 28 }}>{val}</div>
    </div>
  )
}

export default withAuth(AdminPage)
