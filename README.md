# Marathon Skills 2026

## Деплой на Vercel — пошаговая инструкция

### 1. Загрузи проект на GitHub
Создай новый репозиторий на github.com и загрузи все файлы.

### 2. Подключи к Vercel
- Зайди на vercel.com → New Project → Import Git Repository
- Выбери свой репозиторий

### 3. Настройки Build (очень важно!)
В разделе **Configure Project** установи:
```
Framework Preset:  Next.js        ← обязательно!
Build Command:     npm run build
Output Directory:  .next
Install Command:   npm install
```

### 4. Переменные окружения (Environment Variables)
Добавь все переменные из `.env.example`:

| Переменная | Где взять |
|---|---|
| `NEXTAUTH_URL` | URL твоего Vercel-сайта, напр. `https://myapp.vercel.app` |
| `NEXTAUTH_SECRET` | Любая случайная строка (можно сгенерировать: `openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | console.cloud.google.com → Credentials → OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | Там же |
| `NEXT_PUBLIC_SUPABASE_URL` | supabase.com → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Там же |
| `TELEGRAM_BOT_TOKEN` | @BotFather в Telegram (опционально) |

### 5. После деплоя — настрой Google OAuth
В Google Console добавь Authorized redirect URI:
```
https://YOUR_DOMAIN.vercel.app/api/auth/callback/google
```

### Структура проекта
```
pages/
  index.js          — главная страница + все компоненты
  login.js          — страница входа
  _app.js           — корень приложения
  api/
    auth/[...nextauth].js   — Google OAuth
    participants/
      index.js      — GET список / POST создать
      [id].js       — PUT обновить / DELETE удалить
    telegram-webhook.js     — Telegram бот
lib/
  supabase.js       — клиент Supabase
styles/
  globals.css       — глобальные стили
```
