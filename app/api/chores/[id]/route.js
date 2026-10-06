import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";
import { authOptions } from "../../../../lib/auth";
import { deleteChore, updateChore } from "../../../../lib/db";

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json({ error: "Invalid chore ID" }, { status: 400 });
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

  const updated = updateChore(
    Number(id),
    body.choreName.trim(),
    body.date.trim(),
  );
  if (!updated) {
    return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id)) {
    return NextResponse.json({ error: "Invalid chore ID" }, { status: 400 });
  }

  const deleted = deleteChore(Number(id));
  if (!deleted) {
    return NextResponse.json({ error: "Chore not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
