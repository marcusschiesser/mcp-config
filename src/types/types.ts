export interface MCPConfig {
  mcpServers: {
    [key: string]: MCPServer;
  };
}

type PositionArg = {
  type: 'position';
};
type NamedArg = {
  type: 'named';
  flag: string;
  style?: 'space' | 'equals';
};
export type ConfigurableArg = {
  name: string;
  description: string;
  required: boolean;
} & (PositionArg | NamedArg);

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
  url?: string;
  command: string;
  args: ArgsDoc;
  env?: EnvVariable[];
}

export interface MCPClientConfig {
  name: string;
  path: string;
  description: string;
}
