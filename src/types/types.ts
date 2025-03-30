export interface MCPConfig {
  mcpServers: {
    [key: string]: MCPServer;
  };
}

export interface ConfigurableArg {
  type: 'position' | 'named';
  flag: string;
  description: string;
  required: boolean;
}

export interface ArgsDoc {
  fixed: string[];
  configurable: ConfigurableArg[];
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
  args: ArgsDoc;
  env?: EnvVariable[];
}

export interface ServerConfigFile {
  servers: ServerConfig[];
}
