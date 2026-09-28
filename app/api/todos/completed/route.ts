import { NextResponse } from "next/server";
import { getStore } from "@/lib/db";
import { handle } from "@/lib/http";

export const dynamic = "force-dynamic";

export const DELETE = handle(async () => NextResponse.json({ deleted: await (await getStore()).clearCompleted() }));
