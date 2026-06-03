import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect, ComponentType } from 'react'

export default function withAuth<P extends object>(Component: ComponentType<P>) {
  return function AuthGuard(props: P) {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
      if (status === 'unauthenticated') router.replace('/login')
    }, [status, router])

    if (status === 'loading') {
      return (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          height: '100vh', fontFamily: 'var(--fc)', fontSize: 18, color: 'var(--dark)',
        }}>
          Загрузка...
        </div>
      )
    }
    if (!session) return null
    return <Component {...props} />
  }
}
