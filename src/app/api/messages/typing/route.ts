import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/lib/auth";
import { setTyping } from "@/lib/typing-store";

export async function POST(req: NextRequest) {
  const auth = getAuth(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { receiverId } = await req.json();
    if (!receiverId) return NextResponse.json({ error: "Missing receiverId" }, { status: 400 });

    // Set typing status for (sender -> receiver)
    setTyping(auth.userId, receiverId);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
