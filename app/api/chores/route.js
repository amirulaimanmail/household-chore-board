import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../lib/auth";
import { createChore, getAllChores } from "../../../lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json(getAllChores());
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }
    throw error;
  }

  if (
    typeof body?.choreName !== "string" ||
    !body.choreName.trim() ||
    typeof body?.date !== "string" ||
    !body.date.trim()
  ) {
    return NextResponse.json(
      { error: "Chore name and date are required" },
      { status: 400 },
    );
  }

  const chore = createChore(body.choreName.trim(), body.date.trim());
  return NextResponse.json(chore, { status: 201 });
}
