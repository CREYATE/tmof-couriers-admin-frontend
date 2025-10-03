import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Auth proxy - Received body:", body);
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const response = await fetch(`${backendUrl}/api/employee/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(request.headers.get("Authorization") && { Authorization: request.headers.get("Authorization")! }),
      },
      body: JSON.stringify(body),
    });
    console.log("Auth proxy - Backend status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Auth proxy - Backend error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Login failed" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Auth proxy - Backend data:", data);
    const jwt = data.token;

    // Return the JWT in the response
    return NextResponse.json(
      { token: jwt },
      {
        status: 200,
        headers: {
          "Set-Cookie": `jwt=${jwt}; Path=/; HttpOnly; SameSite=Strict`,
        },
      }
    );
  } catch (error) {
    console.error("Auth proxy - Fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}