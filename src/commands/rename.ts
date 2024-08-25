import { Command } from "commander"

import { handleError } from "../utils/handle-error"
import { cwd, optionsSchema, setGlobalCwd } from "./add"

import path from "path"

import prompts from "prompts"
import { getNextInjectConfig, isNextInjectProject } from "../utils/project-info"
import ora from "ora"
import { replaceInFile } from "replace-in-file"
import { logger } from "../utils/logger"
import { injectFile } from "../utils/file-injection"

export async function renameNextInjectProject(projectName: string) {
  const config = await getNextInjectConfig()

  const configFilePath = path.join(cwd, "next-inject.json")

  const [indexConfig] = await replaceInFile({
    files: [path.join(cwd, "src/config/next-inject.tsx"), configFilePath],
    from: [
      new RegExp(
        `export const projectName = "${config.name ?? "<NEXT-INJECT-NAME>"}"`,
        "g"
      ),
    ],
    to: [`export const projectName = "${projectName}"`],
    glob: {
      windowsPathsNoEscape: true,
    },
    countMatches: true,
  })

  config.name = projectName
  if (!indexConfig.hasChanged) {
    logger.error(`\nRenaming failed!`)

    logger.error(`Copy this line into src/config/next-inject.tsx and retry.`)
    logger.error(`export const projectName = "${config.name}"\n`)

    logger.error(
      `Also make sure the next-inject.json config matches your project name as follows:`
    )
    logger.error(`{ "name": "${config.name}"}`)
    handleError("")
  }
  const json = JSON.stringify(config)
  await injectFile({ filePath: configFilePath, fileContent: json })
}

export const rename = new Command()
  .name("rename")
  .description("Globally change the name of your Next Inject project")
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async function (this: Command, opts) {
    const spinner = ora()

    try {
      const options = optionsSchema.parse({
        ...opts,
      })
      setGlobalCwd(path.resolve(options.cwd))

      if (!isNextInjectProject()) {
        handleError(
          "You haven't created a next inject project yet.\nRun the `init` or `bootstrap` commands to get started!"
        )
      }

      const { projectName } = await prompts([
        {
          name: "projectName",
          type: "text",
          message: "Enter your new project name:",
        },
      ])

      spinner.start(`Renaming...`)

      await renameNextInjectProject(projectName)

      spinner.succeed(`Done!`)
    } catch (error) {
      handleError(error)
    }
  })
