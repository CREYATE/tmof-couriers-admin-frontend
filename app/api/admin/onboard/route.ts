import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    console.log("Onboard proxy - Received form data:", Object.fromEntries(formData));

    const response = await fetch("http://localhost:8080/api/admin/onboard", {
      method: "POST",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
      },
      body: formData,
    });
    console.log("Onboard proxy - Backend status:", response.status);

    let data: any;
    const text = await response.text(); // Read body once
    try {
      data = JSON.parse(text);
    } catch (jsonError) {
      console.error("Onboard proxy - JSON parse error:", jsonError);
      data = { error: text || "Onboarding failed" };
    }

    if (!response.ok) {
      console.error("Onboard proxy - Backend error:", data);
      return NextResponse.json(
        { error: data.error || "Onboarding failed" },
        { status: response.status }
      );
    }

    console.log("Onboard proxy - Backend data:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Onboard proxy - Fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}