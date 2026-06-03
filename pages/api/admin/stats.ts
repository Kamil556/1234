import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getSupabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()

  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const userId = (session.user as any).id as string
  if (!userId) return res.status(401).json({ error: 'Missing user id' })

  const db = getSupabaseAdmin()

  // Проверяем роль
  const { data: me } = await db
    .from('participants')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (me?.role !== 'Координатор') {
    return res.status(403).json({ error: 'Доступ запрещён' })
  }

  const { data: all, error } = await db
    .from('participants')
    .select('role, active, bmi')

  if (error) return res.status(500).json({ error: error.message })

  const rows = all ?? []
  const runners  = rows.filter(r => r.role === 'Бегун').length
  const coords   = rows.filter(r => r.role === 'Координатор').length
  const active   = rows.filter(r => r.active === true).length
  const blocked  = rows.filter(r => r.active === false).length
  const withBmi  = rows.filter(r => r.bmi != null)
  const avgBmi   = withBmi.length
    ? (withBmi.reduce((s, r) => s + Number(r.bmi), 0) / withBmi.length).toFixed(1)
    : null

  return res.status(200).json({
    runners, coords, active, blocked,
    withBmi: withBmi.length,
    noBmi: rows.length - withBmi.length,
    avgBmi,
    total: rows.length,
  })
}
