import { NextResponse } from "next/server";

export async function GET() {
  try {
    const secretKey = process.env.NEXT_PUBLIC_PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      console.error("Paystack proxy - Missing PAYSTACK_SECRET_KEY environment variable");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const url = `https://api.paystack.co/transaction?status=success&perPage=100`;
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    if (!response.ok) {
      console.error(`Paystack proxy - Failed to fetch transactions: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `Failed to fetch transactions from Paystack: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data.data, { status: 200 });
  } catch (error) {
    console.error("Paystack proxy - Fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}