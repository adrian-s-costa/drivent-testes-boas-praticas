import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import dotenvExpand from "dotenv-expand";

export function loadEnv() {
  const envFiles =
    process.env.NODE_ENV === "test"
      ? [".env.test", ".env"]
      : process.env.NODE_ENV === "development"
        ? [".env.development", ".env"]
        : [".env"];

  const selectedEnvFile = envFiles.find((envFile) => fs.existsSync(path.resolve(envFile)));
  const currentEnvs = dotenv.config({ path: selectedEnvFile ?? ".env" });
  dotenvExpand.expand(currentEnvs);
}
