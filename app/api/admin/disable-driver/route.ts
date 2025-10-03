import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Disable driver proxy - Received body:", body);

    const response = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8080'}/api/admin/disable-driver`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: request.headers.get("Authorization") || "",
      },
      body: JSON.stringify(body),
    });
    console.log("Disable driver proxy - Backend status:", response.status);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
        console.error("Disable driver proxy - Backend error:", errorData);
      } catch (jsonError) {
        console.error("Disable driver proxy - Failed to parse JSON:", jsonError);
        errorData = { error: "Failed to disable driver" };
      }
      return NextResponse.json(
        { error: errorData.error || "Failed to disable driver" },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("Disable driver proxy - Backend data:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Disable driver proxy - Fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}