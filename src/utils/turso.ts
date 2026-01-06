import { createClient } from "@libsql/client/web";
import { type Row } from "@libsql/client";

export const turso = (
  config = {
    url: import.meta.env.TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL,
    authToken: import.meta.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
  },
) => createClient(config);

export type Link = Row & {
  id: number;
  date: string;
  url: string;
  tags: string;
  type: string;
  title: string;
  comment: string;
};
