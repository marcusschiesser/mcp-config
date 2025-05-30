#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs-extra';
import pc from 'picocolors';
import ansiEscapes from 'ansi-escapes';
import { addOrConfigureServer } from './commands/addOrConfigureServer.js';
import { selectAndConfigure } from './commands/selectAndConfigure.js';

/**
 * Get package version from package.json
 */
async function getPackageVersion() {
  try {
    // Get the directory of the current module
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    // Resolve the path to package.json (two levels up from dist/index.js)
    const packagePath = resolve(__dirname, '..', 'package.json');

    // Read and parse package.json
    const packageJson = await fs.readJSON(packagePath);
    return packageJson.version;
  } catch (error) {
    console.error('Error reading package version:', error);
    return 'unknown';
  }
}

/**
 * Parse command line arguments
 */
function parseCommandLineArgs() {
  const args = process.argv.slice(2);
  const params: { serverName?: string } = {};

  // If there's a first argument, use it as the serverName
  if (args.length > 0 && !args[0].startsWith('-')) {
    params.serverName = args[0];
  }

  return params;
}

/**
 * Display a modern welcome banner
 */
async function displayWelcomeBanner(version: string) {
  // Clear the screen
  process.stdout.write(ansiEscapes.clearScreen);

  // Create a stylish banner
  console.log('');
  console.log(pc.bgCyan(pc.black(' '.repeat(60))));
  console.log(
    pc.bgCyan(
      pc.black(
        `  ${pc.bold('MCP CONFIG')} ${pc.dim(`v${version}`)}${' '.repeat(43 - version.length)}  `
      )
    )
  );
  console.log(pc.bgCyan(pc.black(' '.repeat(60))));
  console.log('');
  // Subtitle
  console.log(`${pc.bold('Manage Your MCP Servers')}`);
  // Separator
  console.log(pc.dim('─'.repeat(60)));
  console.log('');
}

/**
 * Main function to configure MCP servers
 */
async function main() {
  try {
    // Get version from package.json
    const version = await getPackageVersion();

    // Display welcome banner
    await displayWelcomeBanner(version);

    // Parse command line arguments
    const cliArgs = parseCommandLineArgs();

    // If serverName is provided via CLI, directly add or edit that server
    if (cliArgs.serverName) {
      await addOrConfigureServer(cliArgs.serverName);
      return;
    }

    await selectAndConfigure();
  } catch (error) {
    // Check if this is an ExitPromptError (thrown when user presses Ctrl+C)
    if (
      error instanceof Error &&
      (error.name === 'ExitPromptError' || error.message.includes('ExitPromptError'))
    ) {
      console.log('\nOperation cancelled by user.');
      process.exit(0);
    }
    console.error('Error configuring MCP servers:', error);
    process.exit(1);
  }
}

// Execute the main function
main();
