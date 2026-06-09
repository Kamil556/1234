import { useSession, signOut, signIn } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'

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
      if (diff <= 0) { setParts({ started:true }); return }
      setParts({ d:Math.floor(diff/86400000), h:Math.floor((diff%86400000)/3600000), m:Math.floor((diff%3600000)/60000), s:Math.floor((diff%60000)/1000), started:false })
    }
    tick(); const id=setInterval(tick,1000); return ()=>clearInterval(id)
  },[])
  return parts
}

/* ─── BMI ───────────────────────────────────────────────────── */
function bmiCategory(v) {
  if (!v) return ''
  if (v < 18.5) return 'Недостаточный вес'
  if (v < 25)   return 'Здоровый вес ✓'
  if (v < 30)   return 'Избыточный вес'
  return 'Ожирение'
}
function bmiColor(v) {
  if (!v) return 'var(--text-3)'
  if (v < 18.5) return '#4E9FFF'
  if (v < 25)   return 'var(--green)'
  if (v < 30)   return 'var(--yellow)'
  return 'var(--red)'
}
function drawFigureOnCanvas(canvas, bmiVal, gender) {
  if (!canvas) return
  const w=canvas.offsetWidth||300, h=canvas.offsetHeight||160
  canvas.width=w; canvas.height=h
  const ctx=canvas.getContext('2d')
  ctx.clearRect(0,0,w,h)
  const col = bmiVal ? (bmiVal<18.5?'#4E9FFF':bmiVal<25?'#2ECC8A':bmiVal<30?'#FFB830':'#FF5C6A') : '#C5D8E8'
  const bw = bmiVal===0?20:bmiVal<18.5?13:bmiVal<25?20:bmiVal<30?28:38
  const cx=w/2, cy=h/2-8
  ctx.fillStyle=col
  ctx.beginPath(); ctx.arc(cx,cy-46,16,0,Math.PI*2); ctx.fill()
  ctx.fillRect(cx-bw,cy-29,bw*2,50)
  ctx.fillRect(cx-bw-12,cy-27,11,38)
  ctx.fillRect(cx+bw+1,cy-27,11,38)
  ctx.fillRect(cx-bw+4,cy+21,bw-8,42)
  ctx.fillRect(cx+4,cy+21,bw-8,42)
  ctx.font='bold 12px Nunito'; ctx.fillStyle=col; ctx.textAlign='center'
  ctx.fillText(gender==='Женский'?'♀':'♂',cx,h-6)
}
function drawGaugeOnCanvas(canvas, bmiVal) {
  if (!canvas) return
  const pw=(canvas.offsetWidth||300)-20
  canvas.width=canvas.offsetWidth||300; canvas.height=canvas.offsetHeight||56
  const ctx=canvas.getContext('2d')
  ctx.clearRect(0,0,canvas.width,canvas.height)
  const gx=10,gy=18,gh=10
  const segs=[{c:'#4E9FFF',l:'Недостат.',w:.22},{c:'#2ECC8A',l:'Норма',w:.30},{c:'#FFB830',l:'Избыточ.',w:.24},{c:'#FF5C6A',l:'Ожирение',w:.24}]
  let x=gx
  ctx.save(); ctx.beginPath()
  if(ctx.roundRect) ctx.roundRect(gx,gy,pw,gh,4); else ctx.rect(gx,gy,pw,gh)
  ctx.clip()
  segs.forEach(s=>{ const sw=pw*s.w; ctx.fillStyle=s.c; ctx.fillRect(x,gy,sw,gh); x+=sw })
  ctx.restore()
  x=gx
  segs.forEach(s=>{ const sw=pw*s.w; ctx.fillStyle='rgba(26,43,60,0.55)'; ctx.font='7px Nunito'; ctx.textAlign='center'; ctx.fillText(s.l,x+sw/2,gy+gh+9); x+=sw })
  if(bmiVal>0){ const norm=Math.min(Math.max((bmiVal-10)/30,0),1); const mx=gx+norm*pw; ctx.fillStyle='#1A2B3C'; ctx.beginPath(); ctx.moveTo(mx,gy-2); ctx.lineTo(mx-5,gy-10); ctx.lineTo(mx+5,gy-10); ctx.closePath(); ctx.fill() }
}

/* ─── DESIGN TOKENS ─────────────────────────────────────────── */
const card = {
  background: 'var(--cloud-white)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: 'var(--shadow)',
}
const cardSoft = {
  background: 'var(--cloud-soft)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  boxShadow: '0 1px 8px rgba(74,172,240,0.08)',
}
const navStyle = {
  background: 'rgba(255,255,255,0.88)',
  backdropFilter: 'blur(20px)',
  borderBottom: '1px solid var(--border)',
  boxShadow: '0 2px 20px rgba(74,172,240,0.1)',
}
const inp = {
  width:'100%', background:'var(--sky-light)', border:'1.5px solid var(--border)',
  borderRadius:'var(--radius-xs)', color:'var(--text)', padding:'0 12px', height:36,
  fontFamily:'var(--font-body)', fontSize:13, outline:'none', transition:'border .2s',
}
const sel = { ...inp }
const btnPrimary = {
  cursor:'pointer', border:'none', borderRadius:'var(--radius-xs)',
  fontFamily:'var(--font-body)', fontSize:12, fontWeight:700,
  display:'inline-flex', alignItems:'center', gap:6, whiteSpace:'nowrap',
  background:'linear-gradient(135deg, var(--sky-horizon), var(--sky-true))',
  color:'#fff', padding:'0 18px', height:36, transition:'all .2s',
  boxShadow:'0 2px 10px rgba(26,141,216,0.3)',
}
const btnSoft = {
  ...btnPrimary,
  background:'var(--sky-blue)', color:'var(--sky-dark)',
  boxShadow:'none', border:'1.5px solid var(--border)',
}
const btnGhost = {
  ...btnPrimary,
  background:'transparent', color:'var(--text-2)',
  boxShadow:'none', border:'1.5px solid var(--border)',
}
const btnDanger = { ...btnPrimary, background:'linear-gradient(135deg,#FF7B88,#FF5C6A)', boxShadow:'0 2px 10px rgba(255,92,106,0.3)' }

/* ─── CLOUDS DECORATION ─────────────────────────────────────── */
function CloudBg() {
  return (
    <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
      {/* Sky gradient */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, #C9E8FF 0%, #EBF6FF 40%, #F5FBFF 100%)' }}/>
      {/* Sun */}
      <div style={{ position:'absolute', top:40, right:80, width:80, height:80, borderRadius:'50%', background:'radial-gradient(circle, #FFE08A 30%, #FFB830 70%, transparent 100%)', opacity:.5, animation:'pulse-sun 4s ease-in-out infinite' }}/>
      {/* Clouds */}
      <svg style={{ position:'absolute', top:20, left:'5%', opacity:.7, animation:'cloud-drift 12s ease-in-out infinite' }} width="180" height="60" viewBox="0 0 180 60">
        <ellipse cx="90" cy="45" rx="80" ry="20" fill="white"/>
        <ellipse cx="60" cy="35" rx="40" ry="22" fill="white"/>
        <ellipse cx="110" cy="30" rx="45" ry="25" fill="white"/>
        <ellipse cx="80" cy="25" rx="35" ry="20" fill="white"/>
      </svg>
      <svg style={{ position:'absolute', top:60, right:'10%', opacity:.5, animation:'cloud-drift 18s ease-in-out infinite reverse' }} width="140" height="50" viewBox="0 0 140 50">
        <ellipse cx="70" cy="38" rx="60" ry="16" fill="white"/>
        <ellipse cx="45" cy="28" rx="30" ry="18" fill="white"/>
        <ellipse cx="90" cy="24" rx="36" ry="20" fill="white"/>
      </svg>
      <svg style={{ position:'absolute', top:10, left:'40%', opacity:.4, animation:'cloud-drift 22s ease-in-out infinite' }} width="120" height="44" viewBox="0 0 120 44">
        <ellipse cx="60" cy="34" rx="52" ry="14" fill="white"/>
        <ellipse cx="38" cy="24" rx="28" ry="16" fill="white"/>
        <ellipse cx="76" cy="20" rx="32" ry="18" fill="white"/>
      </svg>
      {/* Birds */}
      <svg style={{ position:'absolute', top:90, left:'20%', opacity:.25 }} width="60" height="20" viewBox="0 0 60 20">
        <path d="M0 10 Q8 2 15 10 Q22 2 30 10" stroke="#4AACF0" strokeWidth="1.5" fill="none"/>
        <path d="M32 8 Q40 0 47 8 Q54 0 60 8" stroke="#4AACF0" strokeWidth="1.5" fill="none"/>
      </svg>
    </div>
  )
}

/* ─── GOOGLE ICON ────────────────────────────────────────────── */
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

/* ─── NAVBAR ─────────────────────────────────────────────────── */
function Navbar({ onUsers, onRegister, onAdminLogin, session, isAdmin, onAdminLogout }) {
  return (
    <nav style={{ ...navStyle, height:62, display:'flex', alignItems:'center', padding:'0 22px', position:'sticky', top:0, zIndex:100, gap:12 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <div style={{
          width:38, height:38, borderRadius:12,
          background:'linear-gradient(135deg,var(--sky-horizon),var(--sky-deep))',
          display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0,
          boxShadow:'0 3px 12px rgba(74,172,240,0.35)',
        }}>🏃</div>
        <div>
          <div style={{ fontFamily:'var(--font-display)', fontSize:13, fontWeight:800, color:'var(--sky-true)', letterSpacing:'.06em' }}>MARATHON</div>
          <div style={{ fontSize:9, color:'var(--sky-deep)', fontWeight:700, letterSpacing:'.06em' }}>SKILLS 2026</div>
        </div>
      </div>
      <div style={{ marginLeft:'auto', display:'flex', gap:8, alignItems:'center' }}>
        {session?.user ? (
          <>
            {isAdmin && (
              <span style={{ background:'rgba(26,141,216,0.1)', border:'1px solid var(--accent-border)', borderRadius:20, padding:'3px 12px', fontSize:9, fontWeight:800, color:'var(--sky-true)' }}>
                🔑 ADMIN
              </span>
            )}
            {session.user.image && <img src={session.user.image} alt="" width={30} height={30} style={{ borderRadius:'50%', border:'2px solid var(--sky-deep)', flexShrink:0 }}/>}
            <span style={{ fontSize:12, color:'var(--text-2)', maxWidth:110, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600 }}>
              {session.user.name?.split(' ')[0]}
            </span>
            <button style={btnSoft} onClick={onUsers}>👥 Участники</button>
            <button style={btnPrimary} onClick={onRegister}>+ Регистрация</button>
            {isAdmin
              ? <button style={{ ...btnGhost, color:'var(--sky-true)' }} onClick={onAdminLogout}>↩ Выйти из адм.</button>
              : <button style={btnGhost} onClick={onAdminLogin}>🔒 Админ</button>
            }
            <button style={{ ...btnGhost, padding:'0 10px' }} onClick={() => signOut({ callbackUrl:'/' })}>⏻</button>
          </>
        ) : (
          <button onClick={() => signIn('google',{callbackUrl:'/'})} style={{ ...btnPrimary, gap:8 }}>
            <GoogleIcon/> Войти через Google
          </button>
        )}
      </div>
    </nav>
  )
}

/* ─── COUNTDOWN ──────────────────────────────────────────────── */
function Countdown({ dark }) {
  const t = useTimer()
  if (t.started) return (
    <div style={{ textAlign:'center', fontFamily:'var(--font-display)', color:'var(--sky-true)', fontSize:13, fontWeight:700 }}>
      🏃 МАРАФОН НАЧАЛСЯ!
    </div>
  )
  const units = [{ l:'ДН', v:t.d },{ l:'ЧС', v:t.h },{ l:'МН', v:t.m },{ l:'СК', v:t.s }]
  return (
    <div style={{ display:'flex', gap:8, alignItems:'center', justifyContent:'center' }}>
      <span style={{ fontFamily:'var(--font-display)', fontSize:9, color: dark?'rgba(255,255,255,0.6)':'var(--text-3)', letterSpacing:'.1em', marginRight:4 }}>ДО СТАРТА</span>
      {units.map((u,i) => (
        <div key={u.l} style={{ display:'flex', alignItems:'center', gap:8 }}>
          {i>0 && <span style={{ color:dark?'rgba(255,255,255,0.4)':'var(--sky-mid)', fontFamily:'var(--font-display)', fontSize:16 }}>:</span>}
          <div style={{ textAlign:'center' }}>
            <div style={{
              fontFamily:'var(--font-display)', fontSize:20, fontWeight:800, lineHeight:1, minWidth:30,
              color: dark?'#fff':'var(--sky-true)',
            }}>{String(u.v).padStart(2,'0')}</div>
            <div style={{ fontSize:8, color:dark?'rgba(255,255,255,0.5)':'var(--text-3)', letterSpacing:'.12em', marginTop:2 }}>{u.l}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── FIELD ──────────────────────────────────────────────────── */
function Field({ label, children }) {
  return (
    <div>
      <label style={{ display:'block', fontSize:11, color:'var(--text-2)', marginBottom:5, fontWeight:700, letterSpacing:'.03em' }}>{label}</label>
      {children}
    </div>
  )
}

/* ─── MODAL SHELL ────────────────────────────────────────────── */
function ModalShell({ open, onClose, title, subtitle, children, width='min(860px,96vw)' }) {
  if (!open) return null
  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(180,210,235,0.55)',
      display:'flex', alignItems:'center', justifyContent:'center', zIndex:200,
      backdropFilter:'blur(6px)', animation:'fadeIn .15s ease',
    }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{
        background:'var(--cloud-white)', border:'1.5px solid var(--border-hi)',
        borderRadius:20, width, maxHeight:'92vh', overflow:'hidden',
        display:'flex', flexDirection:'column', boxShadow:'0 20px 60px rgba(74,172,240,0.22)',
      }}>
        <div style={{
          background:'linear-gradient(135deg,var(--sky-light),var(--cloud-white))',
          padding:'16px 24px', borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', gap:12, flexShrink:0,
        }}>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-display)', fontSize:14, fontWeight:800, color:'var(--sky-true)' }}>{title}</div>
            {subtitle && <div style={{ fontSize:11, color:'var(--text-3)', marginTop:2 }}>{subtitle}</div>}
          </div>
          <button style={{ ...btnGhost, width:32, height:32, padding:0, justifyContent:'center', borderRadius:10, fontSize:18 }} onClick={onClose}>×</button>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px 24px', background:'var(--cloud-soft)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ─── REGISTER MODAL ─────────────────────────────────────────── */
function RegisterModal({ open, onClose, onSave, editData }) {
  const isEdit = !!editData
  const [form, setForm] = useState({ email:'', password:'', password2:'', name:'', surname:'', gender:'Мужской', role:'Бегун', country:'Казахстан', dob:'1990-01-01', photo:'', photoName:'' })
  const [msg, setMsg] = useState({ text:'', ok:false })

  useEffect(() => {
    if (editData) setForm({ email:editData.email||'', password:'', password2:'', name:editData.name||'', surname:editData.surname||'', gender:editData.gender||'Мужской', role:editData.role||'Бегун', country:editData.country||'Казахстан', dob:editData.dob||'1990-01-01', photo:editData.photo||'', photoName:editData.photo?'фото загружено':'' })
    else setForm({ email:'', password:'', password2:'', name:'', surname:'', gender:'Мужской', role:'Бегун', country:'Казахстан', dob:'1990-01-01', photo:'', photoName:'' })
    setMsg({ text:'', ok:false })
  }, [editData, open])

  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const onPhoto = e => {
    const file=e.target.files[0]; if(!file) return
    const r=new FileReader(); r.onload=ev=>set('photo',ev.target.result); r.readAsDataURL(file)
    set('photoName',file.name)
  }
  const submit = async () => {
    if(!form.email||!form.name||!form.surname){setMsg({text:'Заполните все обязательные поля.',ok:false});return}
    if(!isEdit&&form.password.length<6){setMsg({text:'Пароль минимум 6 символов.',ok:false});return}
    if(!isEdit&&form.password!==form.password2){setMsg({text:'Пароли не совпадают.',ok:false});return}
    await onSave({email:form.email,name:form.name,surname:form.surname,gender:form.gender,role:form.role,country:form.country,dob:form.dob,photo:form.photo},editData?.id)
    setMsg({text:isEdit?'Данные обновлены!':'Участник зарегистрирован!',ok:true})
    setTimeout(()=>{onClose();setMsg({text:'',ok:false})},900)
  }

  return (
    <ModalShell open={open} onClose={onClose} title={isEdit?'Редактирование участника':'Регистрация участника'} subtitle="Заполните все поля формы">
      <div style={{ display:'grid', gridTemplateColumns:'1fr 210px', gap:20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          <Field label="Email *" ><div style={{gridColumn:'span 2'}}><input style={inp} value={form.email} onChange={e=>set('email',e.target.value)} placeholder="user@example.com"/></div></Field>
          {!isEdit && <>
            <Field label="Пароль *"><input style={inp} type="password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Минимум 6 символов"/></Field>
            <Field label="Повтор пароля *"><input style={inp} type="password" value={form.password2} onChange={e=>set('password2',e.target.value)}/></Field>
          </>}
          <Field label="Имя *"><input style={inp} value={form.name} onChange={e=>set('name',e.target.value)}/></Field>
          <Field label="Фамилия *"><input style={inp} value={form.surname} onChange={e=>set('surname',e.target.value)}/></Field>
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
          <Field label="Дата рождения"><input style={inp} type="date" value={form.dob} onChange={e=>set('dob',e.target.value)}/></Field>
          <Field label="Страна">
            <select style={sel} value={form.country} onChange={e=>set('country',e.target.value)}>
              {COUNTRIES.map(c=><option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>
        <div>
          <div style={{ fontSize:11, color:'var(--text-2)', fontWeight:700, marginBottom:8 }}>ФОТО</div>
          <div style={{
            height:150, borderRadius:12, border:'2px dashed var(--sky-mid)',
            display:'flex', alignItems:'center', justifyContent:'center',
            cursor:'pointer', overflow:'hidden', background:'var(--sky-light)', transition:'border .2s',
          }} onClick={()=>document.getElementById('_photoInput').click()}>
            {form.photo
              ? <img src={form.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
              : <div style={{textAlign:'center'}}><div style={{fontSize:28,marginBottom:4}}>☁️</div><div style={{fontSize:10,color:'var(--text-3)'}}>Нажмите для выбора</div></div>
            }
          </div>
          <input type="file" id="_photoInput" accept="image/*" style={{display:'none'}} onChange={onPhoto}/>
          <div style={{marginTop:8,fontSize:10,color:'var(--text-3)',background:'var(--sky-light)',borderRadius:8,padding:'5px 10px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',border:'1px solid var(--border)'}}>
            {form.photoName||'Файл не выбран'}
          </div>
        </div>
      </div>
      {msg.text && (
        <div style={{marginTop:14,padding:'10px 14px',borderRadius:10,background:msg.ok?'rgba(46,204,138,0.1)':'rgba(255,92,106,0.1)',border:`1px solid ${msg.ok?'rgba(46,204,138,0.3)':'rgba(255,92,106,0.3)'}`,color:msg.ok?'var(--green)':'var(--red)',fontSize:12,textAlign:'center',fontWeight:600}}>
          {msg.text}
        </div>
      )}
      <div style={{display:'flex',gap:10,justifyContent:'flex-end',marginTop:16}}>
        <button style={btnGhost} onClick={onClose}>Отмена</button>
        <button style={btnPrimary} onClick={submit}>{isEdit?'✓ Сохранить':'✓ Зарегистрировать'}</button>
      </div>
    </ModalShell>
  )
}

/* ─── PROFILE MODAL ──────────────────────────────────────────── */
function ProfileModal({ open, onClose, participant, isAdmin, onEdit, onBMI }) {
  if (!open||!participant) return null
  const p = participant
  const months = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря']
  const formatDate = dob => { if(!dob) return '—'; const [y,m,d]=dob.split('-'); return `${parseInt(d)} ${months[parseInt(m)-1]} ${y}` }
  const fields = [
    ['📧 Email',p.email,'var(--sky-true)'],['⚧ Пол',p.gender,'var(--text)'],
    ['🎂 Дата рождения',formatDate(p.dob),'var(--text)'],['🌍 Страна',p.country||'—','var(--text)'],
    ['📊 ИМТ',p.bmi?p.bmi.toFixed(1):'—',bmiColor(p.bmi)],
    ['🏷 Роль',p.role,p.role==='Бегун'?'var(--sky-true)':'var(--purple)'],
    ['🔢 ID',p.id,'var(--text-3)'],['📅 Зарег.',p.created_at?new Date(p.created_at).toLocaleDateString('ru'):'—','var(--text)'],
  ]
  return (
    <ModalShell open={open} onClose={onClose} title="Профиль участника" width="min(560px,96vw)">
      <div style={{display:'flex',alignItems:'center',gap:16,marginBottom:20}}>
        <div style={{width:72,height:72,borderRadius:'50%',border:'3px solid var(--sky-mid)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:34,overflow:'hidden',flexShrink:0,background:'var(--sky-light)'}}>
          {p.photo?<img src={p.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(p.gender==='Женский'?'👩':'👨')}
        </div>
        <div>
          <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:800,color:'var(--text)'}}>{p.name} {p.surname}</div>
          <div style={{fontSize:12,color:p.role==='Бегун'?'var(--sky-true)':'var(--purple)',fontWeight:700,marginTop:2}}>{p.role}</div>
          <div style={{fontSize:11,color:'var(--text-3)',marginTop:1}}>{p.email}</div>
        </div>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
        {fields.map(([lbl,val,clr])=>(
          <div key={lbl} style={{...card,padding:'10px 14px'}}>
            <div style={{fontSize:9,color:'var(--text-3)',marginBottom:3,letterSpacing:'.04em',fontWeight:700}}>{lbl}</div>
            <div style={{fontSize:13,fontWeight:700,color:clr}}>{val}</div>
          </div>
        ))}
      </div>
      {isAdmin && (
        <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
          <button style={btnGhost} onClick={onClose}>Закрыть</button>
          <button style={{...btnSoft,color:'var(--green)'}} onClick={()=>onBMI(p)}>📊 Рассчитать ИМТ</button>
          <button style={btnPrimary} onClick={()=>onEdit(p)}>✏️ Редактировать</button>
        </div>
      )}
    </ModalShell>
  )
}

/* ─── CONFIRM MODAL ──────────────────────────────────────────── */
function ConfirmModal({ open, name, onConfirm, onCancel }) {
  if (!open) return null
  return (
    <div style={{position:'fixed',inset:0,background:'rgba(180,210,235,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,backdropFilter:'blur(6px)'}}>
      <div style={{...card,padding:'32px 36px',textAlign:'center',width:'min(380px,90vw)',borderRadius:20,boxShadow:'var(--shadow-lg)'}}>
        <div style={{fontSize:36,marginBottom:12}}>🗑️</div>
        <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:800,marginBottom:6,color:'var(--text)'}}>Удалить участника?</div>
        <div style={{fontSize:12,color:'var(--text-2)',marginBottom:24}}>{name}</div>
        <div style={{display:'flex',gap:10,justifyContent:'center'}}>
          <button style={btnGhost} onClick={onCancel}>Отмена</button>
          <button style={btnDanger} onClick={onConfirm}>Удалить</button>
        </div>
      </div>
    </div>
  )
}

/* ─── BMI PAGE ───────────────────────────────────────────────── */
function BMIPage({ runner, onBack, onSave }) {
  const [height,setHeight]=useState('170')
  const [weight,setWeight]=useState('70')
  const [gender,setGender]=useState('Мужской')
  const [bmiVal,setBmiVal]=useState(0)
  const figRef=useRef(null); const gaugeRef=useRef(null)
  useEffect(()=>{if(runner)setGender(runner.gender||'Мужской');setBmiVal(0)},[runner])
  useEffect(()=>{drawFigureOnCanvas(figRef.current,bmiVal,gender);drawGaugeOnCanvas(gaugeRef.current,bmiVal)},[bmiVal,gender])
  const calc=()=>{ const h=parseFloat(height),w=parseFloat(weight); if(!h||!w)return; const hm=h/100; setBmiVal(Math.round(w/(hm*hm)*10)/10) }
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--sky-light)',position:'relative'}}>
      <CloudBg/>
      <nav style={{...navStyle,height:60,display:'flex',alignItems:'center',padding:'0 20px',gap:12,flexShrink:0,position:'relative',zIndex:10}}>
        <button style={btnGhost} onClick={onBack}>← Назад</button>
        <div style={{flex:1,textAlign:'center',fontFamily:'var(--font-display)',fontSize:13,fontWeight:800,color:'var(--sky-true)',letterSpacing:'.06em'}}>ИМТ КАЛЬКУЛЯТОР</div>
        <button style={btnPrimary} onClick={()=>{if(!bmiVal){alert('Сначала рассчитайте ИМТ.');return}onSave(bmiVal)}}>💾 Сохранить</button>
      </nav>
      <div style={{flex:1,overflowY:'auto',padding:24,position:'relative',zIndex:1}}>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,maxWidth:700,margin:'0 auto'}}>
          <div style={{...card,padding:24}}>
            <p style={{fontSize:11,color:'var(--text-2)',marginBottom:20,lineHeight:1.7}}>ИМТ = вес (кг) / рост² (м)<br/>Помогает оценить соответствие веса и роста.</p>
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,color:'var(--text-2)',marginBottom:8,fontWeight:700}}>ПОЛ</div>
              <div style={{display:'flex',gap:16}}>
                {['Мужской','Женский'].map(g=>(
                  <label key={g} style={{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13,fontWeight:600,color:gender===g?'var(--sky-true)':'var(--text-2)'}}>
                    <input type="radio" name="bmiG" checked={gender===g} onChange={()=>setGender(g)} style={{accentColor:'var(--sky-true)'}}/> {g==='Мужской'?'♂':'♀'} {g}
                  </label>
                ))}
              </div>
            </div>
            {[['Рост',height,setHeight,'см'],['Вес',weight,setWeight,'кг']].map(([lbl,val,setter,unit])=>(
              <div key={lbl} style={{marginBottom:14}}>
                <Field label={lbl}>
                  <div style={{display:'flex',gap:8,alignItems:'center'}}>
                    <input style={{...inp,flex:1}} value={val} onChange={e=>setter(e.target.value.replace(/\D/g,''))}/>
                    <span style={{color:'var(--text-3)',fontSize:12,minWidth:24}}>{unit}</span>
                  </div>
                </Field>
              </div>
            ))}
            <div style={{display:'flex',gap:8}}>
              <button style={btnPrimary} onClick={calc}>▶ Рассчитать</button>
              <button style={btnGhost} onClick={()=>setBmiVal(0)}>Сброс</button>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            <div style={{...card,height:160,overflow:'hidden'}}><canvas ref={figRef} style={{width:'100%',height:'100%'}}/></div>
            <div style={{...card,padding:'16px 20px',textAlign:'center'}}>
              <div style={{fontFamily:'var(--font-display)',fontSize:34,fontWeight:800,color:bmiVal?bmiColor(bmiVal):'var(--text-3)',lineHeight:1}}>{bmiVal?bmiVal.toFixed(1):'—'}</div>
              <div style={{fontSize:13,fontWeight:700,color:bmiColor(bmiVal),marginTop:4}}>{bmiCategory(bmiVal)}</div>
            </div>
            <div style={{...card,height:60,overflow:'hidden',padding:'4px 10px'}}><canvas ref={gaugeRef} style={{width:'100%',height:'100%'}}/></div>
          </div>
        </div>
      </div>
      <div style={{...navStyle,height:44,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,borderTop:'1px solid var(--border)',borderBottom:'none',position:'relative',zIndex:10}}>
        <span style={{fontSize:12,fontWeight:700,color:'var(--text-2)'}}>👤 {runner?`${runner.name} ${runner.surname}`:'...'}</span>
      </div>
    </div>
  )
}

/* ─── ADMIN LOGIN ─────────────────────────────────────────────── */
function AdminLoginPage({ onBack, onLogin }) {
  const [login,setLogin]=useState('')
  const [pass,setPass]=useState('')
  const [err,setErr]=useState('')
  const doLogin=()=>{ if(login==='admin'&&pass==='admin123'){onLogin();setErr('')}else setErr('Неверный логин или пароль') }
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--sky-light)',position:'relative'}}>
      <CloudBg/>
      <nav style={{...navStyle,height:60,display:'flex',alignItems:'center',padding:'0 20px',gap:12,flexShrink:0,position:'relative',zIndex:10}}>
        <button style={btnGhost} onClick={onBack}>← Назад</button>
        <span style={{fontFamily:'var(--font-display)',fontSize:12,fontWeight:800,color:'var(--sky-true)',letterSpacing:'.06em'}}>MARATHON SKILLS 2026</span>
      </nav>
      <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',position:'relative',zIndex:1}}>
        <div style={{...card,width:'min(400px,90vw)',padding:'36px 32px',borderRadius:20,boxShadow:'var(--shadow-lg)'}}>
          <div style={{textAlign:'center',marginBottom:24}}>
            <div style={{fontSize:36,marginBottom:10}}>🔐</div>
            <div style={{fontFamily:'var(--font-display)',fontSize:15,fontWeight:800,color:'var(--sky-true)',letterSpacing:'.04em',marginBottom:6}}>АВТОРИЗАЦИЯ</div>
            <div style={{fontSize:11,color:'var(--text-3)'}}>Введите логин и пароль администратора</div>
          </div>
          <Field label="Логин"><input style={{...inp,marginBottom:4}} value={login} onChange={e=>setLogin(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()}/></Field>
          <div style={{height:12}}/>
          <Field label="Пароль"><input style={inp} type="password" value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==='Enter'&&doLogin()}/></Field>
          {err && <div style={{color:'var(--red)',fontSize:11,textAlign:'center',marginTop:10,fontWeight:600}}>{err}</div>}
          <div style={{display:'flex',gap:10,marginTop:20}}>
            <button style={{...btnGhost,flex:1}} onClick={onBack}>Отмена</button>
            <button style={{...btnPrimary,flex:1}} onClick={doLogin}>Войти</button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ─── USERS PAGE ──────────────────────────────────────────────── */
function UsersPage({ participants,isAdmin,onBack,onProfile,onEdit,onDelete,onBMI,loading }) {
  const [search,setSearch]=useState('')
  const [roleFilter,setRoleFilter]=useState('Все')
  const [sort,setSort]=useState('По имени')
  const [page,setPage]=useState(1)
  const PER_PAGE=15
  let list=[...participants]
  if(roleFilter!=='Все') list=list.filter(p=>p.role===roleFilter)
  if(search){ const q=search.toLowerCase(); list=list.filter(p=>`${p.name} ${p.surname} ${p.email}`.toLowerCase().includes(q)) }
  list.sort((a,b)=>{
    if(sort==='По имени') return (a.name||'').localeCompare(b.name||'')
    if(sort==='По фамилии') return (a.surname||'').localeCompare(b.surname||'')
    if(sort==='По Email') return (a.email||'').localeCompare(b.email||'')
    if(sort==='По роли') return (a.role||'').localeCompare(b.role||'')
    if(sort==='По стране') return (a.country||'').localeCompare(b.country||'')
    return 0
  })
  const pages=Math.max(1,Math.ceil(list.length/PER_PAGE))
  const paged=list.slice((page-1)*PER_PAGE,page*PER_PAGE)
  const thS={ padding:'10px 14px',textAlign:'left',fontSize:9,fontWeight:800,color:'var(--text-2)',letterSpacing:'.08em',borderBottom:'2px solid var(--sky-blue)',whiteSpace:'nowrap',background:'var(--cloud-soft)',position:'sticky',top:0 }
  const tdS={ padding:'10px 14px',fontSize:12,borderBottom:'1px solid var(--sky-blue)' }
  return (
    <div style={{display:'flex',flexDirection:'column',height:'100vh',background:'var(--sky-light)',position:'relative'}}>
      <CloudBg/>
      <nav style={{...navStyle,height:60,display:'flex',alignItems:'center',padding:'0 20px',gap:12,flexShrink:0,position:'relative',zIndex:10}}>
        <button style={btnGhost} onClick={onBack}>← Назад</button>
        <span style={{fontFamily:'var(--font-display)',fontSize:12,fontWeight:800,color:'var(--sky-true)',letterSpacing:'.06em',flex:1}}>УЧАСТНИКИ</span>
        {isAdmin && <button style={btnPrimary} onClick={()=>onEdit(null)}>+ Добавить</button>}
      </nav>
      {/* Filters */}
      <div style={{background:'rgba(255,255,255,0.85)',backdropFilter:'blur(10px)',borderBottom:'1px solid var(--border)',padding:'12px 20px',position:'relative',zIndex:5}}>
        <div style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}}>
          <div style={{display:'flex',gap:6}}>
            {['Все','Бегун','Координатор'].map(r=>(
              <button key={r} style={{
                ...btnGhost,height:30,fontSize:11,
                background:roleFilter===r?'linear-gradient(135deg,var(--sky-horizon),var(--sky-true))':'transparent',
                color:roleFilter===r?'#fff':'var(--text-2)',
                border:roleFilter===r?'none':'1.5px solid var(--border)',
                boxShadow:roleFilter===r?'0 2px 8px rgba(26,141,216,0.3)':'none',
              }} onClick={()=>{setRoleFilter(r);setPage(1)}}>{r}</button>
            ))}
          </div>
          <select style={{...sel,width:'auto',height:30,padding:'0 10px'}} value={sort} onChange={e=>setSort(e.target.value)}>
            {['По имени','По фамилии','По Email','По роли','По стране'].map(o=><option key={o}>{o}</option>)}
          </select>
          <input style={{...inp,width:200,height:30}} placeholder="🔍 Поиск..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
          <span style={{fontSize:11,color:'var(--text-3)',marginLeft:'auto',fontWeight:600}}>{list.length} участников</span>
        </div>
      </div>
      {/* Table */}
      <div style={{flex:1,overflowY:'auto',position:'relative',zIndex:1}}>
        {loading ? (
          <div style={{textAlign:'center',padding:60,color:'var(--text-3)'}}>
            <div style={{fontSize:32,marginBottom:12,animation:'spin 1s linear infinite',display:'inline-block'}}>⏳</div>
            <div style={{fontSize:13}}>Загрузка...</div>
          </div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',background:'rgba(255,255,255,0.6)'}}>
            <thead>
              <tr>{['#','Участник','Email','Страна','ИМТ','Роль'].map(h=><th key={h} style={thS}>{h}</th>)}{isAdmin&&<><th style={{...thS,width:40}}/><th style={{...thS,width:40}}/></>}</tr>
            </thead>
            <tbody>
              {paged.map((p,i)=>(
                <tr key={p.id} style={{cursor:'pointer',transition:'background .15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(215,238,255,0.6)'}
                  onMouseLeave={e=>e.currentTarget.style.background=''}
                  onClick={()=>onProfile(p)}>
                  <td style={{...tdS,color:'var(--text-3)',width:40}}>{(page-1)*PER_PAGE+i+1}</td>
                  <td style={tdS}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <div style={{width:30,height:30,borderRadius:'50%',overflow:'hidden',flexShrink:0,background:'var(--sky-blue)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:15,border:'2px solid var(--sky-mid)'}}>
                        {p.photo?<img src={p.photo} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:(p.gender==='Женский'?'👩':'👨')}
                      </div>
                      <span style={{fontWeight:700,color:'var(--text)'}}>{p.name} {p.surname}</span>
                    </div>
                  </td>
                  <td style={{...tdS,color:'var(--sky-true)',fontSize:11}}>{p.email}</td>
                  <td style={tdS}>{p.country||'—'}</td>
                  <td style={{...tdS,color:bmiColor(p.bmi),fontWeight:700}}>{p.bmi?p.bmi.toFixed(1):'—'}</td>
                  <td style={tdS}>
                    <span style={{
                      background:p.role==='Бегун'?'rgba(26,141,216,0.1)':'rgba(139,108,247,0.1)',
                      color:p.role==='Бегун'?'var(--sky-true)':'var(--purple)',
                      borderRadius:20,padding:'2px 10px',fontSize:10,fontWeight:800,
                    }}>{p.role}</span>
                  </td>
                  {isAdmin&&<>
                    <td style={{...tdS,width:40}} onClick={e=>{e.stopPropagation();onEdit(p)}}>
                      <button style={{...btnSoft,height:26,padding:'0 8px',fontSize:12}}>✏</button>
                    </td>
                    <td style={{...tdS,width:40}} onClick={e=>{e.stopPropagation();onDelete(p)}}>
                      <button style={{...btnGhost,height:26,padding:'0 8px',fontSize:12,color:'var(--red)'}}>🗑</button>
                    </td>
                  </>}
                </tr>
              ))}
              {paged.length===0&&<tr><td colSpan={isAdmin?8:6} style={{textAlign:'center',padding:'40px 0',color:'var(--text-3)',fontSize:13}}>Участники не найдены</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination */}
      <div style={{background:'rgba(255,255,255,0.88)',backdropFilter:'blur(10px)',borderTop:'1px solid var(--border)',height:50,display:'flex',alignItems:'center',padding:'0 20px',gap:8,flexShrink:0,position:'relative',zIndex:5}}>
        <button style={{...btnGhost,height:28,width:28,padding:0,justifyContent:'center'}} disabled={page<=1} onClick={()=>setPage(p=>p-1)}>‹</button>
        <span style={{fontSize:11,color:'var(--text-3)',minWidth:80,textAlign:'center',fontWeight:600}}>Стр. {page} / {pages}</span>
        <button style={{...btnGhost,height:28,width:28,padding:0,justifyContent:'center'}} disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>›</button>
        <div style={{marginLeft:'auto'}}><Countdown/></div>
      </div>
    </div>
  )
}

/* ─── MAIN ────────────────────────────────────────────────────── */
export default function Home() {
  const { data:session, status } = useSession()
  const [participants,setParticipants]=useState([])
  const [loading,setLoading]=useState(false)
  const [view,setView]=useState('main')
  const [isAdmin,setIsAdmin]=useState(false)
  const [registerOpen,setRegisterOpen]=useState(false)
  const [editTarget,setEditTarget]=useState(null)
  const [profileOpen,setProfileOpen]=useState(false)
  const [profileTarget,setProfileTarget]=useState(null)
  const [bmiTarget,setBmiTarget]=useState(null)
  const [confirmTarget,setConfirmTarget]=useState(null)

  useEffect(()=>{if(status==='authenticated')fetchParticipants()},[status])
  const fetchParticipants=async()=>{ setLoading(true); try{const res=await fetch('/api/participants'); if(res.ok)setParticipants(await res.json())}finally{setLoading(false)} }
  const saveParticipant=async(data,id)=>{
    if(id){const res=await fetch(`/api/participants/${id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(res.ok){const u=await res.json();setParticipants(ps=>ps.map(p=>p.id===id?u:p))}}
    else{const res=await fetch('/api/participants',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)});if(res.ok){const c=await res.json();setParticipants(ps=>[c,...ps])}}
  }
  const deleteParticipant=async id=>{await fetch(`/api/participants/${id}`,{method:'DELETE'});setParticipants(ps=>ps.filter(p=>p.id!==id));setConfirmTarget(null)}
  const saveBMI=async bmiVal=>{
    if(!bmiTarget)return
    const res=await fetch(`/api/participants/${bmiTarget.id}`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({...bmiTarget,bmi:bmiVal})})
    if(res.ok){const u=await res.json();setParticipants(ps=>ps.map(p=>p.id===bmiTarget.id?u:p))}
    setBmiTarget(null);setView('users')
  }
  const runners=participants.filter(p=>p.role==='Бегун').length
  const coords=participants.filter(p=>p.role==='Координатор').length
  const bmis=participants.filter(p=>p.bmi).map(p=>p.bmi)
  const avgBMI=bmis.length?(bmis.reduce((a,b)=>a+b,0)/bmis.length).toFixed(1):'—'
  const topCountry=(()=>{ const c={}; participants.forEach(p=>{if(p.country)c[p.country]=(c[p.country]||0)+1}); return Object.entries(c).sort((a,b)=>b[1]-a[1])[0]?.[0]||'—' })()

  if(status==='loading') return (
    <div style={{background:'var(--sky-light)',color:'var(--text)',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-body)',position:'relative'}}>
      <CloudBg/>
      <div style={{textAlign:'center',position:'relative',zIndex:1}}>
        <div style={{fontSize:48,marginBottom:12,animation:'float 2s ease-in-out infinite',display:'inline-block'}}>🏃</div>
        <div style={{color:'var(--text-3)',fontSize:13,fontWeight:600}}>Загрузка...</div>
      </div>
    </div>
  )

  /* ─── PUBLIC LANDING ─── */
  if(!session) return (
    <div style={{minHeight:'100vh',fontFamily:'var(--font-body)',color:'var(--text)',display:'grid',gridTemplateColumns:'1fr 1fr',position:'relative',overflow:'hidden'}}>

      {/* LEFT PANEL */}
      <div style={{
        background:'linear-gradient(160deg,#0F6BAD 0%,#1A8DD8 35%,#4AACF0 65%,#7EC8F7 85%,#C9E8FF 100%)',
        display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
        padding:'60px 48px',position:'relative',overflow:'hidden',
      }}>
        <div style={{position:'absolute',top:-80,left:-80,width:320,height:320,borderRadius:'50%',background:'rgba(255,255,255,0.07)'}}/>
        <div style={{position:'absolute',bottom:-60,right:-60,width:240,height:240,borderRadius:'50%',background:'rgba(255,255,255,0.06)'}}/>
        <div style={{position:'absolute',top:'40%',right:-40,width:160,height:160,borderRadius:'50%',background:'rgba(255,255,255,0.05)'}}/>

        {/* SVG Logo */}
        <div style={{marginBottom:32,position:'relative',zIndex:1}}>
          <svg width="110" height="110" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="55" cy="55" r="54" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"/>
            <circle cx="55" cy="55" r="42" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1"/>
            <rect x="22" y="52" width="66" height="12" rx="6" fill="rgba(255,255,255,0.9)"/>
            <rect x="22" y="52" width="9" height="12" rx="0" fill="rgba(255,184,48,0.95)"/>
            <rect x="42" y="52" width="9" height="12" rx="0" fill="rgba(255,184,48,0.95)"/>
            <rect x="62" y="52" width="9" height="12" rx="0" fill="rgba(255,184,48,0.95)"/>
            <path d="M47 30h16v13c0 4.4-3.6 8-8 8s-8-3.6-8-8V30z" fill="rgba(255,255,255,0.95)"/>
            <rect x="51" y="51" width="8" height="5" fill="rgba(255,255,255,0.95)"/>
            <rect x="46" y="56" width="18" height="3" rx="1.5" fill="rgba(255,255,255,0.95)"/>
            <path d="M47 33h-6c0 5 3 8 6 8" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <path d="M63 33h6c0 5-3 8-6 8" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
            <text x="30" y="88" fontSize="13" fill="rgba(255,255,255,0.8)" textAnchor="middle">★</text>
            <text x="55" y="92" fontSize="15" fill="rgba(255,255,255,0.9)" textAnchor="middle">★</text>
            <text x="80" y="88" fontSize="13" fill="rgba(255,255,255,0.8)" textAnchor="middle">★</text>
          </svg>
        </div>

        <div style={{textAlign:'center',position:'relative',zIndex:1}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:11,color:'rgba(255,255,255,0.75)',letterSpacing:'.22em',fontWeight:600,marginBottom:10}}>АЛМАТЫ · КАЗАХСТАН</div>
          <div style={{fontFamily:'var(--font-display)',fontSize:36,fontWeight:900,color:'#fff',letterSpacing:'.04em',lineHeight:1.1,marginBottom:10}}>MARATHON<br/>SKILLS</div>
          <div style={{display:'inline-block',background:'rgba(255,184,48,0.9)',color:'#fff',fontFamily:'var(--font-display)',fontSize:15,fontWeight:900,letterSpacing:'.18em',padding:'4px 20px',borderRadius:20,marginBottom:22}}>2026</div>
          <div style={{fontSize:12,color:'rgba(255,255,255,0.8)',lineHeight:2}}>
            <div>📍 42.195 КМ</div>
            <div>📅 15 ИЮНЯ 2026</div>
            <div>🕘 Старт в 09:00</div>
          </div>
        </div>
        <svg style={{position:'absolute',bottom:-2,left:0,right:0,width:'100%'}} height="40" viewBox="0 0 400 40" preserveAspectRatio="none">
          <path d="M0 40 Q100 10 200 25 Q300 40 400 15 L400 40Z" fill="rgba(255,255,255,0.08)"/>
        </svg>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        background:'linear-gradient(180deg,#F5FBFF 0%,#FFFFFF 60%)',
        display:'flex',flexDirection:'column',justifyContent:'center',
        padding:'60px 52px',position:'relative',overflow:'hidden',
      }}>
        <div style={{position:'absolute',top:0,right:0,left:0,height:5,background:'linear-gradient(90deg,var(--sky-mid),var(--sky-deep),var(--sky-mid))',opacity:.4}}/>

        <div style={{marginBottom:8}}>
          <div style={{fontFamily:'var(--font-display)',fontSize:10,color:'var(--sky-true)',fontWeight:800,letterSpacing:'.18em',marginBottom:10}}>ДОБРО ПОЖАЛОВАТЬ</div>
          <div style={{fontFamily:'var(--font-display)',fontSize:26,fontWeight:900,color:'var(--text)',lineHeight:1.2,marginBottom:12}}>
            Ваш старт<br/><span style={{color:'var(--sky-true)'}}>начинается здесь</span>
          </div>
          <div style={{fontSize:13,color:'var(--text-2)',lineHeight:1.7,maxWidth:340}}>
            Зарегистрируйтесь на марафон, следите за участниками и отслеживайте результаты в одном месте.
          </div>
        </div>

        <div style={{background:'linear-gradient(135deg,var(--sky-light),var(--cloud-soft))',border:'1.5px solid var(--border)',borderRadius:16,padding:'18px 24px',marginBottom:20,marginTop:20,boxShadow:'0 2px 16px rgba(74,172,240,0.1)'}}>
          <div style={{fontSize:10,color:'var(--text-3)',fontWeight:800,letterSpacing:'.12em',marginBottom:10,textAlign:'center'}}>⏱ ДО СТАРТА МАРАФОНА</div>
          <Countdown/>
        </div>

        <button onClick={()=>signIn('google',{callbackUrl:'/'})} style={{
          display:'flex',alignItems:'center',justifyContent:'center',gap:12,
          background:'var(--sky-true)',color:'#fff',border:'none',borderRadius:14,
          padding:'15px 28px',fontSize:14,fontWeight:800,cursor:'pointer',
          boxShadow:'0 4px 20px rgba(26,141,216,0.4)',marginBottom:12,
          transition:'all .2s',width:'100%',
        }}
          onMouseOver={e=>{e.currentTarget.style.background='var(--sky-dark)';e.currentTarget.style.transform='translateY(-2px)'}}
          onMouseOut={e=>{e.currentTarget.style.background='var(--sky-true)';e.currentTarget.style.transform=''}}>
          <GoogleIcon/> Войти через Google
        </button>

        <a href="https://t.me/Marathon_Skills_KZ_2026_bot" target="_blank" rel="noopener noreferrer" style={{
          display:'flex',alignItems:'center',gap:12,
          background:'rgba(33,150,243,0.06)',border:'1.5px solid rgba(33,150,243,0.18)',
          borderRadius:14,padding:'11px 16px',marginBottom:24,textDecoration:'none',transition:'all .2s',
        }}
          onMouseOver={e=>e.currentTarget.style.background='rgba(33,150,243,0.11)'}
          onMouseOut={e=>e.currentTarget.style.background='rgba(33,150,243,0.06)'}>
          <div style={{width:36,height:36,borderRadius:'50%',background:'linear-gradient(135deg,#29B6F6,#0288D1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:17,flexShrink:0}}>✈️</div>
          <div style={{flex:1}}>
            <div style={{fontSize:12,fontWeight:800,color:'var(--text)'}}>Telegram бот</div>
            <div style={{fontSize:10,color:'var(--text-3)'}}>Задай вопрос · Найди участника</div>
          </div>
          <div style={{fontSize:11,color:'var(--sky-true)',fontWeight:800}}>→</div>
        </a>

        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          {[
            ['🏆','Регистрация участников','Добавляйте бегунов и координаторов'],
            ['📊','Расчёт ИМТ','Автоматический расчёт индекса массы тела'],
            ['🌍','42+ страны','Участники со всего мира'],
          ].map(([icon,title,sub])=>(
            <div key={title} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 14px',borderRadius:12,background:'rgba(26,141,216,0.05)',border:'1px solid var(--border)'}}>
              <div style={{width:34,height:34,borderRadius:10,background:'linear-gradient(135deg,var(--sky-light),var(--sky-blue))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,flexShrink:0}}>{icon}</div>
              <div>
                <div style={{fontSize:12,fontWeight:800,color:'var(--text)'}}>{title}</div>
                <div style={{fontSize:10,color:'var(--text-3)'}}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if(view==='bmi') return <BMIPage runner={bmiTarget} onBack={()=>{setBmiTarget(null);setView('users')}} onSave={saveBMI}/>
  if(view==='adminLogin') return <AdminLoginPage onBack={()=>setView('main')} onLogin={()=>{setIsAdmin(true);setView('users')}}/>
  if(view==='users') return (
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

  /* ─── DASHBOARD ─── */
  const stats=[
    {icon:'🏃',val:runners,label:'Бегунов',color:'var(--sky-true)',bg:'rgba(26,141,216,0.08)'},
    {icon:'📋',val:coords,label:'Координаторов',color:'var(--purple)',bg:'rgba(139,108,247,0.08)'},
    {icon:'📊',val:avgBMI,label:'Средний ИМТ',color:'var(--green)',bg:'rgba(46,204,138,0.08)'},
    {icon:'🌍',val:topCountry,label:'Топ страна',color:'var(--sun)',bg:'rgba(255,184,48,0.1)'},
    {icon:'👥',val:participants.length,label:'Всего',color:'var(--sky-horizon)',bg:'rgba(74,172,240,0.08)'},
  ]
  return (
    <div style={{display:'flex',flexDirection:'column',minHeight:'100vh',background:'var(--sky-light)',fontFamily:'var(--font-body)',color:'var(--text)',position:'relative'}}>
      <CloudBg/>
      <Navbar onUsers={()=>setView('users')} onRegister={()=>{setEditTarget(null);setRegisterOpen(true)}} onAdminLogin={()=>setView('adminLogin')} session={session} isAdmin={isAdmin} onAdminLogout={()=>setIsAdmin(false)}/>
      <div style={{flex:1,overflowY:'auto',padding:'24px',position:'relative',zIndex:1}}>

        {/* Hero */}
        <div style={{
          borderRadius:20,overflow:'hidden',position:'relative',marginBottom:20,
          background:'linear-gradient(135deg,var(--sky-horizon) 0%,var(--sky-true) 50%,var(--sky-deep) 100%)',
          padding:'28px 32px',boxShadow:'0 8px 32px rgba(74,172,240,0.35)',
        }}>
          {/* Cloud overlay */}
          <div style={{position:'absolute',inset:0,backgroundImage:'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'400\' height=\'120\'%3E%3Cellipse cx=\'320\' cy=\'80\' rx=\'100\' ry=\'50\' fill=\'rgba(255,255,255,0.08)\'/%3E%3Cellipse cx=\'360\' cy=\'55\' rx=\'70\' ry=\'40\' fill=\'rgba(255,255,255,0.06)\'/%3E%3C/svg%3E")',backgroundRepeat:'no-repeat',backgroundPosition:'right center',backgroundSize:'cover',pointerEvents:'none'}}/>
          <div style={{fontFamily:'var(--font-display)',fontSize:24,fontWeight:900,letterSpacing:'.04em',marginBottom:4,color:'#fff'}}>MARATHON SKILLS 2026</div>
          <div style={{fontSize:13,color:'rgba(255,255,255,0.8)',marginBottom:16}}>42.195 КМ · 15 ИЮНЯ 2026 · АЛМАТЫ</div>
          <div style={{display:'flex',gap:10}}>
            <button style={{...btnPrimary,background:'rgba(255,255,255,0.2)',boxShadow:'none',border:'1.5px solid rgba(255,255,255,0.4)',backdropFilter:'blur(10px)',height:38}} onClick={()=>{setEditTarget(null);setRegisterOpen(true)}}>+ Зарегистрировать</button>
            <button style={{...btnPrimary,background:'rgba(255,255,255,0.12)',boxShadow:'none',border:'1.5px solid rgba(255,255,255,0.25)',backdropFilter:'blur(10px)',height:38}} onClick={()=>setView('users')}>👥 Все участники</button>
          </div>
          <div style={{position:'absolute',right:28,top:'50%',transform:'translateY(-50%)',fontSize:64,opacity:.18}}>🏃</div>
        </div>

        {/* Countdown card */}
        <div style={{...card,padding:'14px 20px',marginBottom:20,borderRadius:16}}>
          <Countdown/>
        </div>

        {/* Stats */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:10,marginBottom:20}}>
          {stats.map(s=>(
            <div key={s.label} style={{...card,padding:'16px 14px',borderRadius:16,borderTop:`3px solid ${s.color}`}}>
              <div style={{width:36,height:36,borderRadius:10,background:s.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,marginBottom:8}}>{s.icon}</div>
              <div style={{fontFamily:'var(--font-display)',fontSize:20,fontWeight:800,color:s.color,lineHeight:1}}>{s.val}</div>
              <div style={{fontSize:9,color:'var(--text-3)',marginTop:4,fontWeight:700,letterSpacing:'.06em'}}>{s.label.toUpperCase()}</div>
            </div>
          ))}
        </div>

        {/* Telegram */}
        <a href="https://t.me/Marathon_Skills_KZ_2026_bot" target="_blank" rel="noopener noreferrer" style={{
          display:'flex',alignItems:'center',gap:14,
          background:'rgba(33,150,243,0.07)',border:'1.5px solid rgba(33,150,243,0.18)',
          borderRadius:16,padding:'14px 20px',marginBottom:16,textDecoration:'none',
        }}>
          <div style={{width:46,height:46,borderRadius:'50%',background:'linear-gradient(135deg,#29B6F6,#0288D1)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0,boxShadow:'0 3px 12px rgba(33,150,243,0.25)'}}>✈️</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:800,color:'var(--text)',marginBottom:2}}>Есть вопросы? Спроси бота в Telegram</div>
            <div style={{fontSize:11,color:'var(--text-3)'}}>Найди участника по имени или фамилии · Узнай как зарегистрироваться</div>
          </div>
          <div style={{background:'linear-gradient(135deg,#29B6F6,#0288D1)',color:'#fff',borderRadius:10,padding:'7px 16px',fontSize:11,fontWeight:800,boxShadow:'0 2px 8px rgba(33,150,243,0.25)'}}>Открыть →</div>
        </a>

        {/* Info cards */}
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[
            ['var(--sky-horizon)','🏃','Марафон — испытание воли','Дистанция 42,195 км объединяет профессионалов и любителей в едином порыве выносливости.'],
            ['var(--sun)','☀️','Рассвет над трассой','Старт в 9:00 — беги навстречу утреннему солнцу над городом.'],
            ['var(--green)','🌿','Города без машин','Уникальный шанс увидеть город иначе: пробежать по мостам под крики болельщиков.'],
          ].map(([clr,icon,title,desc])=>(
            <div key={title} style={{...card,padding:'18px',borderRadius:16,borderTop:`3px solid ${clr}`}}>
              <div style={{fontSize:22,marginBottom:8}}>{icon}</div>
              <div style={{fontSize:13,fontWeight:800,marginBottom:6,color:'var(--text)'}}>{title}</div>
              <div style={{fontSize:11,color:'var(--text-3)',lineHeight:1.6}}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
      <RegisterModal open={registerOpen} onClose={()=>{setRegisterOpen(false);setEditTarget(null)}} onSave={saveParticipant} editData={editTarget}/>
    </div>
  )
}
