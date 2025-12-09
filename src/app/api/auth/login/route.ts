import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as bcrypt from "bcryptjs";
import * as jose from "jose";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const JWT_SECRET = process.env.JWT_SECRET_KEY || "dev-secret-key-change-in-production";
const JWT_EXPIRY_HOURS = parseInt(process.env.JWT_EXPIRY_HOURS || "24");

async function createAccessToken(user: { id: number; email: string; role: string }) {
  const secret = new TextEncoder().encode(JWT_SECRET);
  const token = await new jose.SignJWT({
    sub: String(user.id),
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRY_HOURS}h`)
    .sign(secret);
  return token;
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase().trim())
      .single();

    if (error || !user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const accessToken = await createAccessToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
