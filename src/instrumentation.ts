import type { Instrumentation } from "next";

/** Alle uhåndterte serverfeil (render, route handlers, server actions) rapporteres til Studio. */
export const onRequestError: Instrumentation.onRequestError = async (err, request) => {
  const { reportError } = await import("./lib/report-error");
  reportError({
    metric: "server_error",
    message: err instanceof Error ? err.message : String(err),
    path: request.path,
    detail: { method: request.method },
  });
};
