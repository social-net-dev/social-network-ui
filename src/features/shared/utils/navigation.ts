export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  PROFILE: '/profile',
  PROFILE_ID: (id: string) => `/profile/${id}`,
  MESSAGES: '/messages',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
} as const

export type Route = typeof ROUTES[keyof typeof ROUTES]
