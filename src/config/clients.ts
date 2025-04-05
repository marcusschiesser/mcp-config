import os from 'os';
import path from 'path';
import { MCPClientConfig } from '../types/types.js';

interface PathResolver {
  resolver: () => string | null;
}

interface UnresolvedMCPClientConfig {
  name: string;
  path: PathResolver;
  description: string;
}

const MCP_CLIENTS: UnresolvedMCPClientConfig[] = [
  {
    name: 'Windsurf',
    path: {
      resolver: () => path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json'),
    },
    description: 'Codeium Windsurf client',
  },
  {
    name: 'Cursor',
    path: {
      resolver: () => path.join(os.homedir(), '.cursor', 'mcp.json'),
    },
    description: 'Cursor client',
  },
  {
    name: 'Claude',
    path: {
      resolver: () => {
        const platform = process.platform;
        if (platform === 'win32') {
          return path.join(process.env.APPDATA || '', 'Claude', 'claude_desktop_config.json');
        } else if (platform === 'darwin') {
          return path.join(
            os.homedir(),
            'Library',
            'Application Support',
            'Claude',
            'claude_desktop_config.json'
          );
        }
        // not available for other platforms
        return null;
      },
    },
    description: 'Claude desktop client',
  },
];

/**
 * Returns all MCP clients that are available for the current platform
 * with resolved paths that are guaranteed to be non-null
 */
export function getPlatformClients(): MCPClientConfig[] {
  return MCP_CLIENTS.map((client) => {
    const resolvedPath = client.path.resolver();
    if (resolvedPath !== null) {
      return {
        name: client.name,
        description: client.description,
        path: resolvedPath,
      };
    }
    return null;
  }).filter((client): client is MCPClientConfig => client !== null);
}
