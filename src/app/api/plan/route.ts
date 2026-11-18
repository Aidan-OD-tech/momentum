import { zodTextFormat } from "openai/helpers/zod";
import { MAX_BRIEF_CHARS } from "@/lib/brief-limits";
import { ModelPlanSchema, PlanRequestSchema, toPlanDraft } from "@/lib/plan-schema";
import type { PlanDraft } from "@/lib/types";
import { getOpenAIClient, MAX_OUTPUT_TOKENS, planModel } from "@/lib/server/openai";
import { buildUserMessage, PLAN_INSTRUCTIONS } from "@/lib/server/plan-prompt";
import { allowPlanRequest, clientIp } from "@/lib/server/rate-limit";

// POST /api/plan: turns a pasted brief into a plan with one model request.
//
// Answers, and what the browser shows for each:
//   200 { ok: true, plan }              plan review
//   400 { reason: "invalid" }           Error 03 (the UI never sends this)
//   413 { reason: "tooLong" }           Error 03 (the UI never sends this)
//   429 { reason: "rateLimited" }       Error 03
//   422 { reason: "unreadable" }        Error 02: refused, not a brief, no requirements, or a reply that fails the schema
//   502 { reason: "failed" }            Error 03: missing key, network or API error, or a reply cut off at the token limit
//   504 { reason: "failed" }            Error 03: no answer within 45 seconds
//
// Privacy: nothing is stored, and the log holds only the status, the reason and the duration.
// Never the brief, the plan or the caller's IP.

export const runtime = "nodejs";
// Seconds. Vercel Hobby and Pro both allow this; the model call itself is stopped at 45.
export const maxDuration = 60;

const MODEL_TIMEOUT_MS = 45_000;

export async function POST(request: Request) {
  const started = Date.now();
  function reply(status: number, body: object, reason: string) {
    console.info(`[api/plan] ${status} ${reason} ${Date.now() - started}ms`);
    return Response.json(body, { status });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return reply(400, { reason: "invalid" }, "invalid-json");
  }
  const input = PlanRequestSchema.safeParse(json);
  if (!input.success) return reply(400, { reason: "invalid" }, "invalid-body");
  const brief = input.data.brief.trim();
  if (brief === "") return reply(400, { reason: "invalid" }, "empty-brief");
  if (brief.length > MAX_BRIEF_CHARS) return reply(413, { reason: "tooLong" }, "too-long");

  if (!allowPlanRequest(clientIp(request))) return reply(429, { reason: "rateLimited" }, "rate-limited");

  const client = getOpenAIClient();
  if (!client) return reply(502, { reason: "failed" }, "missing OPENAI_API_KEY");

  // Stop the model call after 45 seconds, or as soon as the browser gives up (Cancel).
  const timeout = AbortSignal.timeout(MODEL_TIMEOUT_MS);
  let response;
  try {
    response = await client.responses.create(
      {
        model: planModel(),
        instructions: PLAN_INSTRUCTIONS,
        input: buildUserMessage(brief, new Date()),
        text: { format: zodTextFormat(ModelPlanSchema, "plan") },
        max_output_tokens: MAX_OUTPUT_TOKENS,
      },
      { signal: AbortSignal.any([request.signal, timeout]) },
    );
  } catch (error) {
    if (timeout.aborted) return reply(504, { reason: "failed" }, "timeout");
    if (request.signal.aborted) return reply(502, { reason: "failed" }, "aborted-by-client");
    return reply(502, { reason: "failed" }, `api-error ${describeError(error)}`);
  }

  const result = readPlan(response);
  if (result === "cutOff") return reply(502, { reason: "failed" }, "cut-off-at-token-limit");
  if (result === "unreadable") return reply(422, { reason: "unreadable" }, "unreadable");
  return reply(200, { ok: true, plan: result }, "ok");
}

// The fields of a Responses API reply this route reads.
type ModelReply = {
  status?: string | null;
  incomplete_details?: { reason?: string } | null;
  output: Array<{ type: string; content?: Array<{ type: string }> }>;
  output_text: string;
};

// One parse attempt, no repair (scope item 15).
function readPlan(response: ModelReply): PlanDraft | "unreadable" | "cutOff" {
  if (response.status === "incomplete") {
    // Cut off at the token limit is our failure, not the brief's (risk review, item B).
    return response.incomplete_details?.reason === "content_filter" ? "unreadable" : "cutOff";
  }
  const refused = response.output.some((item) => item.content?.some((part) => part.type === "refusal"));
  if (refused) return "unreadable";

  let json: unknown;
  try {
    json = JSON.parse(response.output_text);
  } catch {
    return "unreadable";
  }
  const parsed = ModelPlanSchema.safeParse(json);
  if (!parsed.success) return "unreadable";
  return toPlanDraft(parsed.data) ?? "unreadable";
}

// "404 model_not_found" from an API error, or the error's name. Never its message, which could
// quote the request.
function describeError(error: unknown): string {
  if (error && typeof error === "object") {
    const { status, code, name } = error as { status?: number; code?: string | null; name?: string };
    if (status || code) return [status, code].filter(Boolean).join(" ");
    if (name) return name;
  }
  return "unknown";
}
