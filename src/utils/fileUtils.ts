import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { MCPConfig, ServerConfig } from '../types/types.js';

// Path to the MCP config file
const MCP_CONFIG_PATH = path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json');
// Default path for server configurations
const DEFAULT_SERVER_CONFIG_PATH = path.join(os.homedir(), '.mcp-client-servers.json');

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
 * Gets server configurations from the config file
 */
export const getServerConfigs = async (configPath?: string): Promise<ServerConfig[]> => {
  const serverConfigPath = configPath || DEFAULT_SERVER_CONFIG_PATH;

  try {
    if (await fs.pathExists(serverConfigPath)) {
      const configContent = await fs.readFile(serverConfigPath, 'utf-8');
      const config = JSON.parse(configContent);
      return config.servers || [];
    } else {
      console.log(
        `Server config file not found at ${serverConfigPath}. Using empty configuration.`
      );
      return [];
    }
  } catch (error) {
    console.error('Error reading server config:', error);
    return [];
  }
};
