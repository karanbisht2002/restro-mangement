import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { existsSync, readFileSync } from "node:fs";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useHttps = env.VITE_HTTPS === "true";
  const sslKeyPath = env.VITE_SSL_KEY_PATH ?? "./certs/localhost-key.pem";
  const sslCertPath = env.VITE_SSL_CERT_PATH ?? "./certs/localhost.pem";
  const hasCertificates = existsSync(sslKeyPath) && existsSync(sslCertPath);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: 5173,
      https:
        useHttps && hasCertificates
          ? { key: readFileSync(sslKeyPath), cert: readFileSync(sslCertPath) }
          : undefined,
      proxy: {
        "/api": env.VITE_API_URL ?? "http://localhost:4000",
      },
    },
  };
});
