import { existsSync } from "fs"
import fs from "fs-extra"
import path from "path"

import { fetchRemoteFile } from "@/src/utils/file-fetching"
import { handleError } from "./handle-error"
import { addSpinner, cwd } from "../commands/add"
import {
  GithubFunctionProps,
  InjectFileProps,
  InjectFilesProps,
} from "../types"
import chalk from "chalk"

export async function injectGithubFile({ filePath }: GithubFunctionProps) {
  if (!existsSync(cwd)) {
    handleError(`The path ${cwd} does not exist. Please try again.`)
  }

  const targetPath = path.resolve(cwd, filePath)

  const fileContent = await fetchRemoteFile({ filePath })

  await injectFile({ filePath: targetPath, fileContent })
}
export async function injectGithubFiles({
  filePaths,
}: Omit<GithubFunctionProps, "filePath"> & {
  filePaths: string[]
}) {
  for (const filePath of filePaths) {
    await injectGithubFile({ filePath })
  }
}
export async function injectFile({
  filePath,
  fileContent,
  successColor = "green",
}: InjectFileProps) {
  addSpinner.start(`Injecting ${filePath}...`)
  const targetPath = path.resolve(cwd, filePath)

  await fs.ensureDir(path.dirname(targetPath))

  await fs.writeFile(targetPath, fileContent)

  const successMessage = `Injected ${path.normalize(targetPath)}`

  addSpinner.succeed(
    successColor === "green"
      ? chalk.green(successMessage)
      : successColor === "yellow"
        ? chalk.yellow(successMessage)
        : chalk.red(successMessage)
  )
}
export async function injectFiles({
  filesContent,
  filePaths,
}: InjectFilesProps) {
  if (filePaths.length !== filesContent.length) {
    handleError("Ensure the injectFiles function takes in equal length arrays!")
  }
  for (let i = 0; i < filePaths.length; i++) {
    await injectFile({ filePath: filePaths[i], fileContent: filesContent[i] })
  }
}
