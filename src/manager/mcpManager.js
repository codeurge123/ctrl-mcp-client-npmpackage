import { MCPClient } from "../client/mcpClient.js";

export class MCPManager {

    constructor() {
        this.client = new Map();
    }

    async addServer(name, config) {

        if (this.client.has(name)) {
            throw new Error(`Server "${name}" already exists`);
        }


        const client = new MCPClient();

        try {
            await client.connect(config);

            this.client.set(name, client);

            await this.client.get(name).getTools();

        }
        catch (error) {
            try {
                await client.disconnect();
            }
            catch (err) {
                // throw new Error(`Error : ${err}`)
            }

            throw new Error(
                `Could not connect to "${name}": ${error.message}`,
                { cause: error }
            );
        }

    }

    getServer(name) {

        const client = this.client.get(name);

        if (!client) {
            throw new Error(`Server ${name} not found`);
        }

        return client;
    }


    getServers() {
        return [...this.client.keys()];
    }


    async getAllTools() {

        const allTools = [];

        for (const [serverName, client] of this.client) {
            const tools = await client.getTools();

            for (const tool of tools) {
                allTools.push({
                    ...tool,
                    serverName,
                    qualifiedName: `${serverName}__${tool.name}`
                });
            }
        }

        return allTools;

    }

    async callTool(qualifiedName, args = {}) {
        const separator = qualifiedName.indexOf("__");

        if (separator <= 0 || separator + 2 >= qualifiedName.length) {
            throw new Error(
                'Use a tool name like "github__create_issue"'
            );
        }

        const serverName = qualifiedName.slice(0, separator);
        const toolName = qualifiedName.slice(separator + 2);

        const client = this.getServer(serverName);

        return client.callTool(toolName, args);
    }

    // Disconnect one server
    async removeServer(name) {
        const client = this.client.get(name);

        if (!client) {
            return false;
        }

        try {
            await client.disconnect();
        } finally {
            this.client.delete(name);
        }

        return true;
    }

    // Disconnect all servers
    async disconnectAll() {
        const clients = [...this.client.values()];

        const results = await Promise.allSettled(
            clients.map(client => client.disconnect())
        );

        this.client.clear(); // map clear

        const errors = results
            .filter(result => result.status === "rejected")
            .map(result => result.reason);

        if (errors.length > 0) {
            throw new AggregateError(
                errors,
                "Some MCP servers failed to disconnect"
            );
        }
    }

    getStatus() {
        return Object.fromEntries(
            [...this.client.entries()].map(([name, client]) => [
                name,
                client.getStatus()
            ])
        );
    }


}