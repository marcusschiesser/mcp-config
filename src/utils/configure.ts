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

  // Collect fixed arguments - no need to add prefix
  const fixedArgs = serverConfig.args.fixed;

  // Collect configurable arguments, passing existing args if available
  const configurableArgs = await configureArgs(
    serverName, 
    serverConfig.args.configurable,
    existingConfig?.args
  );

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
  configurableArgs: ConfigurableArg[] = [],
  existingArgs: string[] = []
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
    // Find existing value for this argument if available
    let defaultValue = '';
    
    if (existingArgs.length > 0 && arg.type === 'named') {
      const flagIndex = existingArgs.findIndex(a => a === arg.flag);
      if (flagIndex !== -1 && flagIndex + 1 < existingArgs.length) {
        defaultValue = existingArgs[flagIndex + 1];
      }
    } else if (existingArgs.length > 0 && arg.type === 'position') {
      // For positional args, we'd need more context to match them correctly
      // This is a simplified approach that assumes order matters
      const argIndex = configurableArgs.findIndex(a => a.name === arg.name);
      if (argIndex !== -1) {
        // Count how many positional args come before this one
        const positionsBefore = configurableArgs
          .slice(0, argIndex)
          .filter(a => a.type === 'position').length;
        
        // Find all positional args in existing args (those not preceded by a flag)
        const existingPositionalArgs: string[] = [];
        for (let i = 0; i < existingArgs.length; i++) {
          const isFlag = existingArgs[i].startsWith('-');
          if (isFlag) {
            // Skip the flag and its value
            i++;
          } else {
            existingPositionalArgs.push(existingArgs[i]);
          }
        }
        
        if (positionsBefore < existingPositionalArgs.length) {
          defaultValue = existingPositionalArgs[positionsBefore];
        }
      }
    }

    const { value } = await inquirer.prompt<{ value: string }>({
      type: 'input',
      name: 'value',
      message: `Enter value for ${arg.name} (${arg.description}):`,
      default: defaultValue,
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
