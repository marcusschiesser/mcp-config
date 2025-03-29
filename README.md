# MCP Client

A CLI tool for managing MCP (Modular Capability Provider) server configurations for Codeium Windsurf.

## Features

- Configure MCP servers with interactive prompts
- List existing server configurations
- Remove server configurations
- Support for environment variables

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd mcp-client
pnpm install
```

Build the project:

```bash
pnpm build
```

Link the CLI globally (optional):

```bash
npm link
```

## Usage

### Configure MCP Servers

```bash
# Using the default server configurations
pnpm dev configure

# Using a custom server configuration file
pnpm dev configure --config /path/to/your/servers.json
```

### List Configured Servers

```bash
pnpm dev list
```

### Remove a Server

```bash
pnpm dev remove <server-name>
```

## Creating Custom Server Configurations

You can create a custom server configuration file in JSON format:

```json
{
  "servers": [
    {
      "name": "my-server",
      "description": "My custom MCP server",
      "command": "npx",
      "args": ["-y", "my-server-package"],
      "env": {
        "MY_API_KEY": "",
        "OTHER_ENV_VAR": "default-value"
      }
    }
  ]
}
```

## License

ISC
