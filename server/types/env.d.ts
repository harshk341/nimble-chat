declare namespace NodeJS {
  interface ProcessEnv {
    MONGODB_ATLAS_URI: string;
    PORT: number;
    JWT_SECRET: string;
    JWT_ExpiresIn: string;
  }
}
