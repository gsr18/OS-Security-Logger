import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as jose from "jose";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qsqxwpkjmvriukmbbtex.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFzcXh3cGtqbXZyaXVrbWJidGV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTI5ODUxOCwiZXhwIjoyMDgwODc0NTE4fQ.YmxjNmmlMNxsupCRK56iL5x54yLej0yL5VL81iHjngw';
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET_KEY || "seclogger-jwt-secret-key-2025";

async function verifyToken(token: string) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const { payload } = await jose.jwtVerify(token, secret);
  return payload;
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    
    let payload;
    try {
      payload = await verifyToken(token);
    } catch {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const userId = parseInt(payload.sub as string);
    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, full_name, role, created_at")
      .eq("id", userId)
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      created_at: user.created_at,
    });
  } catch (err) {
    console.error("Get user error:", err);
    return NextResponse.json({ error: "Failed to get user" }, { status: 500 });
  }
}