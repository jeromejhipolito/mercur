export const queryKeysFactory = (key: string) => ({
  all: [key] as const,
  lists: () => [key, "list"] as const,
  list: (query?: any) => [key, "list", query] as const,
  details: () => [key, "detail"] as const,
  detail: (id: string) => [key, "detail", id] as const,
})
