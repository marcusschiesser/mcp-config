import inquirer from 'inquirer';
import actionSelect from './actionSelect.js';
import {
  MCPServer,
  MCPConfig,
  EnvVariable,
  ServerConfig,
  ConfigurableArg,
} from '../types/types.js';
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

    // Configure the server with environment variables
    const serverWithEnv = await configureServer(selectedServer);

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
/**
 * Get a server configuration by name
 */
export const getServerConfig = async (serverName: string): Promise<ServerConfig> => {
  const serverConfigs = await getServerConfigs();
  const serverConfig = serverConfigs.find((config) => config.name === serverName);

  if (!serverConfig) {
    throw new Error(`Server configuration for ${serverName} not found. Add server to servers.json`);
  }

  return serverConfig;
};

/**
 * Configure environment variables for a server
 */
export const configureEnvVariables = async (
  serverName: string,
  envVarsToCollect: EnvVariable[] = [],
  existingEnv: Record<string, string> = {}
): Promise<Record<string, string>> => {
  // If no environment variables are required, return empty object
  if (envVarsToCollect.length === 0) {
    console.log(`No environment variables required for ${serverName}.`);
    return {};
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

  return envVars;
};

/**
 * Collect configurable arguments for a server
 */
export const collectConfigurableArgs = async (
  serverName: string,
  configurableArgs: ConfigurableArg[] = []
): Promise<string[]> => {
  // If no configurable arguments are required, return empty array
  if (configurableArgs.length === 0) {
    console.log(`No configurable arguments required for ${serverName}.`);
    return [];
  }

  console.log(`\nConfiguring arguments for ${serverName}:`);

  // Create a prompt for each configurable argument
  const args: string[] = [];

  for (const arg of configurableArgs) {
    const { value } = await inquirer.prompt<{ value: string }>({
      type: 'input',
      name: 'value',
      message: `Enter value for ${arg.name} (${arg.description}):`,
      default: '',
      validate: (input: string) => {
        if (arg.required && input.trim() === '') {
          return `argument ${arg.name} cannot be empty.`;
        }
        return true;
      },
    });

    if (value.trim() !== '') {
      if (arg.type === 'named') {
        args.push(arg.flag);
        args.push(value);
      } else if (arg.type === 'position') {
        args.push(value);
      }
    }
  }

  return args;
};

/**
 * Configure a server with its command, arguments and environment variables
 */
export const configureServer = async (
  serverName: string,
  existingConfig?: MCPServer
): Promise<MCPServer> => {
  // Get the server config by name from available server configs
  const serverConfig = await getServerConfig(serverName);

  // Collect fixed arguments
  const fixedArgs = [...serverConfig.args.fixed];

  // Collect configurable arguments
  const configurableArgs = await collectConfigurableArgs(
    serverName,
    serverConfig.args.configurable
  );

  // Initialize result with command and args from the server config
  const result: MCPServer = {
    command: serverConfig.command,
    args: [...fixedArgs, ...configurableArgs],
    env: await configureEnvVariables(serverName, serverConfig.env, existingConfig?.env),
  };

  return result;
};
