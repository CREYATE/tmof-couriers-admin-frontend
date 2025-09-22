import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    console.log("Admin drivers available proxy - Request headers:", request.headers.get("Authorization"));
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/admin/drivers/available`, {
      method: "GET",
      headers: {
        ...(request.headers.get("Authorization") && { Authorization: request.headers.get("Authorization")! }),
      },
    });
    console.log("Admin drivers available proxy - Backend status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Admin drivers available proxy - Backend error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch available drivers" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Admin drivers available proxy - Backend data length:", data.length);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Admin drivers available proxy - Fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}