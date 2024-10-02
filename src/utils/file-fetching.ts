import { GithubFunctionProps } from "../types"
import axios from "axios"
import { handleError } from "./handle-error"
import { CONFIG_FILE } from "./config-info"

import dotenv from "dotenv"

import { addSpinner, branch, cwd } from "../commands/add"
import path from "path"
import { existsSync } from "fs"
import fs from "fs/promises"

export async function fetchLocalAndRemoteFile(filePath: string) {
  const lc = await readFileContent(filePath)
  const rc = await fetchRemoteFile({ filePath })

  return { lc, rc } as { lc: string; rc: string }
}
export async function fetchRemoteFiles({
  filePaths,
}: Omit<GithubFunctionProps, "filePath"> & {
  filePaths: string[]
}) {
  let files: string[] = []

  for (const filePath of filePaths) {
    const fileContent = await fetchRemoteFile({ filePath })
    files.push(fileContent)
  }

  return files
}
export async function fetchRemoteFile({ filePath }: GithubFunctionProps) {
  dotenv.config({ path: CONFIG_FILE })
  try {
    addSpinner.start(`Fetching ${filePath}...`)

    const url = `https://${process.env.ACCESS_KEY}@raw.githubusercontent.com/DanielCraciunGitHub/nextjs-base-template/${branch}/${filePath}`
    const response = await axios.get(url)

    addSpinner.succeed(`Fetched ${path.normalize(filePath)}`)
    return response.data as string
  } catch (error) {
    handleError(error)
    return ""
  }
}
export function fileExists(filePath: string) {
  const targetPath = path.resolve(cwd, filePath)

  if (!existsSync(targetPath)) {
    return false
  }
  return true
}
export async function readFileContent(filePath: string) {
  if (!existsSync(cwd)) {
    handleError(`The path ${cwd} does not exist. Please try again.`)
  }

  const targetPath = path.resolve(cwd, filePath)

  const fileContent = await fs.readFile(targetPath, "utf-8")
  return fileContent
}
export async function fetchRemoteFolderFiles({
  filePath,
}: GithubFunctionProps) {
  dotenv.config({ path: CONFIG_FILE })

  const url = `https://api.github.com/repos/DanielCraciunGitHub/nextjs-base-template/contents/${filePath}?ref=${branch}`

  const { data: files }: { data: Array<{ path: string }> } = await axios.get(
    url,
    {
      headers: {
        Authorization: `token ${process.env.ACCESS_KEY}`,
      },
    }
  )

  return files
    .map((file) => file.path)
    .filter((path) => {
      const segments = path.split("/")
      const lastSegment = segments[segments.length - 1]
      return lastSegment.includes(".")
    })
}
