import { Command } from "commander"
import { handleError } from "../utils/handle-error"
import prompts from "prompts"
import { logger } from "../utils/logger"
import path from "path"
import fs from "fs-extra"
import simpleGit from "simple-git"
import ora from "ora"
import { z } from "zod"

import dotenv from "dotenv"
import { CONFIG_FILE } from "../utils/config-info"
import { cwd, setGlobalCwd } from "./add"
import { execa } from "execa"
import { renameNextInjectProject } from "./rename"
dotenv.config({ path: CONFIG_FILE })

const optionsSchema = z.object({
  cwd: z.string(),
})

export const init = new Command()
  .name("init")
  .description(
    "initialize the base nextjs template compatible with all plugins"
  )
  .option(
    "-c, --cwd <cwd>",
    "the working directory. defaults to the current directory.",
    process.cwd()
  )
  .action(async (opts) => {
    const spinner = ora()

    try {
      const options = optionsSchema.parse({
        ...opts,
      })

      const { projectName, packageManager } = await prompts([
        {
          type: "text",
          name: "projectName",
          message: "Enter the desired project name:",
        },
        {
          type: "select",
          name: "packageManager",
          message: "Choose your package manager:",
          choices: [
            { title: "pnpm", value: "pnpm" },
            { title: "npm", value: "npm" },
            { title: "bun", value: "bun" },
            { title: "yarn", value: "yarn" },
          ],
          initial: 0,
        },
      ])

      if (!projectName) {
        throw new Error("Project name cannot be empty.")
      }

      // setGlobalCwd(path.join(cwd, projectName))
      setGlobalCwd(path.resolve(options.cwd, projectName))

      if (fs.existsSync(cwd)) {
        throw new Error(`Directory "${projectName}" already exists.`)
      }
      await fs.mkdir(cwd)

      spinner.start(`Cloning github repository...`)
      const git = simpleGit({ baseDir: cwd })
      await git.clone(
        `https://${process.env.ACCESS_KEY}@github.com/DanielCraciunGitHub/nextjs-base-template.git`,
        cwd,
        ["--branch", "master"]
      )

      process.chdir(cwd)
      await fs.rm(".git", {
        force: true,
        recursive: true,
      })
      await fs.rename(".env.example", ".env.local")
      await renameNextInjectProject(projectName)

      await git.init()
      await git.add(".")
      await git.commit("init")

      spinner.succeed("Repository cloned successfully!")

      try {
        spinner.info(`Installing Dependencies...\n`)

        await execa(packageManager, ["install"], { cwd, stdio: "inherit" })

        spinner.succeed("Dependencies installed successfully.")
      } catch (error: any) {
        throw new Error(error.message)
      }

      spinner.succeed(`Project "${projectName}" created successfully.\n`)
      logger.info(
        `Run the following command to start the application:\n\n${packageManager} run dev`
      )
    } catch (error) {
      handleError(error)
    }
  })
