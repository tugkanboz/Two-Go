// Type declarations for the two-go MCP server.

export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface JsonRpcMessage {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}

export interface McpServer {
  handle(message: JsonRpcMessage): Promise<JsonRpcResponse | null>;
  tools: McpTool[];
  serverInfo: { name: string; version: string };
  protocolVersion: string;
}

/** Create a transport-agnostic MCP server for two-go. */
export declare function createServer(info?: { name?: string; version?: string }): McpServer;
