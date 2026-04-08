import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

function validateSecret(request: NextRequest): boolean {
  const secret = request.nextUrl.searchParams.get("secret");
  const expectedSecret = process.env.REVALIDATION_SECRET;
  if (!expectedSecret) {
    console.warn("REVALIDATION_SECRET is not set");
    return false;
  }
  return secret === expectedSecret;
}

export async function GET(request: NextRequest) {
  if (!validateSecret(request)) {
    return NextResponse.json(
      { error: "Invalid or missing revalidation secret" },
      { status: 401 }
    );
  }

  const path = request.nextUrl.searchParams.get("path");

  if (!path) {
    return NextResponse.json(
      { error: "Missing required query param: path" },
      { status: 400 }
    );
  }

  try {
    revalidatePath(path);
    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Revalidation failed", details: String(err) },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  if (!validateSecret(request)) {
    return NextResponse.json(
      { error: "Invalid or missing revalidation secret" },
      { status: 401 }
    );
  }

  let path: string | undefined;

  try {
    const body = await request.json();
    path = body.path ?? request.nextUrl.searchParams.get("path") ?? undefined;
  } catch {
    path = request.nextUrl.searchParams.get("path") ?? undefined;
  }

  if (!path) {
    return NextResponse.json(
      { error: "Missing required param: path (query string or JSON body)" },
      { status: 400 }
    );
  }

  try {
    revalidatePath(path);
    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Revalidation failed", details: String(err) },
      { status: 500 }
    );
  }
}
