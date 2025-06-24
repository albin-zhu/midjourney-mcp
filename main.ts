import { McpServer } from "npm:@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "npm:zod";
import { generateImage } from "./tools/mj.ts";

const server = new McpServer({
  name: "Midjourney-MCP",
  version: "1.0.0",
  description: "Midjourney MCP server",
});


server.registerTool<{ prompt: z.ZodString }, { image: z.ZodString }>("generateImage", {
  title: "Generate Image",
  description: "Generate an image based on the prompt",
  inputSchema: {
    prompt: z.string({
      description: "The prompt to generate an image",
    }),
  }
}, async (args: any) => {
  try {
    const result = await generateImage(args.prompt);
    if (!result) {
      return {
      content: [{
        type: "text",
        text: "Failed to generate image",
      }],
    };
  }
  return {
    content: result as any,
  };
  } catch (error: any) {
    console.error(error);
    return {
      content: [{
        type: "text",
        text: `Failed to generate image: ${error.message}, stack: ${error.stack}`,
      }],
    };
  }
});

// Remove the splitMidjourneyGrid tool for now to focus on the main issue
const transport = new StdioServerTransport();

await server.connect(transport);