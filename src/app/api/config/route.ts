import { NextResponse } from "next/server";

const USE_MOCK_DATA = process.env.USE_MOCK_DATA === 'true';

export async function GET() {
  return NextResponse.json({
    mode: USE_MOCK_DATA ? "mock" : "real",
    use_mock_data: USE_MOCK_DATA,
    version: "1.0.0",
  });
}
