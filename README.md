# Mecenate Feed

Тестовое задание для Mecenate: экран ленты публикаций на `React Native + Expo + TypeScript` c `MobX`, `React Query` и дизайн-токенами.

## Что реализовано

- лента публикаций с аватаром автора, именем, обложкой, превью текста, лайками и комментариями
- курсорная пагинация через `useInfiniteQuery`
- `pull-to-refresh`
- заглушка для закрытых постов `tier: "paid"`
- состояния `loading`, `empty`, `error`
- фильтр `Все / Бесплатные / Платные` через `MobX`
- запуск в `Expo Go`

## Стек

- `Expo SDK 54`
- `TypeScript`
- `MobX`
- `@tanstack/react-query`
- `expo-image`, `expo-linear-gradient`, `expo-blur`

## Запуск

Поддерживается `Node.js 18+`.

```bash
npm install
cp .env.example .env
npm run start
```

Для запуска на устройствах:

```bash
npm run ios
npm run android
```

## Переменные окружения

Все переменные публичные, потому что это клиент Expo:

- `EXPO_PUBLIC_API_BASE_URL` — базовый URL API
- `EXPO_PUBLIC_API_TOKEN` — `Bearer`-токен в формате UUID
- `EXPO_PUBLIC_FEED_SIMULATE_ERROR` — `true/false`, включает серверную ошибку для проверки экрана ошибки

## Проверка

```bash
npm run check
```

## Архитектура

```text
src/
  core/
    providers/        # QueryClient + SafeArea + store providers
    stores/           # root store context
  features/feed/
    api/              # типы и запросы к feed API
    hooks/            # React Query hooks
    model/            # MobX store фильтра ленты
    ui/               # экран и компоненты ленты
  shared/
    components/       # переиспользуемые UI-элементы
    lib/              # форматтеры
    theme/            # дизайн-токены
    types/            # глобальные типы окружения
```
