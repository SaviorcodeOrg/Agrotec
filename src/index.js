import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Loads both env files directly, so this still works when run outside
// Docker Compose (e.g. `node src/index.js` on a bare machine) - Compose's
// `env_file` entries do the same job when running in the container, but
// dotenv is what actually sets process.env when Compose isn't involved.
// Neither call overrides a var that's already set (by Docker or by the
// other call), so Compose's own values always win when both are present.
// src/.env loads first so it wins on any key defined in both, matching
// docker-compose.yml's own stated precedence.
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Dynamic import, not static - a static `import main from "./src/app.js"`
// would fully evaluate app.js's whole dependency graph (including
// supabase.js, which reads process.env.SUPABASE_URL at module load time)
// before any of this file's own top-level code runs, making the
// dotenv.config() calls above too late no matter where they're written.
const { default: main } = await import("./src/app.js");

console.log("KEY:", process.env.NESSIE_KEY);

main();
