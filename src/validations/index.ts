import { z } from "zod"

export const nextInjectConfigSchema = z.object({
  name: z.string(),
  plugins: z.array(z.string()).optional(),
})
