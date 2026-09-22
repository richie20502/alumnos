import { createApp } from "./app";
import { createDatabase } from "./db/database";
import { config } from "./config/env";

const db = createDatabase(config.dbPath);
const app = createApp(db);

app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`API de estudiantes escuchando en http://localhost:${config.port}`);
});
