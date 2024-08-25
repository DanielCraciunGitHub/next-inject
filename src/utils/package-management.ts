import { detect } from "@antfu/ni"

import { execa } from "execa"

import { handleError } from "./handle-error"
import { cwd } from "../commands/add"
import ora from "ora"
import { logger } from "./logger"

export async function installDeps(packages: string[]) {
  const packageManager = await getPackageManager(cwd)
  const spinner = ora()
  try {
    const installCommand = packageManager
    const installArgs = [
      !packages.length
        ? "install"
        : packageManager === "npm"
          ? "install"
          : "add",
      ...packages,
      ...(packageManager === "npm" ? ["--force"] : []),
    ]

    spinner.info(`Installing dependencies...\n`)

    await execa(installCommand, installArgs, {
      cwd,
      stdio: "inherit",
    })
    logger.break()
    spinner.succeed(`Dependencies successfully installed!`)
  } catch (error) {
    handleError(error)
  }
}
export async function installDevDeps(packages: string[]) {
  const packageManager = await getPackageManager(cwd)
  const spinner = ora()

  try {
    const installCommand = packageManager
    const installArgs = [
      packageManager === "npm" ? "install" : "add",
      ...packages,
      "-D",
      ...(packageManager === "npm" ? ["--force"] : []),
    ]

    spinner.info(`Installing dev dependencies...\n`)

    await execa(installCommand, installArgs, { cwd, stdio: "inherit" })
    logger.break()
    spinner.succeed(`Dev dependencies successfully installed!`)
  } catch (error) {
    handleError(error)
  }
}

export async function getPackageManager(
  targetDir: string
): Promise<"yarn" | "pnpm" | "bun" | "npm"> {
  const packageManager = await detect({ programmatic: true, cwd: targetDir })

  if (packageManager === "yarn@berry") return "yarn"
  if (packageManager === "pnpm@6") return "pnpm"
  if (packageManager === "bun") return "bun"

  return packageManager ?? "npm"
}
