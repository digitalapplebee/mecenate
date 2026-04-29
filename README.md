# Mecenate Feed

Expo + React Native тестовое: лента публикаций, экран поста и комментарии.

## Быстрый просмотр

- Лента: пагинация, pull-to-refresh, фильтр `Все / Бесплатные / Платные`, paid-заглушка.
- Пост: optimistic like, сортировка/ленивая подгрузка/отправка комментариев.
- Realtime: WebSocket обновляет лайки и новые комментарии.
- UI-состояния: loading, empty, error, стабильные счетчики, haptic только на действия.

## Запуск

```bash
npm install
cp .env.example .env
npm run start
```

Для проверки типов:

```bash
npm run typecheck
```

## Где смотреть

```text
src/features/feed/api/     запросы и типы API
src/features/feed/hooks/   React Query хуки
src/features/feed/model/   кэш ленты/поста/комментариев
src/features/feed/ui/      экраны и карточки
src/shared/theme/          цвета, отступы, типографика
```

Переменные окружения лежат в `.env.example`; по умолчанию приложение использует тестовый API Mecenate.
