#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { DatabaseSync } from "node:sqlite";
import { z } from "zod";

const db = new DatabaseSync("infrastructure/main.db");

async function listLeaderboards() {
  const query = `SELECT * FROM leaderboards;`;
  const result = db.prepare(query).all();
  return result;
}

const getBestInLeaderboardSchema = z.object({
  name: z.string(),
});

async function getBestInLeaderboard(name: string) {
  const query = `SELECT * FROM leaderboards lb join scores s on lb.id = s.leaderboard_id WHERE lb.name = ? ORDER BY s.score DESC LIMIT 1;`;
  const result = db.prepare(query).get(name);
  return result;
}

const server = new Server(
  {
    name: "leaderboards",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const tools = [
    {
      name: "listLeaderboards",
      description: "List all leaderboards",
      inputSchema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    {
      name: "getBestInLeaderboard",
      description: "Get the best player in a leaderboard",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      },
    },
  ];

  return {
    tools,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    const { name, arguments: args } = req.params;
    switch (name) {
      case "listLeaderboards":
        const leaderboards = await listLeaderboards();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(leaderboards, null, 2),
            },
          ],
          isError: false,
        };
      case "getBestInLeaderboard":
        const parsedArgs = getBestInLeaderboardSchema.parse(args);
        const leaderboard = await getBestInLeaderboard(parsedArgs.name);
        if (leaderboard) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(leaderboard, null, 2),
              },
            ],
            isError: false,
          };
        }
        return {
          content: [
            {
              type: "text",
              text: `Leaderboard ${parsedArgs.name} not found`,
            },
          ],
          isError: true,
        };
      default:
        return {
          content: [
            {
              type: "text",
              text: `Tool ${name} not found`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${errorMessage}` }],
      isError: true,
    };
  }
});

// Start server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport).catch((error) => {
    console.error("error connecting server:", error);
    process.exit(1);
  });
  console.info("leaderboards server started");
}

runServer()
  .then(() => {
    console.info("leaderboards server connected");
  })
  .catch((error) => {
    console.error("fatal error running server:", error);
    process.exit(1);
  });
