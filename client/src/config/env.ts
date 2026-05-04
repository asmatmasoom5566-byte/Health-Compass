// Environment configuration for Netlify deployment
// This file provides access to environment variables

interface EnvConfig {
  apiKey: string;
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

// Function to get environment variables
// In Netlify, environment variables are injected at build time
export const getEnvConfig = (): EnvConfig => {
  // Check if we're in browser environment
  const isBrowser = typeof window !== 'undefined';
  
  // For Netlify deployment, use import.meta.env (Vite environment variables)
  // These are replaced at build time with actual values from Netlify environment
  const config: EnvConfig = {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
    apiBaseUrl: import.meta.env.VITE_OPENAI_BASE_URL || 'https://api.openai.com/v1',
    isDevelopment: import.meta.env.DEV || false,
    isProduction: import.meta.env.PROD || false,
  };

  return config;
};

// Export individual environment variables for convenience
export const ENV = {
  get OPENAI_API_KEY() {
    return getEnvConfig().apiKey;
  },
  get OPENAI_BASE_URL() {
    return getEnvConfig().apiBaseUrl;
  },
  get IS_DEVELOPMENT() {
    return getEnvConfig().isDevelopment;
  },
  get IS_PRODUCTION() {
    return getEnvConfig().isProduction;
  },
};

// Default export
export default ENV;
