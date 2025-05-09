import inquirer from 'inquirer';
import actionSelect from './actionSelect.js';
import { MCPServer, MCPConfig } from '../types/types.js';
import { getServerConfigs } from './serverConfigs.js';
import { configureServer } from './configure.js';
import pc from 'picocolors';

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
      message: 'Select an MCP server and press an action key:',
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
        pageSize: process.stdout.rows ? Math.max(process.stdout.rows - 4, 15) : 15, // Use terminal height minus some space for prompt
        choices: serverConfigs.map((server) => ({
          name: `${pc.bold(server.name)} - ${pc.dim(server.description)}${server.url ? ` - ${pc.underline(server.url)}` : ''}`,
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
