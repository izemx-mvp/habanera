// Client API minimal — ping de santé du serveur Express (build Docker).
export interface ApiStatus {
  ok: boolean
  app: string
}

export const api = {
  status: () => fetch('/api/status').then((r) => r.json() as Promise<ApiStatus>),
}
