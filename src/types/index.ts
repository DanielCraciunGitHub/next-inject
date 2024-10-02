import { z } from "zod"
import { nextInjectConfigSchema } from "../validations"

export type PluginNames =
  | "next-auth"
  | "drizzle-turso"
  | "stripe"
  | "trpc"
  | "react-email"
  | "nodemailer"
  | "resend"
  | "sanity"

export type InjectContentProps = {
  insertContent: string
  insertPoint: string | RegExp
  direction: "above" | "below"
  fileContent: string
  offset?: number
}
export type InjectFileProps = {
  filePath: string
  fileContent: string
  successColor?: "green" | "yellow" | "red"
}
export type InjectFilesProps = {
  filePaths: string[]
  filesContent: string[]
}

export interface GithubFunctionProps {
  filePath: string
}

export type ExtractContentProps = {
  fileContent: string
  searchStrings: (RegExp | string)[]
}

export type ExtractContentBetweenProps = Omit<
  ExtractContentProps,
  "searchStrings"
> & {
  startString?: string | RegExp
  endString?: string | RegExp
}
export type NextInjectConfig = z.infer<typeof nextInjectConfigSchema>
