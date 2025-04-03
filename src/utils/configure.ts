import inquirer from 'inquirer';
import { ArgsDoc, ConfigurableArg, EnvVariable, MCPServer } from '../types/types.js';
import { getServerConfig } from './serverConfigs.js';

/**
 * Configure a server with its command, arguments and environment variables
 */

export const configureServer = async (
  serverName: string,
  existingConfig?: MCPServer
): Promise<MCPServer> => {
  // Get the server config by name from available server configs
  const serverConfig = await getServerConfig(serverName);

  // Collect all arguments (fixed and configurable), passing existing args if available

  // Initialize result with command and args from the server config
  const result: MCPServer = {
    command: serverConfig.command,
    args: await configureArgs(serverConfig.args, existingConfig?.args),
    env: await configureEnvVariables(serverConfig.env, existingConfig?.env),
  };

  if (
    result.args.length === serverConfig.args.fixed.length &&
    (!result.env || Object.keys(result.env).length === 0)
  ) {
    console.log(`No arguments or environment variables required to configure ${serverName}.`);
  }

  return result;
};

/**
 * Configure environment variables for a server
 */
const configureEnvVariables = async (
  envVarsToCollect: EnvVariable[] = [],
  existingEnv: Record<string, string> = {}
): Promise<Record<string, string>> => {
  // If no environment variables are required, return empty object
  if (envVarsToCollect.length === 0) {
    return {};
  }

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
 * Collect and return all arguments for a server (fixed and configurable)
 */
const configureArgs = async (
  serverArgs: ArgsDoc,
  existingArgs: string[] = []
): Promise<string[]> => {
  // Get fixed args
  const fixedArgs = serverArgs.fixed;

  // If no configurable arguments are required, return only fixed args
  if (serverArgs.configurable.length === 0) {
    return [...fixedArgs];
  }

  // Create a prompt for each configurable argument
  const configurableArgs: string[] = [];

  for (const arg of serverArgs.configurable) {
    // Find existing value for this argument if available
    let defaultValue = '';

    if (existingArgs.length > 0 && arg.type === 'named') {
      const flagIndex = existingArgs.findIndex((a) => a === arg.flag);
      if (flagIndex !== -1 && flagIndex + 1 < existingArgs.length) {
        defaultValue = existingArgs[flagIndex + 1];
      }
    } else if (existingArgs.length > 0 && arg.type === 'position') {
      // For positional args, we'd need more context to match them correctly
      // This is a simplified approach that assumes order matters
      const argIndex = serverArgs.configurable.findIndex(
        (a: ConfigurableArg) => a.name === arg.name
      );
      if (argIndex !== -1) {
        // Count how many positional args come before this one
        const positionsBefore = serverArgs.configurable
          .slice(0, argIndex)
          .filter((a: ConfigurableArg) => a.type === 'position').length;

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
        if (arg.style === 'equals') {
          configurableArgs.push(`${arg.flag}=${value}`);
        } else {
          configurableArgs.push(arg.flag);
          configurableArgs.push(value);
        }
      } else if (arg.type === 'position') {
        configurableArgs.push(value);
      }
    }
  }

  return [...fixedArgs, ...configurableArgs];
};
