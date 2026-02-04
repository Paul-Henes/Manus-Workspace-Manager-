import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { Client } from "@notionhq/client";
import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

const DB_IDS = {
  projects: process.env.NOTION_PROJECTS_DB!,
  tasks: process.env.NOTION_TASKS_DB!,
  logs: process.env.NOTION_LOGS_DB!,
  errorKnowledge: process.env.NOTION_ERROR_KNOWLEDGE_DB!,
};

const server = new Server(
  {
    name: "notion-workspace-manager",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const TOOLS: Tool[] = [
  {
    name: "create_project",
    description: "Create a new project in the Notion workspace",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        status: { type: "string", enum: ["Idea", "Active", "Blocked", "Completed"] },
        priority: { type: "string", enum: ["Low", "Medium", "High", "Critical"] },
        start_date: { type: "string", format: "date" },
        end_date: { type: "string", format: "date" },
        description: { type: "string" },
      },
      required: ["name", "status", "priority"],
    },
  },
  {
    name: "create_task",
    description: "Create a new task linked to a project",
    inputSchema: {
      type: "object",
      properties: {
        title: { type: "string" },
        project_id: { type: "string" },
        status: { type: "string", enum: ["Open", "In Progress", "Done"] },
        deadline: { type: "string", format: "date" },
      },
      required: ["title", "project_id", "status"],
    },
  },
  {
    name: "log_event",
    description: "Log an event for traceability",
    inputSchema: {
      type: "object",
      properties: {
        level: { type: "string", enum: ["Info", "Warning", "Error"] },
        message: { type: "string" },
        timestamp: { type: "string", format: "date-time" },
        project_id: { type: "string" },
        task_id: { type: "string" },
      },
      required: ["level", "message", "timestamp"],
    },
  },
  {
    name: "store_error_solution",
    description: "Store an error and its resolution in the knowledge base",
    inputSchema: {
      type: "object",
      properties: {
        error_type: { type: "string" },
        context: { type: "string" },
        resolution: { type: "string" },
        root_cause: { type: "string" },
        reference_id: { type: "string" },
      },
      required: ["error_type", "context", "resolution"],
    },
  },
  {
    name: "retrieve_similar_errors",
    description: "Search for similar errors in the knowledge base",
    inputSchema: {
      type: "object",
      properties: {
        context: { type: "string" },
      },
      required: ["context"],
    },
  },
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "create_project": {
        const { name, status, priority, start_date, end_date, description } = args as any;
        const response = await notion.pages.create({
          parent: { database_id: DB_IDS.projects },
          properties: {
            Name: { title: [{ text: { content: name } }] },
            Status: { select: { name: status } },
            Priority: { select: { name: priority } },
            ...(start_date || end_date ? {
              "Start Date": { date: { start: start_date, end: end_date || null } }
            } : {}),
            Description: { rich_text: [{ text: { content: description || "" } }] },
          },
        });
        return { content: [{ type: "text", text: `Project created: ${response.id}` }] };
      }

      case "create_task": {
        const { title, project_id, status, deadline } = args as any;
        const response = await notion.pages.create({
          parent: { database_id: DB_IDS.tasks },
          properties: {
            Title: { title: [{ text: { content: title } }] },
            Project: { relation: [{ id: project_id }] },
            Status: { select: { name: status } },
            ...(deadline ? { Deadline: { date: { start: deadline } } } : {}),
          },
        });
        return { content: [{ type: "text", text: `Task created: ${response.id}` }] };
      }

      case "log_event": {
        const { level, message, timestamp, project_id, task_id } = args as any;
        const response = await notion.pages.create({
          parent: { database_id: DB_IDS.logs },
          properties: {
            Level: { select: { name: level } },
            Message: { rich_text: [{ text: { content: message } }] },
            Timestamp: { date: { start: timestamp } },
            ...(project_id ? { "Reference (Projects)": { relation: [{ id: project_id }] } } : {}),
            ...(task_id ? { "Reference (Tasks)": { relation: [{ id: task_id }] } } : {}),
          },
        });
        return { content: [{ type: "text", text: `Log entry created: ${response.id}` }] };
      }

      case "store_error_solution": {
        const { error_type, context, resolution, root_cause, reference_id } = args as any;
        const response = await notion.pages.create({
          parent: { database_id: DB_IDS.errorKnowledge },
          properties: {
            "Error Type": { title: [{ text: { content: error_type } }] },
            Context: { rich_text: [{ text: { content: context } }] },
            Resolution: { rich_text: [{ text: { content: resolution } }] },
            "Root Cause": { rich_text: [{ text: { content: root_cause || "" } }] },
            "Occurrence Count": { number: 1 },
            "Last Seen": { date: { start: new Date().toISOString() } },
            ...(reference_id ? { Reference: { relation: [{ id: reference_id }] } } : {}),
          },
        });
        return { content: [{ type: "text", text: `Error solution stored: ${response.id}` }] };
      }

      case "retrieve_similar_errors": {
        const { context } = args as any;
        const response = await (notion.databases as any).query({
          database_id: DB_IDS.errorKnowledge,
          filter: {
            property: "Context",
            rich_text: {
              contains: context,
            },
          },
        });

        const results = response.results.map((page: any) => ({
          error_type: page.properties["Error Type"].title[0]?.plain_text,
          resolution: page.properties.Resolution.rich_text[0]?.plain_text,
          occurrence_count: page.properties["Occurrence Count"].number,
          last_seen: page.properties["Last Seen"].date?.start,
        }));

        return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Notion MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
