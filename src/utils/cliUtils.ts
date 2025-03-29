import inquirer from 'inquirer';
import { ServerConfig, MCPServer } from '../types/types.js';

interface SelectServersAnswer {
  selectedServers: string[];
}

/**
 * Prompt the user to select servers from the available options
 */
export const selectServers = async (servers: ServerConfig[]): Promise<ServerConfig[]> => {
  try {
    const answers = await inquirer.prompt<SelectServersAnswer>({
      type: 'checkbox',
      name: 'selectedServers',
      message: 'Select MCP servers to activate:',
      choices: servers.map(server => ({
        name: `${server.name} - ${server.description}`,
        value: server.name,
        checked: false
      })),
      validate: (answer) => {
        if (answer.length < 1) {
          return 'You must select at least one server.';
        }
        return true;
      }
    });

    return servers.filter(server => answers.selectedServers.includes(server.name));
  } catch (error) {
    console.error('Error selecting servers:', error);
    throw error;
  }
};

/**
 * Prompt the user to provide values for environment variables
 */
export const collectEnvVariables = async (server: ServerConfig): Promise<MCPServer> => {
  const result: MCPServer = {
    command: server.command,
    args: [...server.args],
    env: {}
  };

  // If no environment variables are required, return the server as is
  if (!server.env || Object.keys(server.env).length === 0) {
    console.log(`No environment variables required for ${server.name}.`);
    return result;
  }

  console.log(`\nConfiguring environment variables for ${server.name}:`);
  
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
      }
    });
    
    envVars[key] = value;
  }
  
  const answers = envVars;
  result.env = answers;

  return result;
};
