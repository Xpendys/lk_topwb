# TOPTOPWB — MVP личного кабинета

## 1) Архитектура и решение

- **Frontend**: React + Vite (SPA), отдельное приложение (рекомендуемый деплой: `app.toptopwb.ru`).
- **Backend**: Node.js + Express, REST API, валидация через Zod.
- **БД**: PostgreSQL + Prisma.
- **Auth**: JWT Access/Refresh в `httpOnly` cookie.
- **Интеграция статистики**: Backend читает Google Sheets через Service Account и отдает только строки текущего пользователя.

### Поток работы
1. Пользователь регистрируется/логинится на фронте.
2. Backend валидирует данные, нормализует телефон, хэширует пароль (bcrypt), сохраняет пользователя.
3. Backend выдает `accessToken` + `refreshToken` в secure `httpOnly` cookies.
4. Защищенные роуты проверяют `accessToken`.
5. Статистика берется только через backend (`/api/stats/buyouts`) и фильтруется по email/phone.

## 2) Структура проекта

```txt
backend/
  prisma/schema.prisma
  src/
    app.js
    server.js
    config/{env.js,prisma.js}
    middleware/{auth.js,error-handler.js}
    routes/{auth.routes.js,user.routes.js,stats.routes.js}
    services/sheets.service.js
    utils/{phone.js,tokens.js}
  .env.example
frontend/
  src/
    api/client.js
    components/ProtectedRoute.jsx
    pages/{RegisterPage.jsx,LoginPage.jsx,CabinetPage.jsx}
    styles/main.css
    App.jsx
    main.jsx
  .env.example
README.md
```

## 3) Схема БД

### `User`
- `id` (cuid, PK)
- `email` (unique)
- `phone` (unique, normalized `+7XXXXXXXXXX`)
- `passwordHash`
- `selectedMarketplaces` (`wb[] | ozon[]`)
- `createdAt`
- `updatedAt`

### `RefreshToken`
- `id`
- `token` (unique)
- `userId` (FK -> User)
- `expiresAt`
- `createdAt`

## 4) API эндпоинты

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`

### User
- `GET /api/user/me` (protected)

### Stats
- `GET /api/stats/buyouts` (protected)

## 5) Логика интеграции с Google Sheets API

1. Backend авторизуется через Service Account (`googleapis`, scope readonly).
2. Читает диапазон `${GOOGLE_SHEETS_SHEET_NAME}!A:ZZ`.
3. Первая строка воспринимается как headers.
4. На лету собирается массив объектов `row`.
5. Фильтрация строк делается по стратегии `SHEETS_MATCH_BY`:
   - `email`
   - `phone`
   - `email_or_phone`
6. Названия ключевых колонок задаются через env:
   - `SHEETS_COLUMN_EMAIL`
   - `SHEETS_COLUMN_PHONE`
   - `SHEETS_COLUMN_MARKETPLACE`

> Предположение для MVP: в таблице есть колонка email и/или phone, где значения совпадают с данными пользователя.

## 6) Backend код

Полный рабочий код находится в `backend/` (см. структуру выше).

## 7) Frontend код

Полный рабочий код находится в `frontend/`:
- Страницы регистрации, входа и ЛК с вкладками реализованы.
- Вкладка «Статистика выкупов» показывает таблицу и фильтр по маркетплейсу.

## 8) .env.example

- `backend/.env.example`
- `frontend/.env.example`

## 9) Prisma schema

- `backend/prisma/schema.prisma`

## 10) Локальный запуск

```bash
# 1) Backend
cd backend
npm install
cp .env.example .env
# заполнить .env
npx prisma generate
npx prisma migrate dev --name init
npm run dev

# 2) Frontend (в другом терминале)
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 11) Что нужно для деплоя

1. PostgreSQL instance.
2. Backend process manager (PM2/systemd) или Docker.
3. Frontend статический деплой (Nginx/Vercel).
4. Reverse proxy + HTTPS (обязательно для secure cookies).
5. Настроенные env переменные и CORS (`FRONTEND_URL`).
6. Service Account с доступом только к нужной таблице.

## 12) Минимальный чек-лист безопасности

- [x] bcrypt хэш пароля
- [x] `httpOnly` cookies для JWT
- [x] rate-limit для auth роутов
- [x] `helmet`
- [x] CORS с whitelist origin
- [x] валидация входных данных через zod
- [x] секреты и ключи только в env
- [x] Google key не передается на фронт

## 13) Что улучшить на следующем этапе

1. Ротация refresh токенов (one-time refresh).
2. CSRF защита (double submit / csrf token).
3. 2FA (SMS/Telegram/email OTP).
4. Вход по телефону + пароль/код.
5. Аудит логов и алерты.
6. RBAC (менеджер/клиент/админ).
7. Кеш и батчинг чтения Google Sheets (или перенос статистики в БД).
8. Тесты (unit/integration/e2e), CI/CD pipeline.
