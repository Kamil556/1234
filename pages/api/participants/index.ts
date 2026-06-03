import type { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../auth/[...nextauth]'
import { getSupabaseAdmin } from '../../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions)
  if (!session?.user) return res.status(401).json({ error: 'Unauthorized' })

  const userId = (session.user as any).id as string
  if (!userId) return res.status(401).json({ error: 'Missing user id' })

  const db = getSupabaseAdmin()

  // ── GET: список всех участников ──────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await db
      .from('participants')
      .select('id, name, surname, email, role, bmi, active, country, gender, dob, photo_url, notes, created_at')
      .order('name')

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data ?? [])
  }

  // ── POST: регистрация нового участника ───────────────────────────
  if (req.method === 'POST') {
    const { name, surname, gender, dob, country, photo_url } = req.body

    if (!name?.trim() || !surname?.trim()) {
      return res.status(400).json({ error: 'Имя и фамилия обязательны' })
    }

    // Проверяем: не зарегистрирован ли уже этот пользователь?
    const { data: existing } = await db
      .from('participants')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (existing) {
      return res.status(409).json({ error: 'Вы уже зарегистрированы' })
    }

    const { data, error } = await db
      .from('participants')
      .insert({
        user_id: userId,
        email: session.user.email!,
        name: name.trim(),
        surname: surname.trim(),
        gender: gender || 'Мужской',
        dob: dob || null,
        country: country || 'Казахстан',
        photo_url: photo_url || session.user.image || null,
        role: 'Бегун',
        active: true,
      })
      .select()
      .single()

    if (error) return res.status(500).json({ error: error.message })
    return res.status(201).json(data)
  }

  res.setHeader('Allow', ['GET', 'POST'])
  res.status(405).end(`Method ${req.method} Not Allowed`)
}
