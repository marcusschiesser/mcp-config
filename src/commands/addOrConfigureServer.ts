import { configureServer } from '../utils/configure.js';
import { getMCPConfig, updateMCPConfig } from '../utils/mcpClients.js';

/**
 * Add or configure a server by name
 */
export async function addOrConfigureServer(serverName: string) {
  // Get the current MCP config
  const mcpConfig = await getMCPConfig();

  // Check if the server already exists in the config
  const isExistingServer = Object.keys(mcpConfig.mcpServers).includes(serverName);

  if (isExistingServer) {
    // Edit existing server
    console.log(`\nConfiguring existing server: ${serverName}...`);

    // Get the current server configuration
    const currentConfig = mcpConfig.mcpServers[serverName];

    // Configure the server with environment variables
    const updatedServer = await configureServer(serverName, currentConfig);

    // Update the MCP config
    mcpConfig.mcpServers[serverName] = updatedServer;
    console.log(`\nServer '${serverName}' updated successfully!`);
  } else {
    // Add new server
    console.log(`\nAdding new server: ${serverName}...`);
    try {
      // Configure the server with environment variables
      const serverConfig = await configureServer(serverName);

      // Add to MCP config
      mcpConfig.mcpServers[serverName] = serverConfig;
      console.log(`\nNew server '${serverName}' added successfully!`);
    } catch (error) {
      console.error(`Error adding server '${serverName}':`, error);
      throw error;
    }
  }

  // Update the MCP config file
  await updateMCPConfig(mcpConfig);
  console.log('\nConfiguration complete! 🚀');
}
