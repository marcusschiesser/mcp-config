import inquirer from 'inquirer';
import actionSelect from './actionSelect.js';
import { MCPServer, MCPConfig, EnvVariable } from '../types/types.js';
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
        { value: 'add', name: 'Add New', key: 'a' },
        { value: 'configure', name: 'Configure', key: 'return' },
        { value: 'remove', name: 'Remove', key: 'r' },
        { value: 'view', name: 'View Details', key: 'v' },
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



    

    // Collect environment variables
    const serverWithEnv = await collectEnvVariables(selectedServer);

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
  serverName: string,
  existingConfig?: MCPServer
): Promise<MCPServer> => {
  // Get the server config by name from available server configs
  const serverConfigs = await getServerConfigs();
  const serverConfig = serverConfigs.find(config => config.name === serverName);
  
  if (!serverConfig) {
    throw new Error(`Server configuration for ${serverName} not found. Add server to servers.json`);
  }

  // Initialize result with command and args from the server config
  const result: MCPServer = {
    command: serverConfig.command,
    args: [...serverConfig.args],
    env: {},
  };

  // Get existing env values if available
  const existingEnv = existingConfig?.env || {};

  // Determine environment variables to collect
  const envVarsToCollect: EnvVariable[] = serverConfig.env || [];
  
  // If no environment variables are required, return the server as is
  if (envVarsToCollect.length === 0) {
    console.log(`No environment variables required for ${serverName}.`);
    return result;
  }

  console.log(`\nConfiguring environment variables for ${serverName}:`);

  // Create a prompt for each environment variable
  const envVars: Record<string, string> = {};

  for (const envVar of envVarsToCollect) {
    const varName = envVar.name;
    const { [varName]: value } = await inquirer.prompt<Record<string, string>>({
      type: 'input',
      name: varName,
      message: `Enter value for ${varName} (${envVar.description}):`,
      default: existingEnv[varName] || '',
      validate: (input: string) => {
        if (input.trim() === '') {
          return `${varName} cannot be empty.`;
        }
        return true;
      },
    });

    envVars[varName] = value;
  }

  result.env = envVars;

  return result;
};
