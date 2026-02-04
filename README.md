# Notion Workspace Manager (Manus Skill & MCP Server)

Dieses Repository enthält den **NotionWorkspaceManager** Skill für Manus sowie den dazugehörigen **MCP-Server**, um einen Notion-Workspace end-to-end zu verwalten.

## Struktur

- `/skill`: Enthält die Manus-Skill-Definition (`SKILL.md`) und die Tool-Referenzen.
- `/server`: Der TypeScript-basierte MCP-Server, der die Notion-API anbindet.

## Features

- **Projektmanagement**: Erstellen und Verwalten von Projekten mit Status und Priorität.
- **Aufgabenverwaltung**: Erstellen von Aufgaben, die direkt mit Projekten verknüpft sind.
- **Traceability**: Automatisches Logging aller Aktionen in eine dedizierte Notion-Datenbank.
- **Learning System**: Eine Error-Knowledge-Datenbank speichert Fehler und Lösungen für zukünftige Wiederverwendung.

## Installation (Server)

1. Navigiere in den Ordner `server/`.
2. Installiere die Abhängigkeiten:
   ```bash
   npm install
   ```
3. Erstelle eine `.env`-Datei basierend auf der `.env.example` und trage deinen Notion-API-Key sowie die Datenbank-IDs ein.
4. Kompiliere den Server:
   ```bash
   npm run build # oder npx tsc
   ```

## Nutzung mit Manus

Binde den Server in deine Manus-Konfiguration ein:

```json
{
  "mcpServers": {
    "notion-workspace-manager": {
      "command": "node",
      "args": ["/pfad/zu/deinem/repo/server/dist/index.js"],
      "env": {
        "NOTION_API_KEY": "dein_key",
        "NOTION_PROJECTS_DB": "id",
        "NOTION_TASKS_DB": "id",
        "NOTION_LOGS_DB": "id",
        "NOTION_ERROR_KNOWLEDGE_DB": "id"
      }
    }
  }
}
```

## Lizenz

MIT
