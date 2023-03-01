#!/usr/bin/env node

import { program } from "commander";
import * as fs from "fs/promises";
import * as path from "path";

import { PrismaToPythonConverter } from ".";

const packageJson = require("../package.json");

program
  .version(packageJson.version)
  .option("-i, --input <path>", "Input Prisma schema path")
  .option("-o, --output <path>", "Output Python file path")
  .option("-n, --indentation <number>", "Output indentation size", "4")
  .parse(process.argv);

const options = program.opts();

if (!options.input) {
  console.error("Input file path is required");
  process.exit(1);
}
if (!options.output) {
  console.error("Output file path is required");
  process.exit(1);
}
const indentation = parseInt(options.indentation);
if (isNaN(indentation)) {
  console.error("Indentation must be a number");
  process.exit(1);
}

const inputPath = path.resolve(options.input);
const outputPath = path.resolve(options.output);

const run = async () => {
  const input = await fs.readFile(inputPath, "utf-8");
  const converter = new PrismaToPythonConverter(input, { indentation });

  let output = "";
  try {
    output = await converter.run();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  await fs.writeFile(outputPath, output);
};

run();
