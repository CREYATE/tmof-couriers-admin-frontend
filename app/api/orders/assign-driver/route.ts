import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Orders assign-driver proxy - Received body:", body);
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/orders/assign-driver`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(request.headers.get("Authorization") && { Authorization: request.headers.get("Authorization")! }),
      },
      body: JSON.stringify(body),
    });
    console.log("Orders assign-driver proxy - Backend status:", response.status);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Orders assign-driver proxy - Backend error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to assign driver" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Orders assign-driver proxy - Backend data:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Orders assign-driver proxy - Fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}