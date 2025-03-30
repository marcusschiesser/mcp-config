import inquirer from 'inquirer';
import { ConfigurableArg, EnvVariable, MCPServer } from '../types/types.js';
import { getServerConfig } from './fileUtils.js';

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
  const configurableArgs = await configureArgs(serverName, serverConfig.args.configurable);

  // Initialize result with command and args from the server config
  const result: MCPServer = {
    command: serverConfig.command,
    args: [...fixedArgs, ...configurableArgs],
    env: await configureEnvVariables(serverName, serverConfig.env, existingConfig?.env),
  };

  return result;
};

/**
 * Configure environment variables for a server
 */
const configureEnvVariables = async (
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
const configureArgs = async (
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
