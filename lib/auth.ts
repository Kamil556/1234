import { getServerSession } from 'next-auth/next'
import { authOptions } from '../pages/api/auth/[...nextauth]'
import type { NextApiRequest, NextApiResponse } from 'next'

/** Возвращает сессию и user_id, либо отвечает 401 */
export async function requireAuth(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) {
    res.status(401).json({ error: 'Unauthorized' })
    return null
  }
  const userId = (session.user as any).id as string
  if (!userId) {
    res.status(401).json({ error: 'Missing user id in session' })
    return null
  }
  return { session, userId }
}
