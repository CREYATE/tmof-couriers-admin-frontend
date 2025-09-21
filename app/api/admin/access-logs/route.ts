import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get("Authorization")?.split(" ")[1]; // Expecting "Bearer <token>"
    if (!token) {
      console.error("Access logs proxy - No token provided");
      return NextResponse.json({ error: "No token provided" }, { status: 401 });
    }
    console.log("Access logs proxy - Received token:", token.substring(0, 20) + "...");
    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/admin/access-logs`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
      },
    });
    console.log("Access logs proxy - Backend status:", response.status);
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error("Access logs proxy - Backend error:", errorData);
      } catch (jsonError) {
        console.error("Access logs proxy - Failed to parse JSON:", jsonError);
        errorData = { error: "Failed to fetch access logs" };
      }
      return NextResponse.json(
        { error: errorData.error || "Failed to fetch access logs" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Access logs proxy - Backend data:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Access logs proxy - Fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}