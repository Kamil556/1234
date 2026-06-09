import { getSupabaseAdmin } from '../../lib/supabase'

export const config = {
  api: { bodyParser: true },
}

const TOKEN    = process.env.TELEGRAM_BOT_TOKEN
const SITE_URL = 'https://1234-one-self.vercel.app'
const BOT_URL  = 'https://t.me/Marathon_Skills_KZ_2026_bot'

// ─── Telegram API helpers ─────────────────────────────────────
async function tg(method, body) {
  const r = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return r.json()
}

const send = (chatId, text, extra = {}) =>
  tg('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML', ...extra })

const edit = (chatId, msgId, text, extra = {}) =>
  tg('editMessageText', { chat_id: chatId, message_id: msgId, text, parse_mode: 'HTML', ...extra })

const ack = (id) => tg('answerCallbackQuery', { callback_query_id: id })

function esc(s) {
  if (!s) return '—'
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
}

// ─── Keyboards ────────────────────────────────────────────────
const mainKb = () => ({
  inline_keyboard: [
    [{ text: '✍️ Зарегистрироваться на марафон', callback_data: 'reg_start' }],
    [
      { text: '🔍 Найти по имени',   callback_data: 'search_name'    },
      { text: '🔍 Найти по фамилии', callback_data: 'search_surname' },
    ],
    [
      { text: '❓ О марафоне',             callback_data: 'about' },
      { text: '📋 Как зарегистрироваться', callback_data: 'howto' },
    ],
    [{ text: '🌐 Открыть сайт', url: SITE_URL }],
  ],
})

const cancelKb = () => ({
  inline_keyboard: [[{ text: '❌ Отмена регистрации', callback_data: 'reg_cancel' }]],
})

const genderKb = () => ({
  inline_keyboard: [
    [
      { text: '👨 Мужской', callback_data: 'reg_gender_Мужской' },
      { text: '👩 Женский', callback_data: 'reg_gender_Женский' },
    ],
    [{ text: '❌ Отмена', callback_data: 'reg_cancel' }],
  ],
})

const roleKb = () => ({
  inline_keyboard: [
    [
      { text: '🏃 Бегун',       callback_data: 'reg_role_Бегун'       },
      { text: '📋 Координатор', callback_data: 'reg_role_Координатор' },
    ],
    [{ text: '❌ Отмена', callback_data: 'reg_cancel' }],
  ],
})

const COUNTRIES = [
  'Казахстан','Россия','США','Германия','Франция','Великобритания',
  'Китай','Япония','Бразилия','Канада','Австралия','Индия',
  'Узбекистан','Кыргызстан','Азербайджан','Грузия','Украина','Беларусь','Другая страна',
]
const countryKb = () => {
  const rows = []
  for (let i = 0; i < COUNTRIES.length; i += 2) {
    const row = [{ text: COUNTRIES[i], callback_data: `reg_country_${COUNTRIES[i]}` }]
    if (COUNTRIES[i+1]) row.push({ text: COUNTRIES[i+1], callback_data: `reg_country_${COUNTRIES[i+1]}` })
    rows.push(row)
  }
  rows.push([{ text: '❌ Отмена', callback_data: 'reg_cancel' }])
  return { inline_keyboard: rows }
}

const confirmKb = () => ({
  inline_keyboard: [
    [
      { text: '✅ Подтвердить и зарегистрироваться', callback_data: 'reg_confirm' },
    ],
    [
      { text: '✏️ Начать заново', callback_data: 'reg_start' },
      { text: '❌ Отмена',        callback_data: 'reg_cancel' },
    ],
  ],
})

// ─── Session store ────────────────────────────────────────────
const sessions = {}
const get  = id => sessions[id] || null
const set  = (id, v) => { sessions[id] = v }
const del  = id => { delete sessions[id] }

// ─── Validators ───────────────────────────────────────────────
const isEmail = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)

function parseDob(s) {
  const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return null
  const [, d, mo, y] = m
  const dt = new Date(`${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`)
  if (isNaN(dt.getTime())) return null
  return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`
}

// ─── Summary ──────────────────────────────────────────────────
const summary = d =>
  `📋 <b>Проверь данные:</b>\n\n` +
  `📧 Email:           <b>${esc(d.email)}</b>\n` +
  `👤 Имя:             <b>${esc(d.name)}</b>\n` +
  `👤 Фамилия:         <b>${esc(d.surname)}</b>\n` +
  `🎂 Дата рождения:   <b>${esc(d.dob)}</b>\n` +
  `⚧  Пол:             <b>${esc(d.gender)}</b>\n` +
  `🎽 Роль:            <b>${esc(d.role)}</b>\n` +
  `🌍 Страна:          <b>${esc(d.country)}</b>\n\n` +
  `Всё верно?`

// ─── Save to Supabase ─────────────────────────────────────────
async function saveParticipant(chatId, d) {
  const db = getSupabaseAdmin()

  // Проверка дубликата по email
  const { data: existing } = await db
    .from('participants')
    .select('id')
    .eq('email', d.email)
    .maybeSingle()

  if (existing) return { duplicate: true }

  const { data, error } = await db
    .from('participants')
    .insert({
      owner_id: `tg_${chatId}`,
      email:    d.email,
      name:     d.name,
      surname:  d.surname,
      gender:   d.gender,
      role:     d.role,
      country:  d.country,
      dob:      d.dobIso || null,
      bmi:      null,
      photo:    null,
    })
    .select()
    .single()

  if (error) return { error }
  return { data }
}

// ─── Search ───────────────────────────────────────────────────
async function searchParticipants(field, query) {
  const db = getSupabaseAdmin()
  const { data, error } = await db
    .from('participants')
    .select('name, surname, role, country, bmi, gender')
    .ilike(field, `%${query}%`)
    .limit(6)
  return { data, error }
}

// ─── MAIN HANDLER ─────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true })

  try {
    const { message, callback_query } = req.body || {}

    // ══ CALLBACK QUERY (кнопки) ══════════════════════════════
    if (callback_query) {
      const chatId = callback_query.message.chat.id
      const msgId  = callback_query.message.message_id
      const cb     = callback_query.data
      await ack(callback_query.id)

      // ── Отмена ──
      if (cb === 'reg_cancel') {
        del(chatId)
        await edit(chatId, msgId,
          '❌ Регистрация отменена.\n\nВыбери действие:',
          { reply_markup: mainKb() }
        )
        return res.status(200).json({ ok: true })
      }

      // ── Начало регистрации ──
      if (cb === 'reg_start') {
        set(chatId, { step: 'email', data: {} })
        await edit(chatId, msgId,
          '✍️ <b>Регистрация на Marathon Skills 2026</b>\n\n' +
          '<b>Шаг 1 / 7</b> — Email\n\n' +
          '📧 Введи свой <b>email адрес</b>:',
          { reply_markup: cancelKb() }
        )
        return res.status(200).json({ ok: true })
      }

      // ── Пол ──
      if (cb.startsWith('reg_gender_')) {
        const gender = cb.replace('reg_gender_', '')
        const s = get(chatId)
        if (!s) { await edit(chatId, msgId, '⚠️ Сессия истекла. Начни заново.', { reply_markup: mainKb() }); return res.status(200).json({ ok: true }) }
        s.data.gender = gender
        s.step = 'role'
        set(chatId, s)
        await edit(chatId, msgId,
          `✍️ <b>Регистрация</b> — <b>Шаг 6 / 7</b>\n\n✅ Пол: <b>${gender}</b>\n\n🎽 Выбери <b>роль</b> на марафоне:`,
          { reply_markup: roleKb() }
        )
        return res.status(200).json({ ok: true })
      }

      // ── Роль ──
      if (cb.startsWith('reg_role_')) {
        const role = cb.replace('reg_role_', '')
        const s = get(chatId)
        if (!s) { await edit(chatId, msgId, '⚠️ Сессия истекла. Начни заново.', { reply_markup: mainKb() }); return res.status(200).json({ ok: true }) }
        s.data.role = role
        s.step = 'country'
        set(chatId, s)
        await edit(chatId, msgId,
          `✍️ <b>Регистрация</b> — <b>Шаг 7 / 7</b>\n\n✅ Роль: <b>${role}</b>\n\n🌍 Выбери свою <b>страну</b>:`,
          { reply_markup: countryKb() }
        )
        return res.status(200).json({ ok: true })
      }

      // ── Страна ──
      if (cb.startsWith('reg_country_')) {
        const country = cb.replace('reg_country_', '')
        const s = get(chatId)
        if (!s) { await edit(chatId, msgId, '⚠️ Сессия истекла. Начни заново.', { reply_markup: mainKb() }); return res.status(200).json({ ok: true }) }
        s.data.country = country
        s.step = 'confirm'
        set(chatId, s)
        await edit(chatId, msgId,
          summary(s.data),
          { reply_markup: confirmKb() }
        )
        return res.status(200).json({ ok: true })
      }

      // ── Подтверждение → сохранение в БД ──
      if (cb === 'reg_confirm') {
        const s = get(chatId)
        if (!s?.data?.email) {
          await edit(chatId, msgId, '⚠️ Сессия истекла. Начни заново.', { reply_markup: mainKb() })
          return res.status(200).json({ ok: true })
        }
        // Показываем "сохраняем..."
        await edit(chatId, msgId, '⏳ Сохраняем данные...')

        const result = await saveParticipant(chatId, s.data)
        del(chatId)

        if (result.duplicate) {
          await edit(chatId, msgId,
            `⚠️ Участник с email <b>${esc(s.data.email)}</b> уже зарегистрирован.\n\n` +
            `Если это ошибка — зайди на сайт: ${SITE_URL}`,
            { reply_markup: mainKb() }
          )
          return res.status(200).json({ ok: true })
        }

        if (result.error) {
          console.error('DB save error:', result.error)
          await edit(chatId, msgId,
            '❌ Ошибка сохранения данных. Попробуй позже или зарегистрируйся на сайте.',
            { reply_markup: mainKb() }
          )
          return res.status(200).json({ ok: true })
        }

        // Успех!
        await edit(chatId, msgId,
          '🎉 <b>Регистрация успешно завершена!</b>\n\n' +
          `👤 <b>${esc(s.data.name)} ${esc(s.data.surname)}</b>\n` +
          `🎽 Роль: <b>${esc(s.data.role)}</b>\n` +
          `🌍 Страна: <b>${esc(s.data.country)}</b>\n\n` +
          `📅 <b>Marathon Skills 2026</b>\n` +
          `📍 15 июня 2026 · Алматы · 42.195 км\n\n` +
          `🌐 Список участников: ${SITE_URL}\n` +
          `🤖 Бот: ${BOT_URL}`,
          { reply_markup: mainKb() }
        )
        return res.status(200).json({ ok: true })
      }

      // ── Поиск (кнопки) ──
      if (cb === 'search_name') {
        set(chatId, { step: 'search_name' })
        await edit(chatId, msgId, '🔍 Введи <b>имя</b> участника:', { reply_markup: cancelKb() })
        return res.status(200).json({ ok: true })
      }
      if (cb === 'search_surname') {
        set(chatId, { step: 'search_surname' })
        await edit(chatId, msgId, '🔍 Введи <b>фамилию</b> участника:', { reply_markup: cancelKb() })
        return res.status(200).json({ ok: true })
      }

      // ── О марафоне ──
      if (cb === 'about') {
        await edit(chatId, msgId,
          '🏅 <b>Marathon Skills 2026</b>\n\n' +
          'Марафон — забег на дистанцию <b>42,195 км</b>.\n\n' +
          '📅 Дата: <b>15 июня 2026</b>\n' +
          '📍 Место: <b>Алматы, Казахстан</b>\n' +
          '🕘 Старт: <b>09:00</b>\n\n' +
          '<b>Роли участников:</b>\n' +
          '🏃 <b>Бегун</b> — участвует в забеге\n' +
          '📋 <b>Координатор</b> — организует и помогает\n\n' +
          `🌐 Сайт: ${SITE_URL}`,
          { reply_markup: mainKb() }
        )
        return res.status(200).json({ ok: true })
      }

      // ── Как зарегистрироваться ──
      if (cb === 'howto') {
        await edit(chatId, msgId,
          '📋 <b>Два способа зарегистрироваться:</b>\n\n' +
          '1️⃣ <b>Прямо здесь в боте</b>\n' +
          '   Нажми «✍️ Зарегистрироваться» и следуй шагам\n\n' +
          '2️⃣ <b>На сайте</b>\n' +
          `   • Зайди на ${SITE_URL}\n` +
          '   • Войди через Google аккаунт\n' +
          '   • Нажми «+ Регистрация»\n' +
          '   • Заполни форму и подтверди\n\n' +
          '✅ В обоих случаях ты появишься в общем списке участников!',
          { reply_markup: mainKb() }
        )
        return res.status(200).json({ ok: true })
      }

      return res.status(200).json({ ok: true })
    }

    // ══ TEXT MESSAGE ═════════════════════════════════════════
    if (!message?.text) return res.status(200).json({ ok: true })

    const chatId = message.chat.id
    const text   = message.text.trim()
    const s      = get(chatId)

    // /start или /help
    if (text === '/start' || text === '/help') {
      del(chatId)
      const name = message.from?.first_name || 'участник'
      await send(chatId,
        `👋 Привет, <b>${esc(name)}</b>!\n\n` +
        '🏃 <b>Marathon Skills 2026</b>\n' +
        '📅 15 июня 2026 · Алматы · 42.195 км\n\n' +
        'Зарегистрируйся прямо здесь или найди участника.\n\n' +
        `🌐 Сайт: ${SITE_URL}`,
        { reply_markup: mainKb() }
      )
      return res.status(200).json({ ok: true })
    }

    // Нет активной сессии
    if (!s) {
      await send(chatId, '👋 Выбери действие:', { reply_markup: mainKb() })
      return res.status(200).json({ ok: true })
    }

    const step = s.step

    // ── Поиск по тексту ──
    if (step === 'search_name' || step === 'search_surname') {
      del(chatId)
      const field = step === 'search_name' ? 'name' : 'surname'
      const { data: found } = await searchParticipants(field, text)

      if (!found || found.length === 0) {
        await send(chatId,
          `❌ По запросу «<b>${esc(text)}</b>» никого не найдено.\n\nПроверь правильность написания.`,
          { reply_markup: mainKb() }
        )
      } else {
        let reply = `✅ Найдено <b>${found.length}</b> участник(ов):\n\n`
        found.forEach(p => {
          const g = p.gender === 'Женский' ? '👩' : '👨'
          reply += `${g} <b>${esc(p.surname)} ${esc(p.name)}</b>\n`
          reply += `   🎽 ${p.role || '—'} · 🌍 ${p.country || '—'}`
          if (p.bmi) reply += ` · 📊 ИМТ: ${p.bmi}`
          reply += '\n\n'
        })
        await send(chatId, reply.trim(), { reply_markup: mainKb() })
      }
      return res.status(200).json({ ok: true })
    }

    // ── Шаги регистрации (текстовые) ──
    if (step === 'email') {
      if (!isEmail(text)) {
        await send(chatId,
          '⚠️ Неверный формат email.\n\nПример: <b>ivan@gmail.com</b>\n\nПопробуй ещё раз:',
          { reply_markup: cancelKb() }
        )
        return res.status(200).json({ ok: true })
      }
      s.data.email = text.toLowerCase()
      s.step = 'name'
      set(chatId, s)
      await send(chatId,
        '✍️ <b>Регистрация</b> — <b>Шаг 2 / 7</b>\n\n' +
        `✅ Email: <b>${esc(s.data.email)}</b>\n\n👤 Введи своё <b>Имя</b>:`,
        { reply_markup: cancelKb() }
      )
      return res.status(200).json({ ok: true })
    }

    if (step === 'name') {
      if (text.length < 2) {
        await send(chatId, '⚠️ Имя слишком короткое. Попробуй ещё раз:', { reply_markup: cancelKb() })
        return res.status(200).json({ ok: true })
      }
      s.data.name = text
      s.step = 'surname'
      set(chatId, s)
      await send(chatId,
        '✍️ <b>Регистрация</b> — <b>Шаг 3 / 7</b>\n\n' +
        `✅ Имя: <b>${esc(text)}</b>\n\n👤 Введи свою <b>Фамилию</b>:`,
        { reply_markup: cancelKb() }
      )
      return res.status(200).json({ ok: true })
    }

    if (step === 'surname') {
      if (text.length < 2) {
        await send(chatId, '⚠️ Фамилия слишком короткая. Попробуй ещё раз:', { reply_markup: cancelKb() })
        return res.status(200).json({ ok: true })
      }
      s.data.surname = text
      s.step = 'dob'
      set(chatId, s)
      await send(chatId,
        '✍️ <b>Регистрация</b> — <b>Шаг 4 / 7</b>\n\n' +
        `✅ Фамилия: <b>${esc(text)}</b>\n\n🎂 Введи <b>дату рождения</b> в формате ДД.ММ.ГГГГ\n<i>Пример: 15.03.1995</i>`,
        { reply_markup: cancelKb() }
      )
      return res.status(200).json({ ok: true })
    }

    if (step === 'dob') {
      const iso = parseDob(text)
      if (!iso) {
        await send(chatId,
          '⚠️ Неверный формат даты.\n\nВведи в формате <b>ДД.ММ.ГГГГ</b>\nПример: <b>15.03.1995</b>',
          { reply_markup: cancelKb() }
        )
        return res.status(200).json({ ok: true })
      }
      s.data.dob    = text
      s.data.dobIso = iso
      s.step = 'gender'
      set(chatId, s)
      await send(chatId,
        '✍️ <b>Регистрация</b> — <b>Шаг 5 / 7</b>\n\n' +
        `✅ Дата рождения: <b>${esc(text)}</b>\n\n⚧ Выбери <b>пол</b>:`,
        { reply_markup: genderKb() }
      )
      return res.status(200).json({ ok: true })
    }

    // Любое другое сообщение во время сессии
    await send(chatId,
      '⚠️ Пожалуйста, ответь на текущий вопрос или нажми «❌ Отмена».',
      { reply_markup: cancelKb() }
    )
    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(200).json({ ok: true })
  }
}
