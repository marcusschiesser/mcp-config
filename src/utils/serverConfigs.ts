import fs from 'fs-extra';
import path from 'path';
import { ServerConfig } from '../types/types.js';
import { fileURLToPath } from 'url';

const moduleDir = path.dirname(fileURLToPath(import.meta.url));
// Resolve the path to the server configurations directory
export const DEFAULT_SERVERS_CONFIG_DIR = path.resolve(
  moduleDir,
  '..',
  '..',
  'src',
  'config',
  'servers'
);

/**
 * Gets server configurations from the config directory
 */

export const getServerConfigs = async (): Promise<ServerConfig[]> => {
  const serversConfigDir = DEFAULT_SERVERS_CONFIG_DIR;

  try {
    if (await fs.pathExists(serversConfigDir)) {
      // Get all JSON files in the directory
      const files = await fs.readdir(serversConfigDir);
      const jsonFiles = files.filter((file) => file.endsWith('.json'));

      // Read each file and parse as ServerConfig
      const serverConfigs: ServerConfig[] = [];

      for (const file of jsonFiles) {
        const filePath = path.join(serversConfigDir, file);
        try {
          const configContent = await fs.readFile(filePath, 'utf-8');
          const config = JSON.parse(configContent) as ServerConfig;
          serverConfigs.push(config);
        } catch (error) {
          console.error(`Error reading server config file ${file}:`, error);
          // Continue with other files even if one fails
        }
      }

      return serverConfigs;
    } else {
      console.log(
        `Server config directory not found at ${serversConfigDir}. Using empty configuration.`
      );
      return [];
    }
  } catch (error) {
    console.error('Error reading server configs:', error);
    return [];
  }
};

/**
 * Get a server configuration by name
 */
export const getServerConfig = async (serverName: string): Promise<ServerConfig> => {
  // First try to load directly from the specific file
  const specificConfigPath = path.join(DEFAULT_SERVERS_CONFIG_DIR, `${serverName}.json`);

  try {
    if (await fs.pathExists(specificConfigPath)) {
      const configContent = await fs.readFile(specificConfigPath, 'utf-8');
      return JSON.parse(configContent) as ServerConfig;
    }
  } catch (error) {
    console.error(`Error reading specific server config for ${serverName}:`, error);
  }

  throw new Error(
    `Server configuration for ${serverName} not found. Add server to the servers directory.`
  );
};
