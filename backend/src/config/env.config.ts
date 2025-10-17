import dotenv from 'dotenv';

dotenv.config();

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  FRONTEND_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  OPENAI_API_KEY: string;
  LANGFUSE_SECRET_KEY: string;
  LANGFUSE_PUBLIC_KEY: string;
  LANGFUSE_HOST: string;
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key] || defaultValue;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const env: EnvConfig = {
  NODE_ENV: getEnvVar('NODE_ENV', 'development'),
  PORT: parseInt(getEnvVar('PORT', '4000'), 10), // Fixed: Match actual backend port
  FRONTEND_URL: getEnvVar('FRONTEND_URL', 'http://localhost:3000'), // Fixed: Match Vite default port
  SUPABASE_URL: getEnvVar('SUPABASE_URL'),
  SUPABASE_ANON_KEY: getEnvVar('SUPABASE_ANON_KEY'),
  SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
  OPENAI_API_KEY: getEnvVar('OPENAI_API_KEY'),
  LANGFUSE_SECRET_KEY: getEnvVar('LANGFUSE_SECRET_KEY'),
  LANGFUSE_PUBLIC_KEY: getEnvVar('LANGFUSE_PUBLIC_KEY'),
  LANGFUSE_HOST: getEnvVar('LANGFUSE_HOST', 'https://cloud.langfuse.com'),
};

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
