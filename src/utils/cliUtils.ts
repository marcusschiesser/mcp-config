import inquirer from 'inquirer';
import actionSelect from './actionSelect.js';
import { ServerConfig, MCPServer, MCPConfig } from '../types/types.js';
import { getServerConfigs } from './fileUtils.js';

/**
 * Prompt the user to select which activated servers to edit and what action to perform
 */
export const selectServerToEdit = async (
  mcpConfig: MCPConfig
): Promise<{ server: string; action: string } | null> => {
  try {
    const activatedServers = Object.keys(mcpConfig.mcpServers);

    if (activatedServers.length === 0) {
      console.log('No MCP servers are currently activated.');
      // Even if no servers are activated, we still want to allow adding a new one
      const addNewServer = await inquirer.prompt<{ addNew: boolean }>([
        {
          type: 'confirm',
          name: 'addNew',
          message: 'Would you like to add a new MCP server?',
          default: true,
        },
      ]);

      if (addNewServer.addNew) {
        return {
          server: '',
          action: 'add',
        };
      }
      return null;
    }

    const result = await actionSelect({
      message: 'Select an MCP server and action:',
      actions: [
        { value: 'configure', name: 'Configure', key: 'c' },
        { value: 'remove', name: 'Remove', key: 'r' },
        { value: 'view', name: 'View Details', key: 'v' },
        { value: 'add', name: 'Add New', key: 'a' },
      ],
      choices: activatedServers.map((name) => ({
        name,
        value: name,
      })),
    });

    if (!result) return null;

    return {
      server: result.action === 'add' ? '' : result.answer,
      action: result.action || 'configure',
    };
  } catch (error) {
    console.error('Error selecting servers to edit:', error);
    throw error;
  }
};

/**
 * Collect environment variables for a server
 */
/**
 * Add a new MCP server by selecting from available server configs
 */
export const addNewServer = async (): Promise<{
  serverName: string;
  serverConfig: MCPServer;
} | null> => {
  try {
    // Get all available server configurations
    const serverConfigs = await getServerConfigs();

    if (serverConfigs.length === 0) {
      console.log('No server configurations available. Please add server configurations first.');
      return null;
    }

    // Let user select a server configuration
    const { selectedServer } = await inquirer.prompt<{ selectedServer: string }>([
      {
        type: 'list',
        name: 'selectedServer',
        message: 'Select a server to add:',
        choices: serverConfigs.map((server) => ({
          name: `${server.name} - ${server.description}`,
          value: server.name,
        })),
      },
    ]);

    // Find the selected server configuration
    const serverConfig = serverConfigs.find((server) => server.name === selectedServer);

    if (!serverConfig) {
      console.log(`Server configuration for ${selectedServer} not found.`);
      return null;
    }

    // Collect environment variables
    const serverWithEnv = await collectEnvVariables(serverConfig, selectedServer);

    return {
      serverName: selectedServer,
      serverConfig: serverWithEnv,
    };
  } catch (error) {
    console.error('Error adding new server:', error);
    throw error;
  }
};

/**
 * Collect environment variables for a server
 */
export const collectEnvVariables = async (
  server: ServerConfig | MCPServer,
  serverName: string
): Promise<MCPServer> => {
  const result: MCPServer = {
    command: server.command,
    args: [...server.args],
    env: {},
  };

  // If no environment variables are required, return the server as is
  if (!server.env || Object.keys(server.env).length === 0) {
    console.log(`No environment variables required for ${serverName}.`);
    return result;
  }

  console.log(`\nConfiguring environment variables for ${serverName}:`);

  // Create a prompt for each environment variable
  const envVars: Record<string, string> = {};

  for (const key of Object.keys(server.env || {})) {
    const { [key]: value } = await inquirer.prompt<Record<string, string>>({
      type: 'input',
      name: key,
      message: `Enter value for ${key}:`,
      default: server.env?.[key] || '',
      validate: (input: string) => {
        if (input.trim() === '') {
          return `${key} cannot be empty.`;
        }
        return true;
      },
    });

    envVars[key] = value;
  }

  const answers = envVars;
  result.env = answers;

  return result;
};
