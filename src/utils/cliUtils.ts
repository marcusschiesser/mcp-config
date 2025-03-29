import inquirer from 'inquirer';
import actionSelect  from './actionSelect.js';
import { ServerConfig, MCPServer, MCPConfig } from '../types/types.js';

/**
 * Prompt the user to select which activated servers to edit and what action to perform
 */
export const selectServerToEdit = async (mcpConfig: MCPConfig): Promise<{ server: string; action: string } | null> => {
  try {
    const activatedServers = Object.keys(mcpConfig.mcpServers);

    if (activatedServers.length === 0) {
      console.log('No MCP servers are currently activated.');
      return null;
    }

    const result = await actionSelect({
      message: 'Select an MCP server and action:',
      actions: [
        { value: 'configure', name: 'Configure', key: 'c' },
        { value: 'remove', name: 'Remove', key: 'r' },
        { value: 'view', name: 'View Details', key: 'v' }
      ],
      choices: activatedServers.map((name) => ({
        name,
        value: name,
      })),
    });

    if (!result) return null;
    
    return {
      server: result.answer,
      action: result.action || 'configure'
    };
  } catch (error) {
    console.error('Error selecting servers to edit:', error);
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
