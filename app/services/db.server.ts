import { drizzle } from "drizzle-orm/d1";
import * as schema from "../drizzle/schema";

export const getDB = (env: Env) => {
    return drizzle(env.DB, { schema });
};
