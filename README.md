# MCP Config

A CLI tool for managing MCP servers configurations for MCP clients (currently Codeium Windsurf).

## Features

- Repository of MCP servers (see [src/config/servers](src/config/servers))
- 1-line MCP server install
- Configure and add MCP servers with interactive prompts
- View existing server configurations
- Remove MCP server configurations

## Getting Started

Just call `npx mcp-config` in your terminal. Then select an already installed MCP server and press an action key to 
perform the desired action (configure, remove or view details).

To add a new MCP server, press the "a" key (Add New) and select a server from the repository.

Or just run `npx mcp-config <server-name>` to add a new server, e.g. `npx mcp-config llamacloud`.



## Development

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd mcp-config
npm install
```

Build the project:

```bash
npm run build
```

Start the tool:

```bash
npm run start
```
