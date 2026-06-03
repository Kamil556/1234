import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import Image from 'next/image'

interface HeaderProps {
  showAdmin?: boolean
  showParticipants?: boolean
  showRegister?: boolean
  showBack?: boolean
  backHref?: string
  title?: string
}

export default function Header({
  showAdmin,
  showParticipants,
  showRegister,
  showBack,
  backHref = '/',
  title = 'MARATHON SKILLS 2026',
}: HeaderProps) {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <header className="hbar">
      {showBack && (
        <button className="btn btn-secondary" onClick={() => router.push(backHref)}>
          ← Назад
        </button>
      )}
      <span className="htitle" style={{ cursor: 'pointer' }} onClick={() => router.push('/')}>
        {title}
      </span>

      {showAdmin && (
        <Link href="/admin">
          <button className="btn btn-secondary">⚙ Админ</button>
        </Link>
      )}
      {showParticipants && (
        <Link href="/participants">
          <button className="btn btn-secondary">Список участников</button>
        </Link>
      )}
      {showRegister && (
        <Link href="/register">
          <button className="btn btn-primary">Регистрация</button>
        </Link>
      )}

      {/* User info */}
      {session?.user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          {session.user.image && (
            <Image
              src={session.user.image}
              alt={session.user.name || 'Avatar'}
              width={30}
              height={30}
              className="user-avatar"
              style={{ borderRadius: '50%' }}
            />
          )}
          <span className="user-name">{session.user.name?.split(' ')[0]}</span>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            Выйти
          </button>
        </div>
      )}
    </header>
  )
}
