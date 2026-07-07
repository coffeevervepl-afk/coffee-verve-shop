# Короткий отчёт

Дата: 2026-07-07
Проект: coffee-verve-shop

## Что сделано

1. Личный кабинет
- Добавлены страницы: login, register, profile, orders, order details, addresses.
- Добавлены API для orders и addresses.
- Добавлена защита account-страниц через layout.

2. Header + i18n + checkout account logic
- Иконка аккаунта в header исправлена:
  - гость -> /:locale/account/login
  - авторизованный -> /:locale/account
- Починены переводы account.* (ru/pl/ua), чтобы не отображались ключи.
- Checkout:
  - Сценарий A: для авторизованного скрыт register-блок, автозаполнение полей, бейдж скидки.
  - Сценарий B: проверка email через /api/account/check-email, баннер «войти и получить скидку», модалка входа.
  - Сценарий C: пароль (min 6), автосоздание аккаунта после paid через webhook + console.log-письмо.

3. Сброс пароля
- Добавлена ссылка «Забыл пароль?» на login.
- Добавлены страницы:
  - /:locale/account/forgot-password
  - /:locale/account/reset-password
- Реализованы вызовы:
  - resetPasswordForEmail(...)
  - updateUser({ password })
- После успешного reset: редирект в account и сообщение об успехе.

4. CRM trigger migration
- Добавлена миграция:
  - supabase/migrations/20260707_shop_user_crm_trigger.sql
- Реализован trigger/функция для sync shop_users -> clients и заполнения crm_client_id.

## Статус миграции
- SQL-файл создан и запушен в репозиторий.
- Применение из текущей среды не выполнено (нет supabase CLI/psql и DB URL env).

## Git статус
- Коммит: bd94680
  - feat: account pages, profile, addresses, orders, CRM trigger
- Коммит: 6462afd
  - fix: header account link + i18n register + checkout account logic
- Коммит: 234f610
  - feat: forgot password + CRM trigger on registration
- Push: успешно, origin/main обновлён.

## Файл для копирования
- SHORT_REPORT.md
