import { signIn, useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function LoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060610',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Manrope', system-ui, sans-serif",
      color: '#F0F0FA',
    }}>
      {/* bg glow */}
      <div style={{ position:'fixed', top:'30%', left:'50%', transform:'translate(-50%,-50%)', width:500, height:400, background:'radial-gradient(ellipse, rgba(255,95,31,0.1) 0%, transparent 70%)', pointerEvents:'none' }}/>

      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '48px 52px',
        width: 'min(420px, 90vw)',
        textAlign: 'center',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>🏃</div>
        <div style={{ fontFamily:"'Unbounded', sans-serif", fontSize: 16, fontWeight: 900, letterSpacing: '.08em', marginBottom: 4 }}>
          MARATHON SKILLS
        </div>
        <div style={{ fontSize: 11, color: '#FF5F1F', marginBottom: 6, fontWeight: 700, letterSpacing: '.2em' }}>2026</div>
        <div style={{ fontSize: 11, color: 'rgba(240,240,250,0.4)', marginBottom: 32 }}>
          Войдите, чтобы управлять участниками марафона
        </div>
        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: '#fff', color: '#111', border: 'none', borderRadius: 10,
            padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer',
            width: '100%', justifyContent: 'center', transition: '.2s',
          }}
          onMouseOver={e => e.currentTarget.style.background = '#f0f0f0'}
          onMouseOut={e => e.currentTarget.style.background = '#fff'}
        >
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Войти через Google
        </button>
        <div style={{ marginTop: 24, fontSize: 10, color: 'rgba(240,240,250,0.3)' }}>
          42.195 КМ · 15 ИЮНЯ 2026 · АЛМАТЫ
        </div>
      </div>
    </div>
  )
}
