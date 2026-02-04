---
name: notion-workspace-manager
description: "End-to-end management of a Notion workspace including projects, tasks, logs, and error knowledge. Use for: creating/updating projects and tasks, logging activities, and managing error-solution knowledge bases via MCP tools."
---

# NotionWorkspaceManager

This skill enables the end-to-end management of a Notion workspace through a standardized set of MCP tools. It ensures data consistency, traceability, and continuous learning from errors.

## Core Principles

- **Exclusivity**: All actions must be executed via the defined MCP tool calls. Direct access to Notion is prohibited.
- **Traceability**: Every write operation must be documented via the `log_event` tool.
- **Determinism**: Never guess missing information. If parameters are ambiguous, ask the user for clarification.
- **Learning**: Before reporting a failure, check the Error Knowledge database for existing solutions.

## Database Schemas

The skill operates on four logical databases. Database ID mapping is handled internally by the MCP server.

| Database | Required Fields | Optional Fields |
| :--- | :--- | :--- |
| **Projects** | Name (Title), Status (Idea/Active/Blocked/Completed), Priority (Low/Medium/High/Critical) | Start Date, End Date, Description |
| **Tasks** | Title, Project (Relation), Status (Open/In Progress/Done) | Deadline |
| **Logs** | Level (Info/Warning/Error), Message, Timestamp | Reference (Relation to Project/Task) |
| **Error Knowledge** | Error Type (Title), Context, Resolution | Root Cause, Occurrence Count, Last Seen, Reference |

## Workflows### Project and Task Management (STRICT PROTOCOL)
1. **ID Verification**: Before writing, verify the target Database ID from the environment.
2. **Atomic Operations**: Every creation (`create_project`, `create_task`) MUST be followed by an immediate `log_event` call. If logging fails, the operation is considered failed.
3. **Write Confirmation**: After using `append_project_info`, you MUST verify the write by checking the tool's return message.
4. **Field Mapping**: Ensure property names match exactly (e.g., `Reference (Project)` instead of `Reference`).

### Error Handling and Knowledge Retrieval
When an operation fails or an error is encountered:
1. Call `retrieve_similar_errors` with the current error context.
2. **If a match is found**:
   - Propose or apply the stored resolution.
   - Update the error metadata (occurrence count, last seen) via the MCP server.
3. **If no match is found**:
   - Log the error using `log_event`.
   - Ask the user for the correct resolution.
   - Store the new knowledge using `store_error_solution` once confirmed.

### Knowledge Management on Project Pages
When the user provides links, articles, or general information related to a project:
1. **Analyze and Summarize**: Create a concise summary of the information provided.
2. **Append to Project**: Use `append_project_info` to store the summary and original source on the project's Notion page.
3. **Categorize**: Use `Summary` for abstracts, `Source` for links/references, and `Info` for general notes.

## Resource Navigation

- Detailed tool definitions and parameter requirements: `references/mcp-tools.md`
