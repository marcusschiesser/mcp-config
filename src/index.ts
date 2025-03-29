#!/usr/bin/env node

import { getMCPConfig, updateMCPConfig } from './utils/fileUtils.js';
import { collectEnvVariables, selectServerToEdit } from './utils/cliUtils.js';

/**
 * Main function to configure MCP servers
 */
async function main() {
  try {
    console.log('MCP Client - Configure MCP servers');
    console.log('------------------------------------');
    
    // Get the current MCP config
    const mcpConfig = await getMCPConfig();

    // Show currently activated servers and let the user select one to edit
    const serverToEdit = await selectServerToEdit(mcpConfig);

    if (serverToEdit) {
      // Edit selected server
      console.log('\nEditing selected server...');
      console.log(`\nEditing ${serverToEdit}...`);

      // Get the current server configuration
      const currentConfig = mcpConfig.mcpServers[serverToEdit];

      // Prompt for environment variables
      const updatedServer = await collectEnvVariables(currentConfig, serverToEdit);

      // Update the MCP config
      mcpConfig.mcpServers[serverToEdit] = updatedServer;
      
      // Update the MCP config file
      await updateMCPConfig(mcpConfig);
      console.log('\nConfiguration complete! 🚀');
    } else {
      console.log('No servers selected or available to edit.');
    }
  } catch (error) {
    console.error('Error configuring MCP servers:', error);
    process.exit(1);
  }
}

// Execute the main function
main();
