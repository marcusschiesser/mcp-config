import inquirer from 'inquirer';
import { ServerConfig, MCPServer, MCPConfig } from '../types/types.js';



/**
 * Prompt the user to provide values for environment variables
 */
/**
 * Prompt the user to select which activated servers to edit
 */
export const selectServerToEdit = async (mcpConfig: MCPConfig): Promise<string | null> => {
  try {
    const activatedServers = Object.keys(mcpConfig.mcpServers);
    
    if (activatedServers.length === 0) {
      console.log('No MCP servers are currently activated.');
      return null;
    }
    
    const answers = await inquirer.prompt<{serverToEdit: string}>({  
      type: 'list',
      name: 'serverToEdit',
      message: 'Currently activated MCP servers:',
      choices: activatedServers.map(name => ({
        name,
        value: name
      }))
    });
    
    return answers.serverToEdit;
  } catch (error) {
    console.error('Error selecting servers to edit:', error);
    throw error;
  }
};

/**
 * Collect environment variables for a server
 */
export const collectEnvVariables = async (server: ServerConfig | MCPServer, serverName: string): Promise<MCPServer> => {
  const result: MCPServer = {
    command: server.command,
    args: [...server.args],
    env: {}
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
      }
    });
    
    envVars[key] = value;
  }
  
  const answers = envVars;
  result.env = answers;

  return result;
};
