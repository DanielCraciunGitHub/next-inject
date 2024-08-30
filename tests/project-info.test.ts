import {
  configFiles,
  isNextInjectProject,
  isNextjsProject,
} from "@/src/utils/project-info"
import fs from "fs"

describe("nextinject.json works", () => {
  test.each(configFiles)("isNextjsProject %s", (configFile) => {
    fs.writeFileSync(configFile, "")

    let isNextjs = isNextjsProject()

    expect(isNextjs).toBe(true)

    fs.unlinkSync(configFile)

    isNextjs = isNextjsProject()

    expect(isNextjs).toBe(false)
  })
  test.each(["next-inject.json"] as const)(
    "isNextInjectProject %s",
    (configFile) => {
      fs.writeFileSync(configFile, "")

      let isNextjs = isNextInjectProject()

      expect(isNextjs).toBe(true)

      fs.unlinkSync(configFile)

      isNextjs = isNextInjectProject()

      expect(isNextjs).toBe(false)
    }
  )
})
