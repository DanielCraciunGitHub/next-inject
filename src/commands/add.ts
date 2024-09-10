import { Command, Option } from "commander"

import { handleError } from "../utils/handle-error"

import { metadata } from "./plugins/metadata"

import { deleteKey, loadTempKey, loadUserKey } from "./auth"
import axios from "axios"
import { logger } from "../utils/logger"
import {
  commandToUrl,
  freeCommands,
  NEXTJS_APP_URL,
} from "../utils/config-info"
import ora from "ora"
import { reactEmail } from "./plugins/react-email"
import { z } from "zod"
import path from "path"
import {
  isNextInjectProject,
  isNextjsProject,
  registerNextInjectPlugin,
} from "../utils/project-info"
import prompts from "prompts"

import { init } from "./init"
import chalk from "chalk"
import { nextAuth } from "./plugins/next-auth"

import { existsSync } from "fs"
import { drizzleTurso } from "./plugins/drizzle-turso"
import { stripe } from "./plugins/stripe"
import { resend } from "./plugins/resend"

import { sanity } from "./plugins/sanity"
import { landingPage } from "./plugins/lp"
import { waitlist } from "./plugins/waitlist"

export const addSpinner = ora()
export let branch: string = "master"

export let cwd: string = process.cwd()
export function setGlobalCwd(inputCwd: string) {
  cwd = inputCwd
}

export let tempKey: boolean = false
export function setGlobalTempKey(key: boolean) {
  tempKey = key
}

export const optionsSchema = z.object({
  cwd: z.string(),
})

export const add = new Command()
  .name("add")
  .description("Inject new plugins ⚡")
  .usage("[commands...] <options>")
  // ! Add new commands here
  .addCommand(landingPage)
  .addCommand(waitlist)
  .addCommand(metadata)
  .addCommand(reactEmail)
  .addCommand(nextAuth)
  .addCommand(drizzleTurso)
  .addCommand(stripe)
  .addCommand(resend)
  .addCommand(sanity)
  .hook("preSubcommand", async (thisCommand: Command, subCommand: Command) => {
    subCommand.addOption(
      new Option(
        "-c, --cwd <cwd>",
        "the working directory. defaults to the current directory."
      ).default(process.cwd())
    )

    try {
      addSpinner.start(
        `Checking for permission to install the ${subCommand.name()} plugin...`
      )

      if (!freeCommands.includes(subCommand.name())) {
        const res = await axios.post(`${NEXTJS_APP_URL}/api/cli`, {
          pluginName: cliNameToStripePluginName(subCommand.name()),
          authKey: loadUserKey(),
        })
        logger.break()

        if (res.status !== 200) {
          logger.error(
            `\nPlease authenticate and/or purchase this plugin here:\n${NEXTJS_APP_URL}/plugins/${subCommand.name()}`
          )
          logger.warn(
            `Also, find configuration instructions at ${NEXTJS_APP_URL}/dashboard`
          )
          handleError(res.statusText)
        }
      } else {
        if (loadUserKey() === "undefined") await loadTempKey()
      }

      addSpinner.succeed("Permission Granted!")
    } catch (error) {
      logger.break()
      logger.error(
        `Please purchase this plugin from here: ${NEXTJS_APP_URL}/plugins/${subCommand.name()}`
      )
      logger.warn(
        `Find configuration instructions at ${NEXTJS_APP_URL}/dashboard\n`
      )
      handleError(error)
    }
  })
  .hook("preAction", async (thisCommand: Command, subCommand: Command) => {
    const options = optionsSchema.parse({
      ...subCommand.opts(),
    })
    cwd = path.resolve(options.cwd)
    branch = subCommand.name()

    if (!existsSync(cwd)) {
      handleError(
        `The path ${cwd} does not exist!\nRun this command inside a valid directory.`
      )
    }

    if (!isNextjsProject()) {
      const { createProject } = await prompts([
        {
          name: "createProject",
          type: "confirm",
          message:
            "Next.js project has not been detected, should we create one for you?",
        },
      ])
      if (createProject) {
        await init.parseAsync()
      } else {
        process.exit(1)
      }
    } else if (!isNextInjectProject() && isNextjsProject()) {
      logger.error(
        "ERROR: Next Inject is intended for new projects and cannot be used in an existing Next.js project."
      )
      logger.warn(
        "Please run `npx next-inject init` in a new directory outside of any existing Next.js project."
      )
      logger.break()
      logger.info("Learn more about starting with our base template:")
      logger.info(`${NEXTJS_APP_URL}/plugins/base-template`)
      logger.break()
      process.exit(1)
    } else {
      logger.break()
      addSpinner.info(`Injecting ${chalk.green(subCommand.name())} plugin...`)
      logger.break()
    }
  })
  .hook("postAction", async (thisCommand: Command, subCommand: Command) => {
    await registerNextInjectPlugin(subCommand.name())

    logger.break()
    addSpinner.succeed(
      `⚡ Finished injecting the ${chalk.green(subCommand.name())} plugin!`
    )
    logger.break()
    addSpinner.info(
      `Please review any ${chalk.yellow("yellow")} or ${chalk.red("red")} files to ensure everything works as expected.`
    )
    addSpinner.info(
      `Find the documentation for this plugin here:\n${chalk.blue(`${NEXTJS_APP_URL}/plugins/${commandToUrl[subCommand.name()]}`)}`
    )

    if (tempKey) {
      deleteKey()
    }

    const [thisArg, nextArg, ...restArgs] = thisCommand.args

    if (nextArg && restArgs && nextArg !== "-c") {
      await add.parseAsync([nextArg, ...restArgs], { from: "user" })
    }
  })
  .action(async (plugin, opts) => {
    try {
      throw new Error("This plugin does not exist")
    } catch (error) {
      handleError(error)
    }
  })

export function cliNameToStripePluginName(name: string): string {
  return (
    name
      .replace("-", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim() + " Plugin"
  )
}
