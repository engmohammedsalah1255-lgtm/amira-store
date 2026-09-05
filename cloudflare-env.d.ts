declare module 'cloudflare:workers' {
  export const env: {
    DATABASE_URL?: string;
    JWT_SECRET?: string;
    [key: string]: unknown;
  };
}
