// app/libs/validate.ts
// Validate request bodies with a zod schema. Uses flat result shapes (optional
// fields) rather than discriminated unions, because this project runs with
// `strict: false`, under which union narrowing is unreliable.
import { z } from "zod";
import { NextResponse } from "next/server";

export interface ValidationResult<T> {
  ok: boolean;
  data?: T;
  response?: NextResponse;
}

/** Parse + validate an unknown body against a schema. */
export function validate<T>(schema: z.ZodType<T>, body: unknown): ValidationResult<T> {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid request body";
    return {
      ok: false,
      response: NextResponse.json(
        { message, errors: result.error.flatten().fieldErrors },
        { status: 400 },
      ),
    };
  }
  return { ok: true, data: result.data };
}

export interface JsonResult {
  ok: boolean;
  body?: unknown;
  response?: NextResponse;
}

/** Safely read JSON; returns a 400 response on malformed JSON. */
export async function readJson(req: Request): Promise<JsonResult> {
  try {
    return { ok: true, body: await req.json() };
  } catch {
    return { ok: false, response: NextResponse.json({ message: "Invalid JSON body." }, { status: 400 }) };
  }
}
