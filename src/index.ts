#!/usr/bin/env node

import chalk from "chalk"
import { Command } from "commander"
import figlet from "figlet"

import { add } from "./commands/add"
import { auth } from "./commands/auth"
import { init } from "./commands/init"
import { rename } from "./commands/rename"
import latestVersion from "latest-version"
import { logger } from "./utils/logger"
import { handleError } from "./utils/handle-error"

process.on("SIGINT", () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

console.log(chalk.green(figlet.textSync("Next Inject")))

async function main() {
  const program = new Command()
    .name("next-inject")
    .description("Inject plugins into your next.js project")
    .version("1.3.3", "-v, --version", "display the version number")

  program
    .addCommand(add)
    .addCommand(auth)
    .addCommand(init)
    .addCommand(rename)
    .hook("preSubcommand", async function (thisCommand: Command) {
      const thisVersion = thisCommand.version()
      const realVersion = await latestVersion("next-inject")

      if (thisVersion !== realVersion) {
        logger.warn("Please upgrade your CLI to the latest version.")
        handleError("Try `npm update -g next-inject`")
      }
    })

  program.parse()
}

main()
