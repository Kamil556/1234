# Marathon Skills 2026 — Next.js + Supabase + Vercel

Полноценное веб-приложение на Next.js с Google OAuth, Supabase (PostgreSQL) и деплоем на Vercel.

---

## Стек

| Компонент       | Технология                          |
|----------------|-------------------------------------|
| Фреймворк      | **Next.js 14** (Pages Router)       |
| Аутентификация | **NextAuth.js v4** + Google OAuth   |
| База данных    | **Supabase** (PostgreSQL + RLS)     |
| API            | **Vercel Serverless Functions**     |
| Стили          | CSS Modules + глобальный CSS        |
| Деплой         | **Vercel**                          |

---

## Быстрый старт (локально)

### 1. Клонируйте / распакуйте проект

```bash
npm install
```

### 2. Supabase — создайте таблицу

1. Зайдите на [supabase.com](https://supabase.com) → создайте проект
2. **SQL Editor** → вставьте содержимое `supabase-schema.sql` → **Run**
3. В **Project Settings → API** скопируйте:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** → `SUPABASE_SERVICE_ROLE_KEY`

### 3. Google OAuth — получите ключи

1. Откройте [console.cloud.google.com](https://console.cloud.google.com/)
2. Создайте проект (или выберите существующий)
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Тип: **Web application**
5. Добавьте **Authorized redirect URIs**:
   - `http://localhost:3000/api/auth/callback/google` ← для локальной разработки
   - `https://YOUR-PROJECT.vercel.app/api/auth/callback/google` ← для продакшна (добавить после деплоя)
6. Скопируйте **Client ID** и **Client Secret**

> ⚠️ Если ваш проект в статусе "Testing" — добавьте свой email в **OAuth consent screen → Test users**

### 4. Создайте `.env.local`

```bash
cp .env.local.example .env.local
```

Заполните:

```env
GOOGLE_CLIENT_ID=ваш_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=ваш_client_secret

# Генерация: openssl rand -base64 32
NEXTAUTH_SECRET=случайная_строка_32_символа
NEXTAUTH_URL=http://localhost:3000

NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 5. Запуск

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000)

---

## Деплой на Vercel

### Шаг 1 — Загрузите код на GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/ВАШ_USERNAME/marathon-skills.git
git push -u origin main
```

### Шаг 2 — Импортируйте проект в Vercel

1. Зайдите на [vercel.com](https://vercel.com) → **Add New Project**
2. Импортируйте ваш GitHub репозиторий
3. В разделе **Environment Variables** добавьте все переменные из `.env.local`:

| Переменная | Значение |
|---|---|
| `GOOGLE_CLIENT_ID` | ваш Client ID |
| `GOOGLE_CLIENT_SECRET` | ваш Client Secret |
| `NEXTAUTH_SECRET` | ваш секрет (32 символа) |
| `NEXT_PUBLIC_SUPABASE_URL` | URL Supabase проекта |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon ключ |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role ключ |

> ⚠️ `NEXTAUTH_URL` на Vercel **НЕ НУЖЕН** — Vercel выставляет его автоматически.  
> На локальной разработке он нужен: `http://localhost:3000`

4. Нажмите **Deploy**

### Шаг 3 — Обновите Google OAuth redirect URI

После деплоя вы получите URL вида `https://marathon-skills-xxx.vercel.app`.

Вернитесь в [Google Console](https://console.cloud.google.com/) → **Credentials** → ваш OAuth клиент → добавьте:
```
https://marathon-skills-xxx.vercel.app/api/auth/callback/google
```

---

## Первый Координатор

После первого входа зарегистрируйтесь как участник, затем в Supabase → **Table Editor → participants** измените свою роль вручную:

```sql
UPDATE participants SET role = 'Координатор' WHERE email = 'ваш@email.com';
```

---

## Структура проекта

```
marathon-skills/
├── pages/
│   ├── api/
│   │   ├── auth/[...nextauth].ts   # NextAuth — Google OAuth
│   │   ├── participants/
│   │   │   ├── index.ts            # GET список / POST регистрация
│   │   │   └── me.ts               # GET/PATCH текущего пользователя
│   │   └── admin/
│   │       ├── [id].ts             # PUT / DELETE (только Координаторы)
│   │       └── stats.ts            # GET статистика (только Координаторы)
│   ├── index.tsx                   # Главная (защищённая)
│   ├── login.tsx                   # Страница входа
│   ├── register.tsx                # Регистрация участника
│   ├── bmi.tsx                     # BMI калькулятор
│   ├── participants.tsx            # Список участников
│   └── admin.tsx                   # Панель администратора
├── components/
│   ├── Header.tsx                  # Шапка с именем/фото пользователя
│   ├── CountdownBar.tsx            # Таймер обратного отсчёта
│   └── withAuth.tsx                # HOC защиты маршрутов
├── lib/
│   ├── supabase.ts                 # Supabase Admin клиент
│   └── auth.ts                     # Вспомогательные функции auth
├── styles/
│   └── globals.css
├── supabase-schema.sql             # SQL для создания таблицы
└── .env.local.example              # Шаблон переменных
```

---

## Роли

| Роль         | Возможности |
|---|---|
| Бегун        | Просмотр информации, регистрация, BMI-калькулятор, список участников |
| Координатор  | Всё выше + Панель администратора: редактирование, блокировка, удаление |

---

## Безопасность

- Все маршруты (кроме `/login`) защищены через `withAuth` HOC
- Все API-routes проверяют сессию через `getServerSession`
- Supabase запросы идут только через **service_role** ключ (сервер)
- `SUPABASE_SERVICE_ROLE_KEY` не имеет префикса `NEXT_PUBLIC_` — клиент его не видит
- RLS в Supabase блокирует прямой доступ клиентов к таблице
