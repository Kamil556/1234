import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getSupabaseAdmin } from '../../../lib/supabase'

async function isCoordinator(userId: string): Promise<boolean> {
  const db = getSupabaseAdmin()
  const { data } = await db
    .from('participants')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()
  return data?.role === 'Координатор'
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const userId = (session.user as any).id as string
  if (!userId) return res.status(401).json({ error: 'Missing user id' })

  const { id } = req.query
  const participantId = Number(id)
  if (isNaN(participantId)) return res.status(400).json({ error: 'Invalid id' })

  const admin = await isCoordinator(userId)
  if (!admin) return res.status(403).json({ error: 'Доступ запрещён. Только Координаторы.' })

  const db = getSupabaseAdmin()

  // ── PUT: обновить данные участника ───────────────────────────────
  if (req.method === 'PUT') {
    const { name, surname, email, role, country, notes, active, bmi } = req.body

    const updates: Record<string, any> = {}
    if (name !== undefined)    updates.name = String(name).trim()
    if (surname !== undefined) updates.surname = String(surname).trim()
    if (email !== undefined)   updates.email = String(email).trim()
    if (role !== undefined)    updates.role = role
    if (country !== undefined) updates.country = country
    if (notes !== undefined)   updates.notes = notes
    if (active !== undefined)  updates.active = active
    if (bmi !== undefined)     updates.bmi = bmi !== null ? parseFloat(bmi) : null

    const { data, error } = await db
      .from('participants')
      .update(updates)
      .eq('id', participantId)
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  // ── DELETE: удалить участника ────────────────────────────────────
  if (req.method === 'DELETE') {
    const { error } = await db
      .from('participants')
      .delete()
      .eq('id', participantId)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(204).end()
  }

  res.setHeader('Allow', ['PUT', 'DELETE'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
