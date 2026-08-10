const environment = import.meta.env ?? {}

export const SANITY_PROJECT_ID =
  environment.VITE_SANITY_PROJECT_ID || '43dsdcuf'
export const SANITY_DATASET =
  environment.VITE_SANITY_DATASET || 'production'
export const SANITY_API_VERSION =
  environment.VITE_SANITY_API_VERSION || '2026-08-01'
