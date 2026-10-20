# CTRL MCP Client SDK

**A lightweight JavaScript SDK for connecting to Model Context Protocol (MCP) servers.**

`ctrl-mcp-client` simplifies MCP client development by providing a developer-friendly API for connecting to local and remote MCP servers, discovering tools, prompts, and resources, and executing tool calls.

Instead of managing MCP SDK operations yourself, use a simple interface to integrate MCP servers into your Node.js applications and AI-powered workflows.

## Features

- **Multiple transports:** Connect to local MCP servers through stdio and remote servers through Streamable HTTP.
- **Tool discovery:** Retrieve available tools and their input schemas.
- **Tool execution:** Call MCP tools using a simple method.
- **Prompt discovery:** Retrieve prompts exposed by an MCP server.
- **Resource discovery:** Retrieve resources exposed by an MCP server.
- **Connection status:** Inspect connection state and cached item counts.
- **Developer-friendly API:** Work with MCP functionality through a reusable SDK.

## Installation

```bash
npm install ctrl-mcp-client
```

**Requirements:** Node.js 20 or later and an MCP-compatible server.

## Quick Start

```javascript
import { MCPClient } from "ctrl-mcp-client";

const client = new MCPClient();

try {
    await client.connect({
        type: "http",
        url: "https://your-mcp-server.com/mcp",
    });

    console.log(client.getStatus());

    const result = await client.callTool("your_tool_name", {
        // Tool arguments
    });

    console.log(result);
} catch (error) {
    console.error("MCP error:", error.message);
} finally {
    await client.disconnect();
}
```

Replace the example endpoint and tool name with values from your MCP server.

## Connecting to MCP Servers

### Local server — stdio

Use stdio when the SDK should launch a local MCP server process.

```javascript
await client.connect({
    type: "stdio",
    command: "node",
    args: ["./server.js"],
});
```

Python example:

```javascript
await client.connect({
    type: "stdio",
    command: "python3",
    args: ["./server.py"],
});
```

The SDK can launch other compatible executables too. The server's implementation language does not need to be JavaScript or Python.

### Remote server — Streamable HTTP

Connect to an MCP server that is already running and exposes a Streamable HTTP endpoint.

```javascript
await client.connect({
    type: "http",
    url: "https://your-mcp-server.com/mcp",
});
```

Authentication requirements depend on the remote server and the SDK configuration.

## API Reference

### `new MCPClient()`

Creates an MCP client instance.

```javascript
const client = new MCPClient();
```

### `connect(config)`

Connects to an MCP server and automatically discovers its tools.

**For stdio:**

| Property | Description |
|---|---|
| `type` | `"stdio"` |
| `command` | Executable used to launch the server |
| `args` | Array of command-line arguments |

**For Streamable HTTP:**

| Property | Description |
|---|---|
| `type` | `"http"` |
| `url` | Remote MCP endpoint URL |

### `getTools()`

Retrieves and caches the tools exposed by the connected server.

```javascript
await client.getTools();
```

Each cached tool includes its name, description, and input schema.

### `callTool(name, args)`

Executes a tool on the connected MCP server.

```javascript
const result = await client.callTool("get_weather", {
    city: "Delhi",
});
```

The tool name and arguments must match the server's tool definition.

### `findTool(toolname)`

Checks whether a tool exists on the connected server.

```javascript
const exists = await client.findTool("get_weather");
```

Returns `true` when the tool exists and `false` otherwise.

### `getPrompt()`

Retrieves and caches prompts exposed by the server.

```javascript
await client.getPrompt();
```

### `getResource()`

Retrieves and caches resources exposed by the server.

```javascript
await client.getResource();
```

### `getStatus()`

Returns locally tracked connection information and cached item counts.

```javascript
console.log(client.getStatus());
```

Example:

```javascript
{
    connected: true,
    transport: "StreamableHTTPClientTransport",
    toolsCount: 5,
    resourceCount: 2,
    promptCount: 1
}
```

The counts depend on the server. Prompt and resource counts remain zero until their discovery methods are called.

### `disconnect()`

Closes the connection and clears cached tools, prompts, and resources.

```javascript
await client.disconnect();
```

Reconnection using the same instance requires the client to be reinitialized after disconnecting.

## Integrating with AI Applications

The CTRL MCP Client SDK handles MCP connections and tool execution. It does not include an LLM or automatically choose which tool to call.

To integrate an AI model:

1. Connect to an MCP server.
2. Retrieve the available tools.
3. Convert the tool schemas into your LLM provider's function-calling format.
4. Let the model select a tool.
5. Execute the requested tool using `callTool()`.
6. Return the result to the model.

This approach lets developers use their preferred LLM provider without coupling the core SDK to a particular AI model.

## Limitations

- Each client instance currently manages one MCP server connection.
- Remote connections use Streamable HTTP.
- Authentication and OAuth flows may require additional configuration or implementation.
- Tool discovery does not provide AI-powered tool selection.
- Reconnection and error-recovery behavior should be tested for the intended environment.

## Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Implement and test your changes.
4. Submit a pull request describing your changes.

## License

Add your chosen license to `package.json` and include a corresponding `LICENSE` file.

---

**CTRL MCP Client SDK — Simplifying MCP integration for JavaScript developers.**
