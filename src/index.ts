#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs-extra';
import { 
  getMCPConfig, 
  updateMCPConfig, 
  getServerConfigs 
} from './utils/fileUtils.js';
import { 
  selectServers, 
  collectEnvVariables 
} from './utils/cliUtils.js';
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
  .action(async (options) => {
    try {
      // Get available server configurations
      const configPath = options.config 
        ? path.resolve(process.cwd(), options.config)
        : path.resolve(__dirname, '../src/config/servers.json');
        
      console.log(`Using server config from: ${configPath}`);
      const servers = await getServerConfigs(configPath);
      
      if (servers.length === 0) {
        console.error('No server configurations found. Please check your configuration file.');
        process.exit(1);
      }
      
      // Let the user select which servers to configure
      const selectedServers = await selectServers(servers);
      
      // Get the current MCP config
      const mcpConfig = await getMCPConfig();
      
      // Collect environment variables for each selected server
      console.log('\nConfiguring selected servers...');
      for (const server of selectedServers) {
        console.log(`\nConfiguring ${server.name}...`);
        
        // Prompt for environment variables
        const configuredServer = await collectEnvVariables(server);
        
        // Update the MCP config
        mcpConfig.mcpServers[server.name] = configuredServer;
      }
      
      // Update the MCP config file
      await updateMCPConfig(mcpConfig);
      console.log('\nConfiguration complete! 🚀');
      
    } catch (error) {
      console.error('Error configuring MCP servers:', error);
      process.exit(1);
    }
  });

program
  .command('list')
  .description('List configured MCP servers')
  .action(async () => {
    try {
      const mcpConfig = await getMCPConfig();
      const servers = mcpConfig.mcpServers;
      
      if (Object.keys(servers).length === 0) {
        console.log('No MCP servers configured yet.');
        return;
      }
      
      console.log('\nConfigured MCP Servers:');
      Object.entries(servers).forEach(([name, config]) => {
        console.log(`\n${name}:`);
        console.log(`  Command: ${config.command} ${config.args.join(' ')}`);
        if (config.env && Object.keys(config.env).length > 0) {
          console.log('  Environment Variables:');
          Object.entries(config.env).forEach(([key, value]) => {
            // Mask sensitive values
            const maskedValue = value ? '********' : '(not set)';
            console.log(`    ${key}: ${maskedValue}`);
          });
        }
      });
      
    } catch (error) {
      console.error('Error listing MCP servers:', error);
      process.exit(1);
    }
  });

program
  .command('remove <name>')
  .description('Remove a configured MCP server')
  .action(async (name) => {
    try {
      const mcpConfig = await getMCPConfig();
      
      if (!mcpConfig.mcpServers[name]) {
        console.log(`Server "${name}" is not configured.`);
        return;
      }
      
      delete mcpConfig.mcpServers[name];
      await updateMCPConfig(mcpConfig);
      
      console.log(`Server "${name}" has been removed from the configuration.`);
      
    } catch (error) {
      console.error('Error removing MCP server:', error);
      process.exit(1);
    }
  });

// If no command is specified, default to configure
if (process.argv.length <= 2) {
  program.parse([process.argv[0], process.argv[1], 'configure']);
} else {
  program.parse();
}
