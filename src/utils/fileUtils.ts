import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { MCPConfig, ServerConfig } from '../types/types.js';

// Path to the MCP config file
const MCP_CONFIG_PATH = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
// Default path for server configurations directory
// Using import.meta.url to get the directory of the current module
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
// Resolve the path to the server configurations directory
const DEFAULT_SERVERS_CONFIG_DIR = path.resolve(moduleDir, '..', '..', 'src', 'config', 'servers');

/**
 * Gets the MCP config file, creates it if it doesn't exist
 */
export const getMCPConfig = async (): Promise<MCPConfig> => {
  try {
    // Ensure the directory exists
    await fs.ensureDir(path.dirname(MCP_CONFIG_PATH));

    // Check if the file exists
    if (await fs.pathExists(MCP_CONFIG_PATH)) {
      const configContent = await fs.readFile(MCP_CONFIG_PATH, 'utf-8');
      return JSON.parse(configContent);
    } else {
      // Create a default config if the file doesn't exist
      const defaultConfig: MCPConfig = {
        mcpServers: {},
      };

      await fs.writeFile(MCP_CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
      return defaultConfig;
    }
  } catch (error) {
    console.error('Error getting MCP config:', error);
    throw error;
  }
};

/**
 * Updates the MCP config file with new server configurations
 */
export const updateMCPConfig = async (config: MCPConfig): Promise<void> => {
  try {
    await fs.writeFile(MCP_CONFIG_PATH, JSON.stringify(config, null, 2));
    console.log('MCP config updated successfully!');
  } catch (error) {
    console.error('Error updating MCP config:', error);
    throw error;
  }
};

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
