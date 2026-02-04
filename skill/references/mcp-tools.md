# Required MCP Tools for NotionWorkspaceManager

The following MCP tools must be available and used for all operations. All tools require explicit parameters and return structured responses.

## Project Management
- `create_project(name: string, status: "Idea" | "Active" | "Blocked" | "Completed", priority: "Low" | "Medium" | "High" | "Critical", start_date?: string, end_date?: string, description?: string)`
- `update_project(project_id: string, updates: object)`

## Task Management
- `create_task(title: string, project_id: string, status: "Open" | "In Progress" | "Done", deadline?: string)`
- `update_task(task_id: string, updates: object)`

## Logging & Auditing
- `log_event(level: "Info" | "Warning" | "Error", message: string, timestamp: string, reference_id?: string)`

## Error Knowledge Base
- `store_error_solution(error_type: string, context: string, resolution: string, root_cause?: string, reference_id?: string)`
- `retrieve_similar_errors(context: string) -> Array<{error_type: string, resolution: string, occurrence_count: number, last_seen: string}>`
