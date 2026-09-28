import { NextResponse, type NextRequest } from "next/server";
import { getStore } from "@/lib/db";
import { badRequest, handle } from "@/lib/http";
import { parseNewTodo } from "@/lib/validate";

export const dynamic = "force-dynamic";

export const GET = handle(async () => NextResponse.json(await (await getStore()).list()));

export const POST = handle(async (req: NextRequest) => {
  const body = await req.json().catch(() => null);
  const parsed = parseNewTodo(body);
  if (parsed.error !== undefined) return badRequest(parsed.error);
  return NextResponse.json(await (await getStore()).create(parsed.value), { status: 201 });
});
