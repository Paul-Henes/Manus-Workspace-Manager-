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

## Workflows### Project and Task Management (VERIFIED WRITE PROTOCOL)
1. **Direct Page Targeting**: When adding info to a project, always use the specific Page ID.
2. **Body Content Injection**: Use the `append_project_info` tool to inject content directly into the page body as blocks. This is the only way to ensure visibility in the Notion UI.
3. **Strict Validation**: Every write operation MUST be verified against the server's response. If no "SUCCESS" message with a Block ID is received, retry with explicit API parameters.
4. **No Assumptions**: Do not assume a page is updated just because the tool was called. Always confirm the presence of content.

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
