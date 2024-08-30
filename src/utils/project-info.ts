import path from "path"
import fs from "fs-extra"
import { type PackageJson } from "type-fest"
import { addSpinner, cwd } from "../commands/add"
import { injectFile } from "./file-injection"
import { renameNextInjectProject } from "../commands/rename"
import { readFileContent } from "./file-fetching"
import { NextInjectConfig, PluginNames } from "../types"
import chalk from "chalk"
import { logger } from "./logger"

export const configFiles = [
  "next.config.js",
  "next.config.ts",
  "next.config.mjs",
] as const

export async function getPackageJsonInfo() {
  const packageJsonPath = path.join("package.json")

  return (await fs.readJSON(packageJsonPath)) as PackageJson
}
export function isNextjsProject(): boolean {
  for (const configFile of configFiles) {
    const configFilePath = path.join(cwd, configFile)
    if (fs.existsSync(configFilePath)) {
      return true
    }
  }

  return false
}
export function isNextInjectProject(): boolean {
  const configFiles = ["next-inject.json"]

  for (const configFile of configFiles) {
    const configFilePath = path.join(cwd, configFile)
    if (fs.existsSync(configFilePath)) {
      return true
    }
  }

  return false
}
export async function getNextInjectConfig() {
  const configFilePath = path.join(cwd, "next-inject.json")
  const data = await readFileContent(configFilePath)
  const cleanedData = data
    .split("\n") // Split the file content into lines
    .map((line) => line.trim()) // Trim each line
    .filter((line) => line.length > 0) // Remove empty lines
    .join("") // Join lines back into a single string

  const json = cleanedData ? JSON.parse(cleanedData) : {}
  return json as NextInjectConfig
}

export async function initNextInjectConfig(data: { projectName: string }) {
  const configFilePath = path.join(cwd, "next-inject.json")

  const jsonData = JSON.stringify(data, null, 2)

  await renameNextInjectProject(data.projectName)

  await injectFile({ filePath: configFilePath, fileContent: jsonData })
}
export async function registerNextInjectPlugin(plugin: string) {
  const config = await getNextInjectConfig()
  const configFilePath = path.join(cwd, "next-inject.json")

  if (!config.plugins) {
    config.plugins = [plugin]
  } else {
    if (!config.plugins.includes(plugin)) config.plugins.push(plugin)
  }

  await injectFile({
    filePath: configFilePath,
    fileContent: JSON.stringify(config, null, 2),
  })
}
export function isValidConfig(
  config: NextInjectConfig | {}
): config is NextInjectConfig {
  return "name" in config
}
export async function patchPeerPlugin(
  plugin: PluginNames,
  patchFunction: () => Promise<void>
) {
  const config = await getNextInjectConfig()

  if (config.plugins?.includes(plugin)) {
    logger.break()
    addSpinner.info(
      chalk.blue(
        `Peer plugin ${chalk.green(plugin)} detected. Patching your project...`
      )
    )
    await patchFunction()
    addSpinner.succeed(`Peer plugin ${chalk.green(plugin)} has been patched!`)
  }
}
