import os from 'os';
import path from 'path';
import { MCPClientConfig } from '../types/types.js';

export const MCP_CLIENTS: MCPClientConfig[] = [
  {
    name: 'Windsurf',
    path: path.join(os.homedir(), '.codeium', 'windsurf', 'mcp_config.json'),
    description: 'Codeium Windsurf client',
  },
  {
    name: 'Cursor',
    path: path.join(os.homedir(), '.cursor', 'mcp.json'),
    description: 'Cursor client',
  },
  {
    name: 'Claude',
    path: path.join(
      os.homedir(),
      'Library',
      'Application Support',
      'Claude',
      'claude_desktop_config.json'
    ),
    description: 'Claude desktop client',
  },
];
