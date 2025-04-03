import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { MCPClientConfig, MCPConfig } from '../types/types.js';
import { MCP_CLIENTS } from '../config/clients.js';
import pc from 'picocolors';

// Active MCP client config (will be set dynamically)
let activeMCPClient: MCPClientConfig | null = null;

/**
 * Checks which MCP client configs exist on the system
 */
export const getAvailableMCPClients = async (): Promise<MCPClientConfig[]> => {
  const availableClients: MCPClientConfig[] = [];

  for (const client of MCP_CLIENTS) {
    if (await fs.pathExists(client.path)) {
      availableClients.push(client);
    }
  }

  return availableClients;
};

/**
 * Prompts the user to select an MCP client
 */
export const promptUserForMCPClient = async (
  availableClients: MCPClientConfig[]
): Promise<MCPClientConfig> => {
  const clients = availableClients.length > 0 ? availableClients : MCP_CLIENTS;

  // Create a message based on whether clients were found
  const message =
    availableClients.length > 0
      ? 'Select an MCP client:'
      : 'No existing MCP clients found. Select a client to create a new configuration:';

  // Use inquirer to prompt the user with a list
  const { selectedClient } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedClient',
      message,
      choices: clients.map((client) => ({
        name: `${client.name} (${client.description})`,
        value: client,
      })),
      default: clients[0],
    },
  ]);

  return selectedClient;
};

/**
 * Gets the MCP config file, creates it if it doesn't exist
 */
export const getMCPConfig = async (): Promise<MCPConfig> => {
  try {
    // If we already determined the active client, use it
    if (!activeMCPClient) {
      const availableClients = await getAvailableMCPClients();

      if (availableClients.length === 1) {
        // Only one client exists, use it
        activeMCPClient = availableClients[0];
        console.log(
          `Only one MCP client found: ${activeMCPClient.name}. Using its configuration at: ${activeMCPClient.path}`
        );
      } else {
        // Multiple or no clients exist, ask user to select
        activeMCPClient = await promptUserForMCPClient(availableClients);
        console.log(`Using MCP configuration at: ${pc.dim(activeMCPClient.path)}\n`);
      }
    }

    // Ensure the directory exists
    await fs.ensureDir(path.dirname(activeMCPClient.path));

    // Check if the file exists
    if (await fs.pathExists(activeMCPClient.path)) {
      const configContent = await fs.readFile(activeMCPClient.path, 'utf-8');
      return JSON.parse(configContent);
    } else {
      // Create a default config if the file doesn't exist
      const defaultConfig: MCPConfig = {
        mcpServers: {},
      };

      await fs.writeFile(activeMCPClient.path, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
  } catch (error) {
    console.error('Error getting MCP config:', error);
    throw error;
  }
};

/**
 * Updates the MCP config file with new server configurations
 */
export const updateMCPConfig = async (config: MCPConfig): Promise<void> => {
  try {
    if (!activeMCPClient) {
      throw new Error('No active MCP client selected. Call getMCPConfig first.');
    }
    await fs.writeFile(activeMCPClient.path, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error updating MCP config:', error);
    throw error;
  }
};
