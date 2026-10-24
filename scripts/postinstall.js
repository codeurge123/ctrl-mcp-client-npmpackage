import figlet from "figlet";
import chalk from "chalk";

console.log("\n");

figlet("CTRL MCP CLIENT", (err, data) => {
    if (err) {
        console.log("CTRL MCP CLIENT");
        return;
    }

    console.log(chalk.cyan.bold(data));

    console.log(
        chalk.green.bold("  MCP Client SDK installed successfully!")
    );

    console.log(
        chalk.white("  Connect. Manage. Build AI agents.")
    );

    console.log(
        chalk.gray("\n  npm: https://www.npmjs.com/package/ctrl-mcp-client")
    );

    console.log(
        chalk.gray("  GitHub: https://github.com/YOUR_USERNAME/ctrl-mcp-client\n")
    );
});
