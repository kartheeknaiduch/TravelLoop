import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import app from "./app";
import { logger } from "./lib/logger";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", ".env"),
  quiet: true,
});

const rawPort = process.env["PORT"] ?? "8080";

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
