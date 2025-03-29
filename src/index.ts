#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { getMCPConfig, updateMCPConfig } from './utils/fileUtils.js';
import { collectEnvVariables, selectServerToEdit } from './utils/cliUtils.js';
import { fileURLToPath } from 'url';

// Get the directory name for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const program = new Command();

// Get the version from package.json
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

program
  .name('mcp-client')
  .description('CLI to manage MCP server configurations for Codeium Windsurf')
  .version(packageJson.version);

program
  .command('configure')
  .description('Configure MCP servers')
  .option('-c, --config <path>', 'Path to server configuration file')
  .action(async (_options) => {
    try {
      // Get the current MCP config
      const mcpConfig = await getMCPConfig();

      // Show currently activated servers and let the user select one to edit
      const serversToEdit = await selectServerToEdit(mcpConfig);

      if (serversToEdit) {
        // Edit selected server
        console.log('\nEditing selected server...');
        const serverName = serversToEdit;
        console.log(`\nEditing ${serverName}...`);

        // Get the current server configuration
        const currentConfig = mcpConfig.mcpServers[serverName];

        // Prompt for environment variables
        const updatedServer = await collectEnvVariables(currentConfig, serverName);

        // Update the MCP config
        mcpConfig.mcpServers[serverName] = updatedServer;
      }

      // Update the MCP config file
      await updateMCPConfig(mcpConfig);
      console.log('\nConfiguration complete! 🚀');
    } catch (error) {
      console.error('Error configuring MCP servers:', error);
      process.exit(1);
    }
  });

// If no command is specified, default to configure
if (process.argv.length <= 2) {
  program.parse([process.argv[0], process.argv[1], 'configure']);
} else {
  program.parse();
}
