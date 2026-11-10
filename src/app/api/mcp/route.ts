/**
 * MCP-endepunkt (Streamable HTTP, stateless) for kundens agenter.
 * Autentisering: header `x-agent-key: <nøkkel>` eller `Authorization: Bearer <nøkkel>`;
 * nøkler i AGENT_API_KEYS. Alt logges med agentnavn.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { getAdapter } from "@/content";
import { identify } from "@/mcp/auth";
import { createMcpServer } from "@/mcp/server";

export const dynamic = "force-dynamic";

async function handle(req: Request) {
  const agent = identify(req);
  if (!agent)
    return Response.json(
      { error: "Ugyldig eller manglende agent-nøkkel" },
      { status: 401 },
    );

  const adapter = await getAdapter();
  const tokensCss = await fs
    .readFile(path.join(process.cwd(), "src/design/tokens.css"), "utf8")
    .catch(() => undefined);
  const server = createMcpServer({ adapter, agent, tokensCss });
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });
  await server.connect(transport);
  console.log(`[mcp] ${agent.name} ${req.method}`);
  try {
    return await transport.handleRequest(req);
  } finally {
    await transport.close().catch(() => {});
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
