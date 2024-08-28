import { installDeps } from "@/src/utils/package-management"
import { readFileContent } from "@/src/utils/file-fetching"
import { injectInner, merge } from "@/src/utils/file-transforms"
import { injectFile } from "@/src/utils/file-injection"

export async function patchNextAuthDrizzleTurso() {
  await installDeps(["@auth/drizzle-adapter"])

  const authFile = "src/lib/auth.ts"
  let authContent = await readFileContent(authFile)

  authContent = merge(authImports, authContent)
  authContent = injectInner({
    direction: "above",
    fileContent: authContent,
    insertContent: drizzleAdapter,
    insertPoint: "providers:",
  })
  await injectFile({
    filePath: authFile,
    fileContent: authContent,
    successColor: "yellow",
  })

  const schemaFile = "src/db/schema.ts"
  let localSchema = await readFileContent(schemaFile)

  localSchema = merge(localSchema, "\n\n// =====NEW CONTENT=====", schema)
  await injectFile({
    filePath: schemaFile,
    fileContent: localSchema,
    successColor: "red",
  })
}

const authImports = `import { db } from "@/db"
import { Adapter } from "@auth/core/adapters"
import { DrizzleAdapter } from "@auth/drizzle-adapter"`

const drizzleAdapter = `adapter: DrizzleAdapter(db) as Adapter,`

const schema = `import type { AdapterAccount } from "@auth/core/adapters"
import { primaryKey } from "drizzle-orm/sqlite-core"

export const accounts = sqliteTable(
  "account",
  {
    userId: text("userId")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccount["type"]>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("providerAccountId").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
)

export const sessions = sqliteTable("session", {
  sessionToken: text("sessionToken").notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
})

export const verificationTokens = sqliteTable(
  "verificationToken",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: integer("expires", { mode: "timestamp_ms" }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
)
`
