import { useSession, signOut, signIn } from 'next-auth/react'
import { useEffect, useRef, useState, useCallback } from 'react'

const COUNTRIES = [
  'Казахстан','Россия','США','Германия','Франция','Великобритания','Китай','Япония',
  'Бразилия','Канада','Австралия','Индия','Италия','Испания','Нидерланды','Польша',
  'Швеция','Норвегия','Финляндия','Дания','Швейцария','Австрия','Украина','Беларусь',
  'Узбекистан','Кыргызстан','Азербайджан','Грузия','Армения','Молдова','Другая страна'
]

/* ─── TIMER ─────────────────────────────────────────────────── */
function useTimer() {
  const [parts, setParts] = useState({ d:0, h:0, m:0, s:0, started:false })
  useEffect(() => {
    const target = new Date('2026-06-15T09:00:00')
    const tick = () => {
      const diff = target - new Date()
      if (diff <= 0) { setParts({ started: true }); return }
      setParts({
        d: Math.floor(diff/86400000),
        h: Math.floor((diff%86400000)/3600000),
        m: Math.floor((diff%3600000)/60000),
        s: Math.floor((diff%60000)/1000),
        started: false,
      })
    }
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id)
  }, [])
  return parts
}

/* ─── BMI helpers ───────────────────────────────────────────── */
function bmiCategory(v) {
  if (!v) return ''
  if (v < 18.5) return 'Недостаточный вес'
  if (v < 25)   return 'Здоровый вес ✓'
  if (v < 30)   return 'Избыточный вес'
  return 'Ожирение'
}
function bmiColor(v) {
  if (!v) return 'var(--text-3)'
  if (v < 18.5) return 'var(--blue)'
  if (v < 25)   return 'var(--green)'
  if (v < 30)   return 'var(--yellow)'
  return 'var(--red)'
}

function drawFigureOnCanvas(canvas, bmiVal, gender) {
  if (!canvas) return
  const w = canvas.offsetWidth||300, h = canvas.offsetHeight||160
  canvas.width=w; canvas.height=h
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0,0,w,h)
  const bc = bmiVal ? bmiColor(bmiVal).replace(/var\(--(\w+)\)/, '') : '#666'
  const colorMap = { blue:'#4E9FFF', green:'#3DDC84', yellow:'#FFD166', red:'#FF4B6E', 'text-3':'#555' }
  const col = bmiVal
    ? (bmiVal < 18.5 ? '#4E9FFF' : bmiVal < 25 ? '#3DDC84' : bmiVal < 30 ? '#FFD166' : '#FF4B6E')
    : '#444'
  const bw = bmiVal===0?20 : bmiVal<18.5?13 : bmiVal<25?20 : bmiVal<30?28 : 38
  const cx=w/2, cy=h/2-8
  ctx.fillStyle = col
  ctx.beginPath(); ctx.arc(cx,cy-46,16,0,Math.PI*2); ctx.fill()
  ctx.fillRect(cx-bw,cy-29,bw*2,50)
  ctx.fillRect(cx-bw-12,cy-27,11,38)
  ctx.fillRect(cx+bw+1,cy-27,11,38)
  ctx.fillRect(cx-bw+4,cy+21,bw-8,42)
  ctx.fillRect(cx+4,cy+21,bw-8,42)
  ctx.font='bold 12px Manrope'; ctx.fillStyle=col; ctx.textAlign='center'
  ctx.fillText(gender==='Женский'?'♀':'♂',cx,h-6)
}
function drawGaugeOnCanvas(canvas, bmiVal) {
  if (!canvas) return
  const pw=(canvas.offsetWidth||300)-20
  canvas.width=canvas.offsetWidth||300; canvas.height=canvas.offsetHeight||56
  const ctx=canvas.getContext('2d')
  ctx.clearRect(0,0,canvas.width,canvas.height)
  const gx=10,gy=18,gh=10
  const segs=[
    {c:'#4E9FFF',l:'Недостат.',w:.22},
    {c:'#3DDC84',l:'Норма',w:.30},
    {c:'#FFD166',l:'Избыточ.',w:.24},
    {c:'#FF4B6E',l:'Ожирение',w:.24},
  ]
  let x=gx
  ctx.save(); ctx.beginPath()
  ctx.roundRect(gx,gy,pw,gh,4); ctx.clip()
  segs.forEach(s => {
    const sw=pw*s.w
    ctx.fillStyle=s.c; ctx.fillRect(x,gy,sw,gh)
    x+=sw
  })
  ctx.restore()
  x=gx
  segs.forEach(s => {
    const sw=pw*s.w
    ctx.fillStyle='rgba(255,255,255,0.5)'; ctx.font='7px Manrope'; ctx.textAlign='center'
    ctx.fillText(s.l,x+sw/2,gy+gh+9)
    x+=sw
  })
  if (bmiVal > 0) {
    const norm=Math.min(Math.max((bmiVal-10)/30,0),1)
    const mx=gx+norm*pw
    ctx.fillStyle='#fff'
    ctx.beginPath(); ctx.moveTo(mx,gy-2); ctx.lineTo(mx-5,gy-10); ctx.lineTo(mx+5,gy-10); ctx.closePath(); ctx.fill()
  }
}

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
const card = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  backdropFilter: 'blur(12px)',
}
const glassNav = {
  background: 'rgba(6,6,16,0.85)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid var(--border)',
}
const inp = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-xs)',
  color: 'var(--text)',
  padding: '0 12px',
  height: 36,
  fontFamily: 'var(--font-body)',
  fontSize: 13,
  outline: 'none',
  transition: 'border .2s',
}
const sel = { ...inp }
const btnPrimary = {
  cursor: 'pointer', border: 'none', borderRadius: 'var(--radius-xs)',
  fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
  display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
  background: 'var(--orange)', color: '#fff', padding: '0 16px', height: 36,
  transition: 'all .2s', letterSpacing: '.02em',
}
const btnGhost = {
  ...btnPrimary,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid var(--border)',
  color: 'var(--text-2)',
}
const btnDanger = { ...btnPrimary, background: '#FF4B6E' }

/* ─── NAVBAR ────────────────────────────────────────────────── */
function Navbar({ onUsers, onRegister, onAdminLogin, session, isAdmin, onAdminLogout }) {
  return (
    <nav style={{ ...glassNav, height:60, display:'flex', alignItems:'center', padding:'0 20px', position:'sticky', top:0, zIndex:100, gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:34, height:34, borderRadius:10,
          background:'linear-gradient(135deg,var(--orange),var(--orange-2))',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0,
        }}>🏃</div>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, letterSpacing:'.1em' }}>MARATHON</div>
          <div style={{ fontSize:9, color:'var(--orange)', fontWeight:600, letterSpacing:'.05em' }}>SKILLS 2026</div>
        </div>
      </div>

      <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
        {session?.user ? (
          <>
            {isAdmin && (
              <span style={{
                background:'rgba(255,95,31,0.12)', border:'1px solid rgba(255,95,31,0.3)',
                borderRadius:'var(--radius-xs)', padding:'3px 10px', fontSize:9, fontWeight:700, color:'var(--orange)',
              }}>🔑 ADMIN</span>
            )}
            {session.user.image && (
              <img src={session.user.image} alt="" width={30} height={30}
                style={{ borderRadius:'50%', border:'2px solid var(--orange)', flexShrink:0 }} />
            )}
            <span style={{ fontSize:11, color:'var(--text-2)', maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {session.user.name?.split(' ')[0]}
            </span>
            <button style={btnGhost} onClick={onUsers}>👥 Участники</button>
            <button style={btnPrimary} onClick={onRegister}>+ Регистрация</button>
            {isAdmin
              ? <button style={{ ...btnGhost, color:'var(--orange)', fontSize:11 }} onClick={onAdminLogout}>↩ Выйти из адм.</button>
              : <button style={btnGhost} onClick={onAdminLogin}>🔒 Админ</button>
            }
            <button style={{ ...btnGhost, padding:'0 10px' }} onClick={() => signOut({ callbackUrl:'/' })}>⏻</button>
          </>
        ) : (
          <button onClick={() => signIn('google', { callbackUrl:'/' })} style={{
            display:'inline-flex', alignItems:'center', gap:8,
            background:'#fff', color:'#111', border:'none', borderRadius:'var(--radius-xs)',
            padding:'7px 18px', fontSize:12, fontWeight:700, cursor:'pointer',
          }}>
            <GoogleIcon /> Войти через Google
          </button>
        )}
      </div>
    </nav>
  )
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

/* ─── COUNTDOWN ─────────────────────────────────────────────── */
function Countdown() {
  const t = useTimer()
  if (t.started) return (
    <div style={{ textAlign:'center', padding:'12px 0', fontFamily:'var(--font-display)', color:'var(--orange)', fontSize:13 }}>
      🏃 МАРАФОН НАЧАЛСЯ!
    </div>
  )
  const units = [
    { label:'ДНЕ', val: t.d },
    { label:'ЧАС', val: t.h },
    { label:'МИН', val: t.m },
    { label:'СЕК', val: t.s },
  ]
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center', padding:'10px 0' }}>
      <span style={{ fontFamily:'var(--font-display)', fontSize:9, color:'var(--text-3)', letterSpacing:'.1em', marginRight:4 }}>ДО СТАРТА</span>
      {units.map((u,i) => (
        <div key={u.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
          {i>0 && <span style={{ color:'var(--text-3)', fontFamily:'var(--font-display)', fontSize:16 }}>:</span>}
          <div style={{ textAlign:'center' }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:18, fontWeight:700, color:'var(--text)', lineHeight:1, minWidth:28 }}>
              {String(u.val).padStart(2,'0')}
            </div>
            <div style={{ fontSize:8, color:'var(--text-3)', letterSpacing:'.12em', marginTop:2 }}>{u.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── MODAL SHELL ───────────────────────────────────────────── */
function ModalShell({ open, onClose, title, subtitle, children, width='min(900px,96vw)' }) {
  if (!open) return null
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(0,0,0,.75)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:200,
      backdropFilter:'blur(4px)', animation:'fadeIn .15s ease',
    }} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{
        background:'var(--bg-2)', border:'1px solid var(--border-hi)',
        borderRadius:16, width, maxHeight:'92vh', overflow:'hidden',
        display:'flex', flexDirection:'column', boxShadow:'0 24px 80px rgba(0,0,0,.6)',
      }}>
        {/* Header */}
        <div style={{
          padding:'16px 24px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', gap:12, flexShrink:0,
        }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:700, letterSpacing:'.04em' }}>{title}</div>
            {subtitle && <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{subtitle}</div>}
          </div>
          <button style={{ ...btnGhost, width:32, height:32, padding:0, justifyContent:'center', borderRadius:8, fontSize:16 }} onClick={onClose}>×</button>
        </div>
        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─── FIELD ─────────────────────────────────────────────────── */
function Field({ label, children, span=1 }) {
  return (
    <div style={{ gridColumn: span > 1 ? `span ${span}` : undefined }}>
      <label style={{ display:'block', fontSize:11, color:'var(--text-3)', marginBottom:5, fontWeight:600, letterSpacing:'.04em' }}>{label}</label>
      {children}
    </div>
  )
}

/* ─── REGISTER MODAL ────────────────────────────────────────── */
function RegisterModal({ open, onClose, onSave, editData }) {
  const isEdit = !!editData
  const [form, setForm] = useState({ email:'', password:'', password2:'', name:'', surname:'', gender:'Мужской', role:'Бегун', country:'Казахстан', dob:'1990-01-01', photo:'', photoName:'' })
  const [msg, setMsg] = useState({ text:'', ok:false })

  useEffect(() => {
    if (editData) {
      setForm({ email:editData.email||'', password:'', password2:'', name:editData.name||'', surname:editData.surname||'', gender:editData.gender||'Мужской', role:editData.role||'Бегун', country:editData.country||'Казахстан', dob:editData.dob||'1990-01-01', photo:editData.photo||'', photoName:editData.photo?'фото загружено':'' })
    } else {
      setForm({ email:'', password:'', password2:'', name:'', surname:'', gender:'Мужской', role:'Бегун', country:'Казахстан', dob:'1990-01-01', photo:'', photoName:'' })
    }
    setMsg({ text:'', ok:false })
  }, [editData, open])

  const set = (k,v) => setForm(f => ({ ...f, [k]:v }))
  const onPhoto = (e) => {
    const file = e.target.files[0]; if (!file) return
    const r = new FileReader(); r.onload = ev => set('photo', ev.target.result); r.readAsDataURL(file)
    set('photoName', file.name)
  }
  const submit = async () => {
    if (!form.email || !form.name || !form.surname) { setMsg({ text:'Заполните все обязательные поля.', ok:false }); return }
    if (!isEdit && form.password.length < 6) { setMsg({ text:'Пароль минимум 6 символов.', ok:false }); return }
    if (!isEdit && form.password !== form.password2) { setMsg({ text:'Пароли не совпадают.', ok:false }); return }
    await onSave({ email:form.email, name:form.name, surname:form.surname, gender:form.gender, role:form.role, country:form.country, dob:form.dob, photo:form.photo }, editData?.id)
    setMsg({ text: isEdit ? 'Данные обновлены!' : 'Участник зарегистрирован!', ok:true })
    setTimeout(() => { onClose(); setMsg({ text:'', ok:false }) }, 900)
  }

  return (
    <ModalShell open={open} onClose={onClose} title={isEdit ? 'Редактирование участника' : 'Регистрация участника'} subtitle="Заполните все поля формы">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 200px', gap:20 }}>
        {/* Left */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Email *" span={2}>
            <input style={inp} value={form.email} onChange={e=>set('email',e.target.value)} placeholder="user@example.com"/>
          </Field>
          {!isEdit && <>
            <Field label="Пароль *">
              <input style={inp} type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Минимум 6 символов"/>
            </Field>
            <Field label="Повтор пароля *">
              <input style={inp} type="password" value={form.password2} onChange={e=>set('password2',e.target.value)}/>
            </Field>
          </>}
          <Field label="Имя *">
            <input style={inp} value={form.name} onChange={e=>set('name',e.target.value)}/>
          </Field>
          <Field label="Фамилия *">
            <input style={inp} value={form.surname} onChange={e=>set('surname',e.target.value)}/>
          </Field>
          <Field label="Пол">
            <select style={sel} value={form.gender} onChange={e=>set('gender',e.target.value)}>
              <option>Мужской</option><option>Женский</option>
            </select>
          </Field>
          <Field label="Роль">
            <select style={sel} value={form.role} onChange={e=>set('role',e.target.value)}>
              <option>Бегун</option><option>Координатор</option>
            </select>
          </Field>
          <Field label="Дата рождения">
            <input style={inp} type="date" value={form.dob} onChange={e=>set('dob',e.target.value)}/>
          </Field>
          <Field label="Страна">
            <select style={sel} value={form.country} onChange={e=>set('country',e.target.value)}>
              {COUNTRIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        {/* Right — photo */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:11, color:'var(--text-3)', fontWeight:600, letterSpacing:'.04em', marginBottom:2 }}>ФОТО</div>
          <div style={{
            height:160, borderRadius:'var(--radius)', border:'1px dashed var(--border)',
            display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden',
            background:'rgba(255,255,255,0.03)', transition:'border .2s',
          }} onClick={() => document.getElementById('_photoInput').click()}>
            {form.photo
              ? <img src={form.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <div style={{ textAlign:'center' }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>📷</div>
                  <div style={{ fontSize:10, color:'var(--text-3)' }}>Нажмите для выбора</div>
                </div>
            }
          </div>
          <input type="file" id="_photoInput" accept="image/*" style={{ display:'none' }} onChange={onPhoto}/>
          <div style={{ fontSize:10, color:'var(--text-3)', background:'rgba(255,255,255,0.03)', borderRadius:6, padding:'6px 10px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {form.photoName || 'Файл не выбран'}
          </div>
        </div>
      </div>

      {msg.text && (
        <div style={{ marginTop:14, padding:'10px 14px', borderRadius:8, background:msg.ok?'rgba(61,220,132,0.1)':'rgba(255,75,110,0.1)', border:`1px solid ${msg.ok?'rgba(61,220,132,0.3)':'rgba(255,75,110,0.3)'}`, color:msg.ok?'var(--green)':'var(--red)', fontSize:12, textAlign:'center' }}>
          {msg.text}
        </div>
      )}

      <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:18 }}>
        <button style={btnGhost} onClick={onClose}>Отмена</button>
        <button style={btnPrimary} onClick={submit}>
          {isEdit ? '✓ Сохранить' : '✓ Зарегистрировать'}
        </button>
      </div>
    </ModalShell>
  )
}

/* ─── PROFILE MODAL ──────────────────────────────────────────── */
function ProfileModal({ open, onClose, participant, isAdmin, onEdit, onBMI }) {
  if (!open || !participant) return null
  const p = participant
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
  const formatDate = dob => { if (!dob) return '—'; const [y,m,d]=dob.split('-'); return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}` }

  const fields = [
    ['📧 Email', p.email, 'var(--blue)'],
    ['⚧ Пол', p.gender, 'var(--text)'],
    ['🎂 Дата рождения', formatDate(p.dob), 'var(--text)'],
    ['🌍 Страна', p.country||'—', 'var(--text)'],
    ['📊 ИМТ', p.bmi ? p.bmi.toFixed(1) : '—', bmiColor(p.bmi)],
    ['🏷 Роль', p.role, p.role==='Бегун'?'var(--blue)':'var(--purple)'],
    ['🔢 ID', p.id, 'var(--text-3)'],
    ['📅 Зарег.', p.created_at ? new Date(p.created_at).toLocaleDateString('ru') : '—', 'var(--text)'],
  ]

  return (
    <ModalShell open={open} onClose={onClose} title="Профиль участника" width="min(560px,96vw)">
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
        <div style={{
          width:72, height:72, borderRadius:'50%', border:'2px solid var(--border-hi)',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:36, overflow:'hidden', flexShrink:0,
          background:'var(--bg-3)',
        }}>
          {p.photo ? <img src={p.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : (p.gender==='Женский'?'👩':'👨')}
        </div>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:16, fontWeight:700, letterSpacing:'.02em' }}>{p.name} {p.surname}</div>
          <div style={{ fontSize:12, color: p.role==='Бегун'?'var(--blue)':'var(--purple)', fontWeight:600, marginTop:2 }}>{p.role}</div>
          <div style={{ fontSize:11, color:'var(--text-3)', marginTop:1 }}>{p.email}</div>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
        {fields.map(([lbl,val,clr]) => (
          <div key={lbl} style={{ background:'rgba(255,255,255,0.04)', borderRadius:'var(--radius-xs)', padding:'10px 12px', border:'1px solid var(--border)' }}>
            <div style={{ fontSize:9, color:'var(--text-3)', marginBottom:3, letterSpacing:'.04em' }}>{lbl}</div>
            <div style={{ fontSize:13, fontWeight:600, color:clr }}>{val}</div>
          </div>
        ))}
      </div>

      {isAdmin && (
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button style={btnGhost} onClick={onClose}>Закрыть</button>
          <button style={{ ...btnGhost, color:'var(--green)' }} onClick={()=>onBMI(p)}>📊 Рассчитать ИМТ</button>
          <button style={btnPrimary} onClick={()=>onEdit(p)}>✏️ Редактировать</button>
        </div>
      )}
    </ModalShell>
  )
}

/* ─── CONFIRM MODAL ─────────────────────────────────────────── */
function ConfirmModal({ open, name, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.8)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:300, backdropFilter:'blur(4px)' }}>
      <div style={{ background:'var(--bg-2)', border:'1px solid rgba(255,75,110,0.3)', borderRadius:16, padding:'32px 36px', textAlign:'center', width:'min(380px,90vw)', boxShadow:'0 24px 60px rgba(0,0,0,.5)' }}>
        <div style={{ fontSize:36, marginBottom:12 }}>🗑️</div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, marginBottom:6 }}>Удалить участника?</div>
        <div style={{ fontSize:12, color:'var(--text-2)', marginBottom:24 }}>{name}</div>
        <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
          <button style={btnGhost} onClick={onCancel}>Отмена</button>
          <button style={btnDanger} onClick={onConfirm}>Удалить</button>
        </div>
      </div>
    </div>
  )
}

/* ─── BMI PAGE ───────────────────────────────────────────────── */
function BMIPage({ runner, onBack, onSave }) {
  const [height, setHeight] = useState('170')
  const [weight, setWeight] = useState('70')
  const [gender, setGender] = useState('Мужской')
  const [bmiVal, setBmiVal] = useState(0)
  const figRef = useRef(null)
  const gaugeRef = useRef(null)

  useEffect(() => { if (runner) setGender(runner.gender||'Мужской'); setBmiVal(0) }, [runner])
  useEffect(() => { drawFigureOnCanvas(figRef.current, bmiVal, gender); drawGaugeOnCanvas(gaugeRef.current, bmiVal) }, [bmiVal, gender])

  const calc = () => {
    const h=parseFloat(height), w=parseFloat(weight)
    if (!h||!w) return
    const hm=h/100; setBmiVal(Math.round(w/(hm*hm)*10)/10)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'var(--bg)' }}>
      <nav style={{ ...glassNav, height:60, display:'flex', alignItems:'center', padding:'0 20px', gap:12, flexShrink:0 }}>
        <button style={btnGhost} onClick={onBack}>← Назад</button>
        <div style={{ flex:1, textAlign:'center', fontFamily:'var(--font-display)', fontSize:12, fontWeight:700, letterSpacing:'.08em' }}>ИМТ КАЛЬКУЛЯТОР</div>
        <button style={btnPrimary} onClick={() => { if (!bmiVal){alert('Сначала рассчитайте ИМТ.'); return} onSave(bmiVal) }}>💾 Сохранить</button>
      </nav>
      <div style={{ flex:1, overflowY:'auto', padding:24 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, maxWidth:700, margin:'0 auto' }}>
          {/* Left */}
          <div style={{ ...card, padding:24 }}>
            <p style={{ fontSize:11, color:'var(--text-3)', marginBottom:20, lineHeight:1.7 }}>
              ИМТ = вес (кг) / рост² (м)<br/>Индекс массы тела помогает оценить соответствие веса и роста.
            </p>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:11, color:'var(--text-3)', marginBottom:8, fontWeight:600 }}>ПОЛ</div>
              <div style={{ display:'flex', gap:12 }}>
                {['Мужской','Женский'].map(g => (
                  <label key={g} style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', fontSize:13, color: gender===g?'var(--text)':'var(--text-2)' }}>
                    <input type="radio" name="bmiGender" checked={gender===g} onChange={()=>setGender(g)} style={{ accentColor:'var(--orange)' }}/> {g==='Мужской'?'♂':'♀'} {g}
                  </label>
                ))}
              </div>
            </div>
            {[['Рост', height, setHeight, 'см'], ['Вес', weight, setWeight, 'кг']].map(([lbl,val,setter,unit]) => (
              <div key={lbl} style={{ marginBottom:14 }}>
                <Field label={lbl}>
                  <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                    <input style={{ ...inp, flex:1 }} value={val} onChange={e=>setter(e.target.value.replace(/\D/g,''))}/>
                    <span style={{ color:'var(--text-3)', fontSize:12, minWidth:24 }}>{unit}</span>
                  </div>
                </Field>
              </div>
            ))}
            <div style={{ display:'flex', gap:8 }}>
              <button style={btnPrimary} onClick={calc}>▶ Рассчитать</button>
              <button style={btnGhost} onClick={()=>setBmiVal(0)}>Сброс</button>
            </div>
          </div>
          {/* Right */}
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ ...card, height:160, overflow:'hidden' }}>
              <canvas ref={figRef} style={{ width:'100%', height:'100%' }}/>
            </div>
            <div style={{ ...card, padding:'16px 20px', textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-display)', fontSize:32, fontWeight:700, color: bmiVal?bmiColor(bmiVal):'var(--text-3)', lineHeight:1 }}>{bmiVal?bmiVal.toFixed(1):'—'}</div>
              <div style={{ fontSize:13, fontWeight:600, color:bmiColor(bmiVal), marginTop:4 }}>{bmiCategory(bmiVal)}</div>
            </div>
            <div style={{ ...card, height:60, overflow:'hidden', padding:'4px 10px' }}>
              <canvas ref={gaugeRef} style={{ width:'100%', height:'100%' }}/>
            </div>
          </div>
        </div>
      </div>
      <div style={{ ...glassNav, height:44, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, borderTop:'1px solid var(--border)', borderBottom:'none' }}>
        <span style={{ fontSize:12, fontWeight:600 }}>👤 {runner ? `${runner.name} ${runner.surname}` : '...'}</span>
      </div>
    </div>
  )
}

/* ─── ADMIN LOGIN ────────────────────────────────────────────── */
function AdminLoginPage({ onBack, onLogin }) {
  const [login, setLogin] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const doLogin = () => {
    if (login==='admin' && pass==='admin123') { onLogin(); setErr('') }
    else setErr('Неверный логин или пароль')
  }
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'var(--bg)' }}>
      <nav style={{ ...glassNav, height:60, display:'flex', alignItems:'center', padding:'0 20px', gap:12, flexShrink:0 }}>
        <button style={btnGhost} onClick={onBack}>← Назад</button>
        <span style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, letterSpacing:'.08em' }}>MARATHON SKILLS 2026</span>
      </nav>
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ ...card, width:'min(400px,90vw)', padding:'36px 32px', border:'1px solid var(--border-hi)' }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:700, letterSpacing:'.06em', marginBottom:6 }}>АВТОРИЗАЦИЯ</div>
            <div style={{ fontSize:11, color:'var(--text-3)' }}>Введите логин и пароль администратора</div>
          </div>
          <Field label="Логин"><input style={{ ...inp, marginBottom:12 }} value={login} onChange={e=>setLogin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()}/></Field>
          <div style={{ height:12 }}/>
          <Field label="Пароль"><input style={inp} type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()}/></Field>
          {err && <div style={{ color:'var(--red)', fontSize:11, textAlign:'center', marginTop:12 }}>{err}</div>}
          <div style={{ display:'flex', gap:10, marginTop:20 }}>
            <button style={{ ...btnGhost, flex:1 }} onClick={onBack}>Отмена</button>
            <button style={{ ...btnPrimary, flex:1 }} onClick={doLogin}>Войти</button>
          </div>
        </div>
      </div>
      <div style={{ borderTop:'1px solid var(--border)', padding:'10px 0', textAlign:'center' }}>
        <Countdown/>
      </div>
    </div>
  )
}

/* ─── USERS PAGE ─────────────────────────────────────────────── */
function UsersPage({ participants, isAdmin, onBack, onProfile, onEdit, onDelete, onBMI, loading }) {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('Все')
  const [sort, setSort] = useState('По имени')
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  let list = [...participants]
  if (roleFilter !== 'Все') list = list.filter(p => p.role === roleFilter)
  if (search) { const q = search.toLowerCase(); list = list.filter(p => `${p.name} ${p.surname} ${p.email}`.toLowerCase().includes(q)) }
  list.sort((a,b) => {
    if (sort==='По имени')   return (a.name||'').localeCompare(b.name||'')
    if (sort==='По фамилии') return (a.surname||'').localeCompare(b.surname||'')
    if (sort==='По Email')   return (a.email||'').localeCompare(b.email||'')
    if (sort==='По роли')    return (a.role||'').localeCompare(b.role||'')
    if (sort==='По стране')  return (a.country||'').localeCompare(b.country||'')
    return 0
  })
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE))
  const paged = list.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const thStyle = { padding:'10px 14px', textAlign:'left', fontSize:9, fontWeight:700, color:'var(--text-3)', letterSpacing:'.08em', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap', background:'var(--bg-1)', position:'sticky', top:0 }
  const tdStyle = { padding:'9px 14px', fontSize:12, borderBottom:'1px solid rgba(255,255,255,0.04)' }

  const roleColors = { 'Бегун':'var(--blue)', 'Координатор':'var(--purple)' }

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', background:'var(--bg)' }}>
      {/* NAV */}
      <nav style={{ ...glassNav, height:60, display:'flex', alignItems:'center', padding:'0 20px', gap:12, flexShrink:0 }}>
        <button style={btnGhost} onClick={onBack}>← Назад</button>
        <span style={{ fontFamily:'var(--font-display)', fontSize:11, fontWeight:700, letterSpacing:'.08em', flex:1 }}>УЧАСТНИКИ</span>
        {isAdmin && <button style={btnPrimary} onClick={()=>onEdit(null)}>+ Добавить</button>}
      </nav>

      {/* FILTERS */}
      <div style={{ background:'var(--bg-1)', borderBottom:'1px solid var(--border)', padding:'12px 20px' }}>
        <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center' }}>
          <div style={{ display:'flex', gap:6 }}>
            {['Все','Бегун','Координатор'].map(r => (
              <button key={r} style={{
                ...btnGhost, height:30, fontSize:11,
                background: roleFilter===r ? 'var(--orange)' : 'rgba(255,255,255,0.05)',
                color: roleFilter===r ? '#fff' : 'var(--text-2)',
                border: roleFilter===r ? 'none' : '1px solid var(--border)',
              }} onClick={()=>{setRoleFilter(r);setPage(1)}}>{r}</button>
            ))}
          </div>
          <select style={{ ...sel, width:'auto', height:30, padding:'0 10px' }} value={sort} onChange={e=>setSort(e.target.value)}>
            {['По имени','По фамилии','По Email','По роли','По стране'].map(o=><option key={o}>{o}</option>)}
          </select>
          <input style={{ ...inp, width:200, height:30 }} placeholder="🔍 Поиск..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
          <span style={{ fontSize:11, color:'var(--text-3)', marginLeft:'auto' }}>{list.length} участников</span>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ flex:1, overflowY:'auto' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:60, color:'var(--text-3)' }}>
            <div style={{ fontSize:32, marginBottom:12, animation:'spin 1s linear infinite', display:'inline-block' }}>⏳</div>
            <div style={{ fontSize:13 }}>Загрузка...</div>
          </div>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['#','Участник','Email','Страна','ИМТ','Роль'].map(h=><th key={h} style={thStyle}>{h}</th>)}
                {isAdmin && <><th style={{ ...thStyle, width:40 }}/><th style={{ ...thStyle, width:40 }}/></>}
              </tr>
            </thead>
            <tbody>
              {paged.map((p,i) => (
                <tr key={p.id} style={{ cursor:'pointer', transition:'background .15s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                  onClick={()=>onProfile(p)}>
                  <td style={{ ...tdStyle, color:'var(--text-3)', width:40 }}>{(page-1)*PER_PAGE+i+1}</td>
                  <td style={tdStyle}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{
                        width:28, height:28, borderRadius:'50%', overflow:'hidden', flexShrink:0,
                        background:'var(--bg-3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14,
                      }}>
                        {p.photo ? <img src={p.photo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/> : (p.gender==='Женский'?'👩':'👨')}
                      </div>
                      <span style={{ fontWeight:500 }}>{p.name} {p.surname}</span>
                    </div>
                  </td>
                  <td style={{ ...tdStyle, color:'var(--blue)', fontSize:11 }}>{p.email}</td>
                  <td style={tdStyle}>{p.country||'—'}</td>
                  <td style={{ ...tdStyle, color:bmiColor(p.bmi), fontWeight:600 }}>{p.bmi?p.bmi.toFixed(1):'—'}</td>
                  <td style={tdStyle}>
                    <span style={{
                      background: p.role==='Бегун'?'rgba(78,159,255,0.12)':'rgba(155,109,255,0.12)',
                      color: roleColors[p.role]||'var(--text)',
                      borderRadius:4, padding:'2px 8px', fontSize:10, fontWeight:700,
                    }}>{p.role}</span>
                  </td>
                  {isAdmin && <>
                    <td style={{ ...tdStyle, width:40 }} onClick={e=>{e.stopPropagation();onEdit(p)}}>
                      <button style={{ ...btnGhost, height:26, padding:'0 8px', fontSize:12 }}>✏</button>
                    </td>
                    <td style={{ ...tdStyle, width:40 }} onClick={e=>{e.stopPropagation();onDelete(p)}}>
                      <button style={{ ...btnGhost, height:26, padding:'0 8px', fontSize:12, color:'var(--red)' }}>🗑</button>
                    </td>
                  </>}
                </tr>
              ))}
              {paged.length === 0 && (
                <tr><td colSpan={isAdmin?8:6} style={{ textAlign:'center', padding:'40px 0', color:'var(--text-3)', fontSize:13 }}>Участники не найдены</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      <div style={{ background:'var(--bg-1)', borderTop:'1px solid var(--border)', height:46, display:'flex', alignItems:'center', padding:'0 20px', gap:8, flexShrink:0 }}>
        <button style={{ ...btnGhost, height:28, width:28, padding:0, justifyContent:'center' }} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>‹</button>
        <span style={{ fontSize:11, color:'var(--text-3)', minWidth:80, textAlign:'center' }}>Стр. {page} / {pages}</span>
        <button style={{ ...btnGhost, height:28, width:28, padding:0, justifyContent:'center' }} disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>›</button>
        <div style={{ marginLeft:'auto' }}>
          <Countdown/>
        </div>
      </div>
    </div>
  )
}

/* ─── MAIN PAGE ──────────────────────────────────────────────── */
export default function Home() {
  const { data: session, status } = useSession()
  const [participants, setParticipants] = useState([])
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState('main')
  const [isAdmin, setIsAdmin] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [profileTarget, setProfileTarget] = useState(null)
  const [bmiTarget, setBmiTarget] = useState(null)
  const [confirmTarget, setConfirmTarget] = useState(null)

  useEffect(() => { if (status==='authenticated') fetchParticipants() }, [status])

  const fetchParticipants = async () => {
    setLoading(true)
    try { const res=await fetch('/api/participants'); if (res.ok) setParticipants(await res.json()) }
    finally { setLoading(false) }
  }
  const saveParticipant = async (data, id) => {
    if (id) {
      const res=await fetch(`/api/participants/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
      if (res.ok) { const u=await res.json(); setParticipants(ps=>ps.map(p=>p.id===id?u:p)) }
    } else {
      const res=await fetch('/api/participants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)})
      if (res.ok) { const c=await res.json(); setParticipants(ps=>[c,...ps]) }
    }
  }
  const deleteParticipant = async (id) => {
    await fetch(`/api/participants/${id}`,{method:'DELETE'})
    setParticipants(ps=>ps.filter(p=>p.id!==id)); setConfirmTarget(null)
  }
  const saveBMI = async (bmiVal) => {
    if (!bmiTarget) return
    const res=await fetch(`/api/participants/${bmiTarget.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...bmiTarget,bmi:bmiVal})})
    if (res.ok) { const u=await res.json(); setParticipants(ps=>ps.map(p=>p.id===bmiTarget.id?u:p)) }
    setBmiTarget(null); setView('users')
  }

  const runners = participants.filter(p=>p.role==='Бегун').length
  const coords = participants.filter(p=>p.role==='Координатор').length
  const bmis = participants.filter(p=>p.bmi).map(p=>p.bmi)
  const avgBMI = bmis.length ? (bmis.reduce((a,b)=>a+b,0)/bmis.length).toFixed(1) : '—'
  const topCountry = (() => { const c={}; participants.forEach(p=>{ if(p.country) c[p.country]=(c[p.country]||0)+1 }); return Object.entries(c).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—' })()

  if (status==='loading') return (
    <div style={{ background:'var(--bg)', color:'var(--text)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-body)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:12, animation:'spin 1s linear infinite', display:'inline-block' }}>🏃</div>
        <div style={{ color:'var(--text-3)', fontSize:13 }}>Загрузка...</div>
      </div>
    </div>
  )

  /* PUBLIC LANDING */
  if (!session) return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font-body)', color:'var(--text)' }}>
      <Navbar session={null} isAdmin={false} onUsers={()=>{}} onRegister={()=>{}} onAdminLogin={()=>{}} onAdminLogout={()=>{}}/>

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'60px 24px', textAlign:'center', position:'relative' }}>
        {/* Background glow */}
        <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:400, background:'radial-gradient(ellipse, rgba(255,95,31,0.12) 0%, transparent 70%)', pointerEvents:'none' }}/>

        {/* Logo */}
        <div style={{ position:'relative', marginBottom:24 }}>
          <div style={{ fontSize:72, animation:'float 4s ease-in-out infinite' }}>🏃</div>
          <div style={{ position:'absolute', inset:0, borderRadius:'50%', border:'2px solid rgba(255,95,31,0.2)', animation:'pulse-ring 2s ease-out infinite' }}/>
        </div>

        <div style={{ fontFamily:'var(--font-display)', fontSize:36, fontWeight:900, letterSpacing:'.05em', marginBottom:8, background:'linear-gradient(135deg, #fff 40%, var(--orange-2))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          MARATHON SKILLS
        </div>
        <div style={{ fontFamily:'var(--font-display)', fontSize:13, color:'var(--orange)', fontWeight:700, letterSpacing:'.2em', marginBottom:8 }}>2026</div>
        <div style={{ fontSize:13, color:'var(--text-3)', marginBottom:6 }}>42.195 КМ · 15 ИЮНЯ 2026 · АЛМАТЫ</div>
        <div style={{ fontSize:12, color:'var(--text-3)', marginBottom:16, maxWidth:420 }}>
          Войдите через Google, чтобы зарегистрироваться на марафон или управлять участниками
        </div>

        <div style={{ marginBottom:32 }}>
          <Countdown/>
        </div>

        <button onClick={() => signIn('google',{callbackUrl:'/'})} style={{
          display:'inline-flex', alignItems:'center', gap:10,
          background:'#fff', color:'#111', border:'none', borderRadius:10,
          padding:'14px 28px', fontSize:14, fontWeight:700, cursor:'pointer',
          boxShadow:'0 4px 24px rgba(0,0,0,0.4)', marginBottom:40, transition:'.2s',
        }}
          onMouseOver={e=>e.currentTarget.style.transform='translateY(-2px)'}
          onMouseOut={e=>e.currentTarget.style.transform=''}
        >
          <GoogleIcon/> Войти через Google
        </button>

        {/* Telegram */}
        <a href="https://t.me/martthon_bot" target="_blank" rel="noopener noreferrer"
          style={{
            display:'flex', alignItems:'center', gap:14,
            background:'rgba(33,150,243,0.08)', border:'1px solid rgba(33,150,243,0.2)',
            borderRadius:'var(--radius)', padding:'14px 20px', marginBottom:24,
            textDecoration:'none', maxWidth:580, width:'100%',
          }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#2196F3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>✈️</div>
          <div style={{ flex:1, textAlign:'left' }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:2 }}>Есть вопросы? Спроси бота в Telegram</div>
            <div style={{ fontSize:11, color:'var(--text-3)' }}>Найди участника · Узнай как зарегистрироваться</div>
          </div>
          <div style={{ background:'#2196F3', color:'#fff', borderRadius:'var(--radius-xs)', padding:'6px 14px', fontSize:11, fontWeight:700 }}>Открыть →</div>
        </a>

        {/* Info cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:12, maxWidth:640, width:'100%' }}>
          {[
            ['var(--orange)','🏃','Испытание воли','Дистанция 42,195 км объединяет профессионалов и любителей в едином порыве выносливости.'],
            ['var(--blue)','💪','Стена на 30–35 км','В этот момент запасы гликогена истощаются. Преодоление — вопрос чистого упрямства.'],
            ['var(--green)','🌆','Города без машин','Уникальный шанс увидеть город иначе: пробежать по мостам под крики болельщиков.'],
          ].map(([clr,icon,title,desc]) => (
            <div key={title} style={{ ...card, padding:'16px', textAlign:'left', overflow:'hidden', position:'relative' }}>
              <div style={{ position:'absolute', top:0, left:0, width:3, height:'100%', background:clr }}/>
              <div style={{ fontSize:20, marginBottom:8, paddingLeft:8 }}>{icon}</div>
              <div style={{ fontSize:12, fontWeight:700, marginBottom:4, paddingLeft:8 }}>{title}</div>
              <div style={{ fontSize:10, color:'var(--text-3)', lineHeight:1.6, paddingLeft:8 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (view==='bmi') return <BMIPage runner={bmiTarget} onBack={()=>{setBmiTarget(null);setView('users')}} onSave={saveBMI}/>
  if (view==='adminLogin') return <AdminLoginPage onBack={()=>setView('main')} onLogin={()=>{setIsAdmin(true);setView('users')}}/>
  if (view==='users') return (
    <>
      <UsersPage participants={participants} isAdmin={isAdmin} loading={loading}
        onBack={()=>setView('main')}
        onProfile={p=>{setProfileTarget(p);setProfileOpen(true)}}
        onEdit={p=>{setEditTarget(p);setRegisterOpen(true)}}
        onDelete={p=>setConfirmTarget(p)}
        onBMI={p=>{setBmiTarget(p);setView('bmi')}}/>
      <RegisterModal open={registerOpen} onClose={()=>{setRegisterOpen(false);setEditTarget(null)}} onSave={saveParticipant} editData={editTarget}/>
      <ProfileModal open={profileOpen} participant={profileTarget} isAdmin={isAdmin}
        onClose={()=>{setProfileOpen(false);setProfileTarget(null)}}
        onEdit={p=>{setProfileOpen(false);setEditTarget(p);setRegisterOpen(true)}}
        onBMI={p=>{setProfileOpen(false);setBmiTarget(p);setView('bmi')}}/>
      <ConfirmModal open={!!confirmTarget} name={confirmTarget?`${confirmTarget.name} ${confirmTarget.surname}`:''}
        onConfirm={()=>deleteParticipant(confirmTarget.id)} onCancel={()=>setConfirmTarget(null)}/>
    </>
  )

  /* MAIN DASHBOARD */
  const stats = [
    { icon:'🏃', val:runners, label:'Бегунов', color:'var(--orange)' },
    { icon:'📋', val:coords, label:'Координаторов', color:'var(--purple)' },
    { icon:'📊', val:avgBMI, label:'Средний ИМТ', color:'var(--green)' },
    { icon:'🌍', val:topCountry, label:'Топ страна', color:'var(--blue)' },
    { icon:'👥', val:participants.length, label:'Всего', color:'var(--gold)' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh', background:'var(--bg)', fontFamily:'var(--font-body)', color:'var(--text)' }}>
      <Navbar onUsers={()=>setView('users')} onRegister={()=>{setEditTarget(null);setRegisterOpen(true)}} onAdminLogin={()=>setView('adminLogin')} session={session} isAdmin={isAdmin} onAdminLogout={()=>setIsAdmin(false)}/>

      <div style={{ flex:1, overflowY:'auto', padding:'24px' }}>
        {/* Hero */}
        <div style={{
          borderRadius:16, overflow:'hidden', position:'relative', marginBottom:20,
          background:'linear-gradient(135deg, rgba(255,95,31,0.15) 0%, rgba(78,159,255,0.05) 60%, transparent 100%)',
          border:'1px solid var(--border)', padding:'28px 32px',
        }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 80% 50%, rgba(255,95,31,0.08) 0%, transparent 60%)', pointerEvents:'none' }}/>
          <div style={{ fontFamily:'var(--font-display)', fontSize:22, fontWeight:900, letterSpacing:'.04em', marginBottom:4, background:'linear-gradient(90deg,#fff,var(--orange-2))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
            MARATHON SKILLS 2026
          </div>
          <div style={{ fontSize:13, color:'var(--text-2)', marginBottom:16 }}>42.195 КМ · 15 ИЮНЯ 2026 · АЛМАТЫ</div>
          <div style={{ display:'flex', gap:10 }}>
            <button style={{ ...btnPrimary, height:38 }} onClick={()=>{setEditTarget(null);setRegisterOpen(true)}}>+ Зарегистрировать</button>
            <button style={{ ...btnGhost, height:38 }} onClick={()=>setView('users')}>👥 Все участники</button>
          </div>
          <div style={{ position:'absolute', right:28, top:'50%', transform:'translateY(-50%)', fontSize:60, opacity:.12 }}>🏃</div>
        </div>

        {/* Countdown */}
        <div style={{ ...card, padding:'12px 20px', marginBottom:20, textAlign:'center' }}>
          <Countdown/>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10, marginBottom:20 }}>
          {stats.map(s => (
            <div key={s.label} style={{ ...card, padding:'16px 14px', position:'relative', overflow:'hidden', transition:'transform .2s', cursor:'default' }}>
              <div style={{ fontSize:22, marginBottom:6 }}>{s.icon}</div>
              <div style={{ fontFamily:'var(--font-display)', fontSize:20, fontWeight:700, color:s.color, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:9, color:'var(--text-3)', marginTop:4, fontWeight:600, letterSpacing:'.06em' }}>{s.label.toUpperCase()}</div>
              <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:s.color, opacity:.6 }}/>
            </div>
          ))}
        </div>

        {/* Telegram banner */}
        <a href="https://t.me/martthon_bot" target="_blank" rel="noopener noreferrer" style={{
          display:'flex', alignItems:'center', gap:14,
          background:'rgba(33,150,243,0.07)', border:'1px solid rgba(33,150,243,0.18)',
          borderRadius:'var(--radius)', padding:'14px 20px', marginBottom:16,
          textDecoration:'none',
        }}>
          <div style={{ width:44, height:44, borderRadius:'50%', background:'#2196F3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>✈️</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:2 }}>Есть вопросы? Спроси бота в Telegram</div>
            <div style={{ fontSize:11, color:'var(--text-3)' }}>Найди участника по имени или фамилии · Узнай как зарегистрироваться</div>
          </div>
          <div style={{ background:'#2196F3', color:'#fff', borderRadius:'var(--radius-xs)', padding:'6px 14px', fontSize:11, fontWeight:700 }}>Открыть →</div>
        </a>

        {/* Info cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[
            ['var(--orange)','🏃','Марафон — испытание воли','Дистанция 42,195 км объединяет профессионалов и любителей в едином порыве выносливости.'],
            ['var(--blue)','💪','«Стена» на 30–35 км','В этот момент запасы гликогена истощаются. Преодоление — вопрос чистого упрямства.'],
            ['var(--green)','🌆','Города без машин','Уникальный шанс увидеть город иначе: пробежать по мостам под крики болельщиков.'],
          ].map(([clr,icon,title,desc]) => (
            <div key={title} style={{ ...card, padding:'16px', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, width:3, height:'100%', background:clr }}/>
              <div style={{ paddingLeft:12 }}>
                <div style={{ fontSize:18, marginBottom:6 }}>{icon}</div>
                <div style={{ fontSize:12, fontWeight:700, marginBottom:4 }}>{title}</div>
                <div style={{ fontSize:11, color:'var(--text-3)', lineHeight:1.6 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <RegisterModal open={registerOpen} onClose={()=>{setRegisterOpen(false);setEditTarget(null)}} onSave={saveParticipant} editData={editTarget}/>
    </div>
  )
}
