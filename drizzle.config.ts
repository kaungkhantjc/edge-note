import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./app/drizzle/schema.ts",
    out: "./migrations",
    dialect: "sqlite",
});
