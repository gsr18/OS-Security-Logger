import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const { error } = await supabase.from('security_events').select('id').limit(1);

  return NextResponse.json({
    status: error ? "error" : "ok",
    backend: "nextjs",
    db: error ? "disconnected" : "connected",
    mode: "supabase",
    timestamp: new Date().toISOString(),
  });
}
