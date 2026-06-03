import Head from 'next/head'
import { useState } from 'react'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import Header from '../components/Header'
import CountdownBar from '../components/CountdownBar'
import withAuth from '../components/withAuth'
import styles from './register.module.css'

function RegisterPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [form, setForm] = useState({
    name: session?.user?.name?.split(' ')[0] || '',
    surname: session?.user?.name?.split(' ').slice(1).join(' ') || '',
    gender: 'Мужской',
    dob: '1990-01-01',
    country: 'Казахстан',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
    setError('')
  }

  async function submit() {
    if (!form.name.trim()) return setError('Введите имя')
    if (!form.surname.trim()) return setError('Введите фамилию')

    setLoading(true)
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          photo_url: session?.user?.image || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) return setError(data.error || 'Ошибка регистрации')
      router.push('/bmi?registered=1')
    } catch {
      setError('Ошибка сети')
    } finally {
      setLoading(false)
    }
  }

  const countries = ['Казахстан','Россия','Беларусь','Украина','Германия','Франция','США','Великобритания','Китай','Япония','Другое']

  return (
    <>
      <Head><title>Регистрация — Marathon Skills 2026</title></Head>
      <div className={styles.page}>
        <Header showBack backHref="/" />

        <div className={styles.scroll}>
          <div className={styles.wrap}>
            <div className={styles.banner}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&q=80"
                alt="Регистрация"
                onError={(e) => { e.currentTarget.style.display = 'none' }}
              />
              <div className={styles.bannerOverlay}>
                <span>Регистрация бегуна — Marathon Skills 2026</span>
              </div>
            </div>

            <p className={styles.sub}>Пожалуйста заполните всю информацию, чтобы зарегистрироваться в качестве бегуна</p>

            {error && <div className={styles.errBox}>{error}</div>}

            <div className={styles.grid}>
              <div className={styles.left}>
                <div className={styles.fieldGroup}>
                  <label className="flabel">Email:</label>
                  <input className="finput" value={session?.user?.email || ''} readOnly style={{ background: '#f5f5f5' }} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className="flabel">Имя:</label>
                  <input className="finput" value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className="flabel">Фамилия:</label>
                  <input className="finput" value={form.surname} onChange={e => set('surname', e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className="flabel">Пол:</label>
                  <select className="fsel" value={form.gender} onChange={e => set('gender', e.target.value)}>
                    <option>Мужской</option>
                    <option>Женский</option>
                  </select>
                </div>
              </div>

              <div />

              <div className={styles.right}>
                {session?.user?.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user.image} alt="Фото" className={styles.avatar} />
                )}
                <div className={styles.fieldGroup}>
                  <label className="flabel">Дата рождения:</label>
                  <input className="finput" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
                </div>
                <div className={styles.fieldGroup}>
                  <label className="flabel">Страна:</label>
                  <select className="fsel" value={form.country} onChange={e => set('country', e.target.value)}>
                    {countries.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className="btn btn-primary" onClick={submit} disabled={loading}>
                {loading ? 'Сохранение...' : 'Зарегистрироваться'}
              </button>
              <button className="btn btn-secondary" onClick={() => router.push('/')}>Отмена</button>
            </div>
          </div>
        </div>

        <CountdownBar />
      </div>
    </>
  )
}

export default withAuth(RegisterPage)
