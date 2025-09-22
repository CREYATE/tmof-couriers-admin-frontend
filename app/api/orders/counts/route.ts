import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("Orders counts proxy - Request headers:", request.headers.get("Authorization"));
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/orders/counts`, {
      method: "GET",
      headers: {
        ...(request.headers.get("Authorization") && { Authorization: request.headers.get("Authorization")! }),
      },
    });
    console.log("Orders counts proxy - Backend status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Orders counts proxy - Backend error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch counts" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Orders counts proxy - Backend data:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Orders counts proxy - Fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}