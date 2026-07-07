import fs from "fs";
import path from "path";
import { loadEnv } from "@/config";

describe("loadEnv", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.POSTGRES_USERNAME;
    delete process.env.POSTGRES_PASSWORD;
    delete process.env.POSTGRES_HOST;
    delete process.env.POSTGRES_PORT;
    delete process.env.POSTGRES_DATABASE;
    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("loads the base .env file when .env.test is not present", () => {
    const envTestPath = path.resolve(".env.test");
    const envTestBackup = fs.existsSync(envTestPath) ? fs.readFileSync(envTestPath, "utf8") : null;

    if (fs.existsSync(envTestPath)) {
      fs.unlinkSync(envTestPath);
    }

    process.env.NODE_ENV = "test";
    loadEnv();

    expect(process.env.POSTGRES_USERNAME).toBe("postgres");
    expect(process.env.POSTGRES_PASSWORD).toBe("top_secret");

    if (envTestBackup) {
      fs.writeFileSync(envTestPath, envTestBackup);
    }
  });
});
