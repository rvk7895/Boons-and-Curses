import { buildServer } from "./server.js";
import { loadEnv } from "./env.js";

async function main(): Promise<void> {
  const env = loadEnv();
  const app = await buildServer({ env });
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info(`Boons & Curses server listening on ${env.HOST}:${env.PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
