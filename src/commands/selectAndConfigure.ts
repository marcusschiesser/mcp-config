import inquirer from 'inquirer';
import { addNewServer, selectServerToEdit } from '../utils/cliUtils.js';
import { configureServer } from '../utils/configure.js';
import { getMCPConfig, updateMCPConfig } from '../utils/fileUtils.js';
import pc from 'picocolors';

export async function selectAndConfigure() {
  // Get the current MCP config
  const mcpConfig = await getMCPConfig();

  // Show currently activated servers and let the user select one to edit
  const selection = await selectServerToEdit(mcpConfig);

  if (selection) {
    const { server: serverToEdit, action } = selection;

    // Handle different actions
    if (action === 'add') {
      console.log('\nAdding a new MCP server...');
      const newServer = await addNewServer();

      if (newServer) {
        const { serverName, serverConfig } = newServer;
        mcpConfig.mcpServers[serverName] = serverConfig;
        console.log(`\nNew server '${serverName}' added successfully!`);
      } else {
        console.log('\nAdding new server cancelled.');
        return;
      }
    } else {
      if (action === 'configure') {
        // Edit selected server
        console.log(`\n${pc.bold('Configuring')} ${serverToEdit}...\n`);

        // Get the current server configuration
        const currentConfig = mcpConfig.mcpServers[serverToEdit];

        // Configure the server with environment variables
        const updatedServer = await configureServer(serverToEdit, currentConfig);

        // Update the MCP config
        mcpConfig.mcpServers[serverToEdit] = updatedServer;
      } else if (action === 'remove') {
        // Confirm removal
        const confirmation = await inquirer.prompt<{ confirm: boolean }>([
          {
            type: 'confirm',
            name: 'confirm',
            message: `Are you sure you want to remove ${serverToEdit}?`,
            default: false,
          },
        ]);

        if (confirmation.confirm) {
          delete mcpConfig.mcpServers[serverToEdit];
          console.log(`${serverToEdit} has been removed.`);
        } else {
          console.log('Removal cancelled.');
          return;
        }
      } else if (action === 'view') {
        console.log(`\nViewing details for ${serverToEdit}:`);
        console.log(JSON.stringify(mcpConfig.mcpServers[serverToEdit], null, 2));
        return;
      }
    }

    // Update the MCP config file
    await updateMCPConfig(mcpConfig);
    console.log('\nConfiguration complete! 🚀');
  } else {
    console.log('No servers selected or available to edit.');
  }
}
