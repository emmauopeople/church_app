export const config = {
  authApiUrl: import.meta.env.VITE_AUTH_API_URL ?? 'http://localhost:4001',
  churchCoreApiUrl:
    import.meta.env.VITE_CHURCH_CORE_API_URL ?? 'http://localhost:4002',
  documentApiUrl:
    import.meta.env.VITE_DOCUMENT_API_URL ?? 'http://localhost:4003',
  defaultLanguage: import.meta.env.VITE_DEFAULT_LANGUAGE ?? 'fr',
} as const;
