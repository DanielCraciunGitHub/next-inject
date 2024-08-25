import path from "path"
import os from "os"

export const HOME_DIR = os.homedir()
export const CONFIG_DIR = path.join(HOME_DIR, ".next-inject")
export const CONFIG_FILE = path.join(CONFIG_DIR, "config")
export const NEXTJS_APP_URL = "https://www.nextinject.pro"
//   "http://localhost:3000"

// ! UPDATE THIS WHENEVER YOU ADD A NEW COMMAND
export const freeCommands = ["metadata", "react-email", "lp"]

export const commandToUrl: Record<string, string> = {
  stripe: "payments/stripe",
  "next-auth": "auth/next-auth",
  "drizzle-turso": "backend/drizzle-turso",
  sanity: "backend/sanity",
  "react-email": "emails/react-email",
  resend: "emails/resend",
  metadata: "misc/metadata",
  lp: "ui/lp"
}
