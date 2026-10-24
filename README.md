# CTRL MCP Client SDK

A lightweight JavaScript SDK for connecting to and managing [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers.

`ctrl-mcp-client` provides a developer-friendly API for connecting to local and remote MCP servers, discovering tools, prompts, and resources, executing tool calls, and managing multiple server connections through a single manager.

## Features

- **Multiple transports:** Connect to local MCP servers over `stdio` and remote servers over Streamable HTTP.
- **Multi-server management:** Manage multiple independent MCP server connections using `MCPManager`.
- **Tool discovery:** Retrieve tools and their input schemas from connected servers.
- **Tool execution:** Call tools on a specific server or route calls through the manager.
- **Tool aggregation:** Collect tools from multiple servers and associate each tool with its owning server.
- **Prompt discovery:** Retrieve prompts exposed by a connected server.
- **Resource discovery:** Retrieve resources exposed by a connected server.
- **Connection status:** Inspect connection state and cached item counts.
- **Explicit lifecycle management:** Disconnect an individual server or all managed servers.

## Requirements

- Node.js 20 or later
- An MCP-compatible server for each connection you want to use

## Installation

```bash
npm install ctrl-mcp-client
```

## Quick Start: One MCP Server

Use `MCPClient` when your application needs to connect to one MCP server.

```javascript
import { MCPClient } from "ctrl-mcp-client";

const client = new MCPClient();

try {
  await client.connect({
    type: "stdio",
    command: "node",
    args: ["./server.js"],
  });

  const tools = await client.getTools();
  console.log("Available tools:", tools);

  const result = await client.callTool("your_tool_name", {
    // Tool arguments required by the server
  });

  console.log("Tool result:", result);
} catch (error) {
  console.error("MCP error:", error.message);
} finally {
  await client.disconnect();
}
```

Replace the example server path and tool name with values from your MCP server.

## Connecting to MCP Servers

### Local server — stdio

Use `stdio` when the SDK should launch a local MCP server process.

```javascript
await client.connect({
  type: "stdio",
  command: "node",
  args: ["./server.js"],
});
```

Python server example:

```javascript
await client.connect({
  type: "stdio",
  command: "python3",
  args: ["./server.py"],
});
```

The SDK launches the executable you provide. The server does not have to be written in JavaScript; it must support MCP over the selected transport.

### Remote server — Streamable HTTP

Connect to a running MCP server that exposes a Streamable HTTP endpoint.

```javascript
await client.connect({
  type: "http",
  url: "https://your-mcp-server.example/mcp",
});
```

Use the actual endpoint provided by the server operator. Authentication requirements depend on the server; do not assume every endpoint allows unauthenticated access.

## Multi-Server Management with `MCPManager`

Use `MCPManager` when your application needs several MCP servers connected at the same time. Each registered server is managed through its own `MCPClient` instance, so adding another server does not replace an existing connection.

### Connect to multiple servers

```javascript
import { MCPManager } from "ctrl-mcp-client";

const manager = new MCPManager();

try {
  await manager.addServer("github", {
    type: "stdio",
    command: "node",
    args: ["./servers/github-server.js"],
  });

  await manager.addServer("filesystem", {
    type: "stdio",
    command: "node",
    args: ["./servers/filesystem-server.js"],
  });

  await manager.addServer("search", {
    type: "http",
    url: "https://your-search-server.example/mcp",
  });

  console.log("Connected servers:", manager.getServers());
  console.log("Tools from all servers:", await manager.getAllTools());
} finally {
  await manager.disconnectAll();
}
```

The server paths and URL above are examples. Replace them with actual server configurations. The example connects sequentially because each `addServer()` call is awaited.

### How tool names are routed

The manager adds a server prefix to each tool's exposed name to distinguish tools with the same name on different servers.

| Server | Original tool name | Manager-qualified name |
|---|---|---|
| `github` | `search` | `github__search` |
| `web` | `search` | `web__search` |
| `filesystem` | `read_file` | `filesystem__read_file` |

These qualified names are created by the manager. The original tool name is sent to the MCP server when executing the call.

```javascript
const result = await manager.callTool("github__create_issue", {
  owner: "example",
  repo: "demo",
  title: "Bug report",
});

console.log(result);
```

Use the actual tool name and arguments exposed by your connected server.

### Manage individual connections

```javascript
// List registered server names
console.log(manager.getServers());

// Get one registered MCPClient instance
const githubClient = manager.getServer("github");

// Disconnect and remove one server
await manager.removeServer("filesystem");

// Disconnect all remaining servers
await manager.disconnectAll();
```

`removeServer(name)` returns `false` if the name is not registered and `true` after successfully removing it. `disconnectAll()` attempts to disconnect every registered client and throws an `AggregateError` if one or more disconnections fail.

## API Reference

### `MCPClient`

#### `new MCPClient()`

Creates an MCP client instance for one server connection.

```javascript
const client = new MCPClient();
```

#### `connect(config)`

Connects to an MCP server and discovers its tools.

For `stdio`:

| Property | Description |
|---|---|
| `type` | `"stdio"` |
| `command` | Executable used to launch the server |
| `args` | Array of command-line arguments |

For Streamable HTTP:

| Property | Description |
|---|---|
| `type` | `"http"` |
| `url` | Remote MCP endpoint URL |

A single `MCPClient` instance should manage one connection at a time. To use multiple servers simultaneously, create multiple instances or use `MCPManager`.

#### `getTools()`

Retrieves and caches the tools exposed by the connected server. Returns the tool array.

```javascript
const tools = await client.getTools();
```

Each tool includes its name, description, and input schema.

#### `callTool(name, args = {})`

Executes a tool on the connected server.

```javascript
const result = await client.callTool("get_weather", {
  city: "Delhi",
});
```

The tool name and arguments must match the server's tool definition.

#### `findTool(toolname)`

Checks whether a tool exists in the client's cached tool list and returns a boolean.

```javascript
const exists = await client.findTool("get_weather");
```

Refresh the tool list with `getTools()` if you need to discover tools added or changed by the server.

#### `getPrompt()`

Retrieves and caches prompts exposed by the connected server.

```javascript
const prompts = await client.getPrompt();
```

#### `getResource()`

Retrieves and caches resources exposed by the connected server.

```javascript
const resources = await client.getResource();
```

#### `getStatus()`

Returns locally tracked connection information and cached item counts.

```javascript
console.log(client.getStatus());
```

Example shape:

```javascript
{
  connected: true,
  transport: "StdioClientTransport",
  toolsCount: 5,
  resourceCount: 0,
  promptCount: 0
}
```

The values depend on the connection and on which discovery methods have been called. The status is locally tracked and should not be treated as a remote health check.

#### `disconnect()`

Closes the connection and clears cached tools, prompts, and resources.

```javascript
await client.disconnect();
```

After disconnecting, create a new `MCPClient` instance before reconnecting unless your implementation explicitly reinitializes the underlying MCP client.

### `MCPManager`

#### `new MCPManager()`

Creates a manager for multiple independent MCP connections.

```javascript
const manager = new MCPManager();
```

#### `addServer(name, config)`

Connects to an MCP server and registers it under a unique name.

```javascript
await manager.addServer("github", {
  type: "stdio",
  command: "node",
  args: ["./github-server.js"],
});
```

Calling `addServer()` with a name that is already registered throws an error.

#### `getServer(name)`

Returns the registered `MCPClient` for the given name. Throws if the server is not registered.

#### `getServers()`

Returns an array of registered server names.

```javascript
const names = manager.getServers();
```

#### `getAllTools()`

Collects tools from all registered clients. Each returned tool includes `serverName` and `qualifiedName` metadata in addition to its original tool fields.

```javascript
const tools = await manager.getAllTools();
```

#### `callTool(qualifiedName, args = {})`

Routes a tool call to the server identified by the qualified name.

```javascript
const result = await manager.callTool("github__create_issue", {
  owner: "example",
  repo: "demo",
  title: "Bug report",
});
```

#### `removeServer(name)`

Disconnects and removes one server. Returns `false` if it was not registered.

```javascript
await manager.removeServer("github");
```

#### `disconnectAll()`

Attempts to disconnect every registered server and clears the manager's registry.

```javascript
await manager.disconnectAll();
```

## Integrating with AI Applications

`ctrl-mcp-client` handles MCP connections, tool discovery, and tool execution. It does not include an LLM or automatically choose which tool to call.

To integrate an AI model:

1. Connect to one or more MCP servers.
2. Retrieve tools using `getTools()` or `getAllTools()`.
3. Convert each tool schema into your model provider's function-calling format.
4. Send the tool declarations to the model.
5. When the model requests a tool, execute it using `callTool()`.
6. Return the tool result to the model so it can produce a response.

For multi-server applications, preserve the mapping between each qualified tool name and its owning server. Provider-specific tool declaration formats and model orchestration belong in your application or a separate adapter layer.

## Security Notes

- Treat access tokens, API keys, and other credentials as secrets.
- Do not hardcode credentials in source code or commit them to version control.
- Only connect to MCP servers you trust and grant the minimum permissions needed.
- Tool calls may perform actions or access data; validate inputs and apply application-level approval policies where appropriate.

## Current Scope

- Each `MCPClient` instance manages one server connection.
- `MCPManager` coordinates multiple client instances.
- Remote connections use Streamable HTTP.
- Authentication and OAuth may require additional configuration or implementation for the target server.
- AI tool selection and the chatbot loop are not built into the core SDK.
- Reconnection, timeouts, and automatic recovery should be verified for the intended environment.

## Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Submit a pull request describing your changes.

## License

Add your chosen license to `package.json` and include the corresponding `LICENSE` file before publishing.

---

**CTRL MCP Client SDK — Simplifying MCP integration for JavaScript developers.**
