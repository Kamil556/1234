import { getSupabaseAdmin } from '../../lib/supabase'

export const config = {
  api: { bodyParser: true },
}

const TOKEN = process.env.TELEGRAM_BOT_TOKEN
const SITE_URL = process.env.NEXTAUTH_URL || 'https://1234-one-self.vercel.app'

// ─── Telegram helpers ────────────────────────────────────────
async function sendMessage(chatId, text, extra = {}) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra }),
  })
}

async function editMessage(chatId, messageId, text, extra = {}) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/editMessageText`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId, text, parse_mode: 'HTML', ...extra }),
  })
}

function html(str) {
  if (!str) return '—'
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ─── Keyboards ───────────────────────────────────────────────
function mainKeyboard() {
  return {
    inline_keyboard: [
      [{ text: '✍️ Зарегистрироваться', callback_data: 'reg_start' }],
      [
        { text: '🔍 Найти по имени',    callback_data: 'search_name'    },
        { text: '🔍 Найти по фамилии',  callback_data: 'search_surname' },
      ],
      [
        { text: '📋 Как зарегистрироваться?', callback_data: 'howto' },
        { text: '❓ Что такое марафон?',       callback_data: 'about' },
      ],
      [{ text: '🌐 Открыть сайт', url: SITE_URL }],
    ],
  }
}

function genderKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '👨 Мужской',  callback_data: 'reg_gender_Мужской'  },
        { text: '👩 Женский',  callback_data: 'reg_gender_Женский'  },
      ],
      [{ text: '❌ Отмена', callback_data: 'reg_cancel' }],
    ],
  }
}

function roleKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '🏃 Бегун',         callback_data: 'reg_role_Бегун'         },
        { text: '📋 Координатор',   callback_data: 'reg_role_Координатор'   },
      ],
      [{ text: '❌ Отмена', callback_data: 'reg_cancel' }],
    ],
  }
}

function confirmKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '✅ Подтвердить',    callback_data: 'reg_confirm' },
        { text: '✏️ Изменить',       callback_data: 'reg_start'   },
      ],
      [{ text: '❌ Отмена',          callback_data: 'reg_cancel'  }],
    ],
  }
}

const COUNTRIES = [
  'Казахстан','Россия','США','Германия','Франция','Великобритания',
  'Китай','Япония','Бразилия','Канада','Австралия','Индия',
  'Узбекистан','Кыргызстан','Азербайджан','Грузия','Украина','Беларусь','Другая страна',
]
function countryKeyboard() {
  const rows = []
  for (let i = 0; i < COUNTRIES.length; i += 2) {
    const row = [{ text: COUNTRIES[i], callback_data: `reg_country_${COUNTRIES[i]}` }]
    if (COUNTRIES[i + 1]) row.push({ text: COUNTRIES[i + 1], callback_data: `reg_country_${COUNTRIES[i + 1]}` })
    rows.push(row)
  }
  rows.push([{ text: '❌ Отмена', callback_data: 'reg_cancel' }])
  return { inline_keyboard: rows }
}

// ─── Session store (in-memory, достаточно для serverless) ─────
// Структура: sessions[chatId] = { step, data: {...} }
const sessions = {}

function getSession(chatId) {
  return sessions[chatId] || null
}
function setSession(chatId, val) {
  sessions[chatId] = val
}
function clearSession(chatId) {
  delete sessions[chatId]
}

// ─── Registration steps ──────────────────────────────────────
const STEPS = ['email', 'name', 'surname', 'dob', 'gender', 'role', 'country']

const STEP_PROMPTS = {
  email:   '📧 Введи свой <b>Email</b> адрес:',
  name:    '👤 Введи своё <b>Имя</b>:',
  surname: '👤 Введи свою <b>Фамилию</b>:',
  dob:     '🎂 Введи дату рождения в формате <b>ДД.ММ.ГГГГ</b>\n<i>Пример: 15.03.1995</i>',
  gender:  '⚧ Выбери <b>пол</b>:',
  role:    '🎽 Выбери <b>роль</b> на марафоне:',
  country: '🌍 Выбери свою <b>страну</b>:',
}

function summaryText(d) {
  return (
    '📋 <b>Проверь данные перед регистрацией:</b>\n\n' +
    `📧 Email: <b>${html(d.email)}</b>\n` +
    `👤 Имя: <b>${html(d.name)} ${html(d.surname)}</b>\n` +
    `🎂 Дата рождения: <b>${html(d.dob)}</b>\n` +
    `⚧ Пол: <b>${html(d.gender)}</b>\n` +
    `🎽 Роль: <b>${html(d.role)}</b>\n` +
    `🌍 Страна: <b>${html(d.country)}</b>\n\n` +
    'Всё верно?'
  )
}

// Validate email
function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)
}
// Validate & convert dob DD.MM.YYYY → YYYY-MM-DD
function parseDob(str) {
  const m = str.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!m) return null
  const [, d, mo, y] = m
  const date = new Date(`${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`)
  if (isNaN(date.getTime())) return null
  return `${y}-${mo.padStart(2,'0')}-${d.padStart(2,'0')}`
}

// ─── Main handler ─────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true })

  try {
    const { message, callback_query } = req.body || {}

    // ── Callback query (inline buttons) ──────────────────────
    if (callback_query) {
      const chatId = callback_query.message.chat.id
      const msgId  = callback_query.message.message_id
      const data   = callback_query.data

      // Acknowledge
      await fetch(`https://api.telegram.org/bot${TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: callback_query.id }),
      })

      // Cancel
      if (data === 'reg_cancel') {
        clearSession(chatId)
        await editMessage(chatId, msgId, '❌ Регистрация отменена.\n\nВыбери действие:', mainKeyboard())
        return res.status(200).json({ ok: true })
      }

      // Start registration
      if (data === 'reg_start') {
        setSession(chatId, { step: 'email', data: {} })
        await editMessage(chatId, msgId, '✍️ <b>Регистрация на марафон</b>\n\nШаг 1 из 7\n\n' + STEP_PROMPTS.email, {
          reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'reg_cancel' }]] }
        })
        return res.status(200).json({ ok: true })
      }

      // Gender select
      if (data.startsWith('reg_gender_')) {
        const gender = data.replace('reg_gender_', '')
        const s = getSession(chatId)
        if (!s) return res.status(200).json({ ok: true })
        s.data.gender = gender
        s.step = 'role'
        setSession(chatId, s)
        await editMessage(chatId, msgId,
          `✍️ <b>Регистрация</b> · Шаг 6 из 7\n\n✅ Пол: <b>${gender}</b>\n\n` + STEP_PROMPTS.role,
          { reply_markup: roleKeyboard() }
        )
        return res.status(200).json({ ok: true })
      }

      // Role select
      if (data.startsWith('reg_role_')) {
        const role = data.replace('reg_role_', '')
        const s = getSession(chatId)
        if (!s) return res.status(200).json({ ok: true })
        s.data.role = role
        s.step = 'country'
        setSession(chatId, s)
        await editMessage(chatId, msgId,
          `✍️ <b>Регистрация</b> · Шаг 7 из 7\n\n✅ Роль: <b>${role}</b>\n\n` + STEP_PROMPTS.country,
          { reply_markup: countryKeyboard() }
        )
        return res.status(200).json({ ok: true })
      }

      // Country select
      if (data.startsWith('reg_country_')) {
        const country = data.replace('reg_country_', '')
        const s = getSession(chatId)
        if (!s) return res.status(200).json({ ok: true })
        s.data.country = country
        s.step = 'confirm'
        setSession(chatId, s)
        await editMessage(chatId, msgId,
          summaryText(s.data),
          { reply_markup: confirmKeyboard() }
        )
        return res.status(200).json({ ok: true })
      }

      // Confirm — save to DB
      if (data === 'reg_confirm') {
        const s = getSession(chatId)
        if (!s || !s.data.email) {
          await editMessage(chatId, msgId, '❌ Сессия истекла. Начни заново.', mainKeyboard())
          return res.status(200).json({ ok: true })
        }
        const d = s.data
        try {
          const db = getSupabaseAdmin()

          // Check duplicate email
          const { data: existing } = await db
            .from('participants')
            .select('id')
            .eq('email', d.email)
            .single()

          if (existing) {
            clearSession(chatId)
            await editMessage(chatId, msgId,
              `⚠️ Участник с email <b>${html(d.email)}</b> уже зарегистрирован.\n\nЕсли это ошибка — обратись на сайт.`,
              mainKeyboard()
            )
            return res.status(200).json({ ok: true })
          }

          const { error } = await db.from('participants').insert({
            owner_id: `tg_${chatId}`,
            email:    d.email,
            name:     d.name,
            surname:  d.surname,
            gender:   d.gender,
            role:     d.role,
            country:  d.country,
            dob:      d.dobIso || null,
          })

          if (error) throw error

          clearSession(chatId)
          await editMessage(chatId, msgId,
            '🎉 <b>Регистрация успешна!</b>\n\n' +
            `✅ <b>${html(d.name)} ${html(d.surname)}</b> зарегистрирован(а) как <b>${html(d.role)}</b>\n\n` +
            `📅 Марафон: <b>15 июня 2026</b> · Алматы\n` +
            `📍 Дистанция: <b>42.195 км</b>\n\n` +
            `🌐 Следи за участниками на сайте: ${SITE_URL}`,
            mainKeyboard()
          )
        } catch (err) {
          console.error('DB error:', err)
          clearSession(chatId)
          await editMessage(chatId, msgId, '❌ Ошибка сохранения. Попробуй позже.', mainKeyboard())
        }
        return res.status(200).json({ ok: true })
      }

      // Search buttons
      if (data === 'search_name') {
        setSession(chatId, { step: 'search_name' })
        await editMessage(chatId, msgId, '🔍 Введи <b>имя</b> участника:', {
          reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'reg_cancel' }]] }
        })
        return res.status(200).json({ ok: true })
      }
      if (data === 'search_surname') {
        setSession(chatId, { step: 'search_surname' })
        await editMessage(chatId, msgId, '🔍 Введи <b>фамилию</b> участника:', {
          reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'reg_cancel' }]] }
        })
        return res.status(200).json({ ok: true })
      }

      // How-to
      if (data === 'howto') {
        await editMessage(chatId, msgId,
          '📋 <b>Способы регистрации:</b>\n\n' +
          '1️⃣ <b>Через этого бота</b> — нажми кнопку «✍️ Зарегистрироваться» и следуй шагам\n\n' +
          '2️⃣ <b>Через сайт</b>:\n' +
          `   • Зайди на ${SITE_URL}\n` +
          '   • Войди через Google\n' +
          '   • Нажми «+ Регистрация»\n' +
          '   • Заполни форму\n\n' +
          '<i>Марафон · 15 июня 2026 · Алматы · 42.195 км</i>',
          mainKeyboard()
        )
        return res.status(200).json({ ok: true })
      }

      // About
      if (data === 'about') {
        await editMessage(chatId, msgId,
          '🏅 <b>Marathon Skills 2026</b>\n\n' +
          'Марафон — забег на дистанцию <b>42,195 км</b>.\n\n' +
          '📅 Дата: <b>15 июня 2026</b>\n' +
          '📍 Место: <b>Алматы, Казахстан</b>\n' +
          '🕘 Старт: <b>09:00</b>\n\n' +
          '<b>Роли участников:</b>\n' +
          '🏃 <b>Бегун</b> — участвует в забеге\n' +
          '📋 <b>Координатор</b> — организует и помогает\n\n' +
          'Регистрируйся прямо здесь или на сайте!',
          mainKeyboard()
        )
        return res.status(200).json({ ok: true })
      }

      return res.status(200).json({ ok: true })
    }

    // ── Text message ──────────────────────────────────────────
    if (!message?.text) return res.status(200).json({ ok: true })

    const chatId = message.chat.id
    const text   = message.text.trim()
    const s      = getSession(chatId)

    // /start или /help
    if (text === '/start' || text === '/help') {
      clearSession(chatId)
      const userName = message.from?.first_name || 'участник'
      await sendMessage(chatId,
        `👋 Привет, <b>${html(userName)}</b>!\n\n` +
        '🏃 <b>Marathon Skills 2026</b>\n' +
        '📅 15 июня 2026 · Алматы · 42.195 км\n\n' +
        'Я помогу тебе зарегистрироваться на марафон или найти участника. Выбери действие:',
        { reply_markup: mainKeyboard() }
      )
      return res.status(200).json({ ok: true })
    }

    // Если нет активной сессии — показываем меню
    if (!s) {
      await sendMessage(chatId,
        '👋 Выбери действие:',
        { reply_markup: mainKeyboard() }
      )
      return res.status(200).json({ ok: true })
    }

    // ── Registration flow ─────────────────────────────────────
    const step = s.step

    // Search steps
    if (step === 'search_name' || step === 'search_surname') {
      clearSession(chatId)
      const field = step === 'search_name' ? 'name' : 'surname'
      const db = getSupabaseAdmin()
      const { data: found } = await db
        .from('participants')
        .select('name, surname, role, country, bmi, gender')
        .ilike(field, `%${text}%`)
        .limit(6)

      if (!found || found.length === 0) {
        await sendMessage(chatId,
          `❌ По запросу «<b>${html(text)}</b>» никого не найдено.\n\nПроверь правильность написания.`,
          { reply_markup: mainKeyboard() }
        )
      } else {
        let reply = `✅ Найдено: <b>${found.length}</b> участник(ов)\n\n`
        found.forEach(p => {
          const g = p.gender === 'Женский' ? '👩' : '👨'
          reply += `${g} <b>${html(p.surname)} ${html(p.name)}</b>\n`
          reply += `   🎽 ${p.role || '—'} · 🌍 ${p.country || '—'}`
          if (p.bmi) reply += ` · 📊 ИМТ: ${p.bmi}`
          reply += '\n\n'
        })
        await sendMessage(chatId, reply.trim(), { reply_markup: mainKeyboard() })
      }
      return res.status(200).json({ ok: true })
    }

    // Registration text steps
    if (step === 'email') {
      if (!isEmail(text)) {
        await sendMessage(chatId,
          '⚠️ Неверный формат email.\n\nПример: <b>ivan@gmail.com</b>\n\nПопробуй ещё раз:',
          { reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'reg_cancel' }]] } }
        )
        return res.status(200).json({ ok: true })
      }
      s.data.email = text.toLowerCase()
      s.step = 'name'
      setSession(chatId, s)
      await sendMessage(chatId,
        '✍️ <b>Регистрация</b> · Шаг 2 из 7\n\n✅ Email принят\n\n' + STEP_PROMPTS.name,
        { reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'reg_cancel' }]] } }
      )
      return res.status(200).json({ ok: true })
    }

    if (step === 'name') {
      if (text.length < 2) {
        await sendMessage(chatId, '⚠️ Имя слишком короткое. Попробуй ещё раз:',
          { reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'reg_cancel' }]] } }
        )
        return res.status(200).json({ ok: true })
      }
      s.data.name = text
      s.step = 'surname'
      setSession(chatId, s)
      await sendMessage(chatId,
        '✍️ <b>Регистрация</b> · Шаг 3 из 7\n\n✅ Имя: <b>' + html(text) + '</b>\n\n' + STEP_PROMPTS.surname,
        { reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'reg_cancel' }]] } }
      )
      return res.status(200).json({ ok: true })
    }

    if (step === 'surname') {
      if (text.length < 2) {
        await sendMessage(chatId, '⚠️ Фамилия слишком короткая. Попробуй ещё раз:',
          { reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'reg_cancel' }]] } }
        )
        return res.status(200).json({ ok: true })
      }
      s.data.surname = text
      s.step = 'dob'
      setSession(chatId, s)
      await sendMessage(chatId,
        '✍️ <b>Регистрация</b> · Шаг 4 из 7\n\n✅ Фамилия: <b>' + html(text) + '</b>\n\n' + STEP_PROMPTS.dob,
        { reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'reg_cancel' }]] } }
      )
      return res.status(200).json({ ok: true })
    }

    if (step === 'dob') {
      const iso = parseDob(text)
      if (!iso) {
        await sendMessage(chatId,
          '⚠️ Неверный формат даты.\n\nВведи в формате <b>ДД.ММ.ГГГГ</b>\nПример: <b>15.03.1995</b>',
          { reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'reg_cancel' }]] } }
        )
        return res.status(200).json({ ok: true })
      }
      s.data.dob    = text
      s.data.dobIso = iso
      s.step = 'gender'
      setSession(chatId, s)
      await sendMessage(chatId,
        '✍️ <b>Регистрация</b> · Шаг 5 из 7\n\n✅ Дата рождения: <b>' + html(text) + '</b>\n\n' + STEP_PROMPTS.gender,
        { reply_markup: genderKeyboard() }
      )
      return res.status(200).json({ ok: true })
    }

    // Любое другое сообщение во время сессии
    await sendMessage(chatId,
      '⚠️ Пожалуйста, ответь на текущий вопрос или нажми «❌ Отмена».',
      { reply_markup: { inline_keyboard: [[{ text: '❌ Отмена', callback_data: 'reg_cancel' }]] } }
    )
    return res.status(200).json({ ok: true })

  } catch (err) {
    console.error('Webhook error:', err)
    return res.status(200).json({ ok: true })
  }
}
