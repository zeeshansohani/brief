import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/** Basic email format validation */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 && trimmed.length <= 254 && EMAIL_REGEX.test(trimmed);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawEmail = body?.email;

    if (!isValidEmail(rawEmail)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    const email = rawEmail.trim().toLowerCase();

    const { data, error } = await supabase
      .from("subscribers")
      .upsert(
        { email, active: true },
        { onConflict: "email", ignoreDuplicates: false }
      )
      .select("id, email, subscribed_at")
      .maybeSingle();

    if (error) {
      console.error("[subscribe] Supabase error:", error);
      return NextResponse.json(
        { error: "Unable to save subscription. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        message:
          "You're subscribed. Your first Brief arrives tomorrow morning.",
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON. Send a body with { \"email\": \"you@example.com\" }." },
        { status: 400 }
      );
    }
    console.error("[subscribe] Unexpected error:", e);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
