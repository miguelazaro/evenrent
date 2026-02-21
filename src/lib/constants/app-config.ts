/**
 * Application configuration constants
 * All configuration values centralized for easy maintenance
 */

export const APP_CONFIG = {
  // Application metadata
  name: 'EvenRent',
  description: 'Sistema de gestión de inventario y rentals para negocios de eventos',
  version: '0.1.0',

  // Localization
  locale: 'es-MX',
  timezone: 'America/Mexico_City',

  // UI Configuration
  ui: {
    sidebar: {
      collapseWidth: 256, // 64 * 4 (from Tailwind w-64)
      collapsedWidth: 80, // for future collapsed state
    },
    pagination: {
      defaultPageSize: 10,
    },
  },

  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    timeout: 30000, // ms
  },

  // Feature flags (for gradual rollout)
  features: {
    analytics: false,
    advancedReporting: false,
    integrations: false,
  },

  // Currencies
  currency: {
    code: 'MXN',
    symbol: '$',
    locale: 'es-MX',
  },
};

// Export individual configs for convenience
export const UI_CONFIG = APP_CONFIG.ui;
export const API_CONFIG = APP_CONFIG.api;
export const FEATURE_FLAGS = APP_CONFIG.features;
export const CURRENCY_CONFIG = APP_CONFIG.currency;
