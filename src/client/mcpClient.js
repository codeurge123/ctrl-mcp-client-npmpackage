import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { URL } from "node:url";
import chalk from "chalk";

export class MCPClient {

    constructor() {
        this.mcp = new Client({
            name: "ctrl-mcp-client",
            version: "1.0.0"
        })

        this.transport = null;

        this.tools = [];
        this.resource = [];
        this.prompt = [];

        this.connected = false;
    }


    async connect(connectionObj) {
        if (this.connected) {
            throw new Error("This MCPClient is already connected");
        }

        if (connectionObj.type === "stdio") {
            this.transport = new StdioClientTransport({
                command: connectionObj.command,
                args: connectionObj.args
            });
        }
        else if (connectionObj.type === "http") {
            this.transport = new StreamableHTTPClientTransport(
                new URL(connectionObj.url)
            );
        }
        else {
            throw new Error(
                "Unsupported transport. Use 'stdio' or 'http'."
            );
        }

        await this.mcp.connect(this.transport);


        const result = await this.mcp.listTools();

        this.tools = result.tools.map((tool) => ({
            name: tool.name,
            description: tool.description || "",
            inputSchema: tool.inputSchema,
        }));


        this.connected = true

        console.log(
            chalk.bold.green("Connected to MCP Server!"),
            "\nAvailable tools:",
            this.tools.map((tool) => tool.name)
        );

    }


    async getTools() {
        // getting the list of tools of mcp server
        if (!this.connected || !this.mcp) {
            throw new Error("Not connected to an MCP server");
        }

        const result = await this.mcp.listTools();

        this.tools = result.tools.map((tool) => ({
            name: tool.name,
            description: tool.description || "",
            inputSchema: tool.inputSchema,
        }));



        console.log("Connected to MCP Server. Tools : ", this.tools.map(tool => tool.name));
        return this.tools;

    }

    async getPrompt() {

        if (!this.connected || !this.mcp) {
            throw new Error("Not connected to an MCP server");
        }

        const result = await this.mcp.listPrompts();

        this.prompt = result.prompts.map((prompt) => ({
            name: prompt.name,
            description: prompt.description || "",
        }));


        console.log("Connected to MCP Server. Prompts : ", this.prompt.map((p) => p.name));

        return this.prompt


    }

    async getResource() {

        if (!this.connected || !this.mcp) {
            throw new Error("Not connected to an MCP server");
        }

        const result = await this.mcp.listResources();

        this.resource = result.resources.map((r) => {
            return {
                name: r.name,
                description: r.description || "",
            }
        });


        console.log("Connected to MCP Server. Resources: ", this.resource.map((r) => r.name));
        return this.resource;

    }

    async callTool(name, args = {}) {
        if (!this.connected || !this.mcp) {
            throw new Error("Not connected to an MCP server");
        }

        return await this.mcp.callTool({
            name,
            arguments: args
        });
    }

    async findTool(toolname) {
        if (!this.connected || !this.mcp) {
            throw new Error("Not connected to an MCP server");
        }

        const result = await this.mcp.listTools();

        const exists = result.tools.some(
            (tool) => tool.name === toolname
        );

        if (!exists) {
            console.log(chalk.bold.red(`${toolname} does not exist`));
            return false;
        }

        console.log(chalk.bold.green(`${toolname} exists !!`));
        return true;
    }

    async disconnect() {
        if (this.mcp) {
            await this.mcp.close();
            this.mcp = null;
            this.transport = null;
            this.tools = [];
            this.resource = [];
            this.prompt = [];
            this.connected = false;
        }
    }

    getStatus() {
        return {
            connected: this.connected,
            transport: this.transport?.constructor.name ?? null,
            toolsCount: this.tools.length,
            resourceCount: this.resource.length,
            promptCount: this.prompt.length,
        };
    }
}