export interface MCPConfig {
  mcpServers: {
    [key: string]: MCPServer;
  };
}

export interface EnvVariable {
  name: string;
  description: string;
}

export interface MCPServer {
  command: string;
  args: string[];
  env?: {
    [key: string]: string;
  };
}

export interface ServerConfig {
  name: string;
  description: string;
  command: string;
  args: string[];
  env?: EnvVariable[];
}

export interface ServerConfigFile {
  servers: ServerConfig[];
}
