import { execa } from "execa"
import { cwd } from "../commands/add"
import { logger } from "./logger"
import ora from "ora"
import { fileExists } from "./file-fetching"
import path from "path"

// npx shadcn-ui@latest init -dy && npx shadcn-ui@latest add -a
export async function shadcnInstall() {
  const spinner = ora()

  try {
    const initCommand = ["shadcn-ui@latest", "init", "-dy"]

    const addCommand = ["shadcn-ui@latest", "add", "-a"]

    if (!fileExists(path.resolve(cwd, "components.json"))) {
      spinner.info(`Installing shadcn-ui...\n`)

      await execa("npx", initCommand, {
        cwd,
        stdio: "inherit",
      })
      await execa("npx", addCommand, {
        cwd,
        stdio: "inherit",
      })
    } else {
      spinner.info(`shadcn-ui detected, skipping installation...\n`)
    }
  } catch (error) {
    logger.error(error)
  }
}
