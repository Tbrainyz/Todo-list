import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import { badRequest, handle, notFound } from "@/lib/http";
import { parsePatch } from "@/lib/validate";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export const PATCH = handle(async (req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = parsePatch(body);
  if (parsed.error !== undefined) return badRequest(parsed.error);
  const todo = await (await getStore()).update(id, parsed.value);
  return todo ? NextResponse.json(todo) : notFound();
});

export const DELETE = handle(async (_req: NextRequest, { params }: Ctx) => {
  const { id } = await params;
  return (await (await getStore()).remove(id)) ? new NextResponse(null, { status: 204 }) : notFound();
});
