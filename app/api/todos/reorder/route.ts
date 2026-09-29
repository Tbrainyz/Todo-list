import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import { badRequest, handle } from "@/lib/http";
import { parseReorder } from "@/lib/validate";

export const dynamic = "force-dynamic";

export const PATCH = handle(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const parsed = parseReorder(body);
  if (parsed.error !== undefined) return badRequest(parsed.error);
  return NextResponse.json(await (await getStore()).reorder(parsed.value));
});
