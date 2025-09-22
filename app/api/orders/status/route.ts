import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statuses = searchParams.get("statuses") || "PAID,AWAITING_COLLECTION";
    console.log("Orders status proxy - Statuses:", statuses);

    const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";
    const response = await fetch(`${backendUrl}/api/orders/status?statuses=${encodeURIComponent(statuses)}`, {
      method: "GET",
      headers: {
        ...(request.headers.get("Authorization") && { Authorization: request.headers.get("Authorization")! }),
        "Content-Type": "application/json",
      },
    });

    console.log("Orders status proxy - Backend status:", response.status);
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (jsonError) {
        errorData = { error: `Backend error: ${response.statusText}` };
      }
      console.error("Orders status proxy - Backend error:", errorData);
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch orders" },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("Orders status proxy - Invalid content type:", contentType);
      return NextResponse.json(
        { error: "Invalid response format from backend" },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log("Orders status proxy - Backend data:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Orders status proxy - Fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 }
    );
  }
}