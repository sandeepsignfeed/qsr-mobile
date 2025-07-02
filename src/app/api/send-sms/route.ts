import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, message } = body;

    // Validation
    if (!phone || !message) {
      return NextResponse.json({ error: "Phone and message are required." }, { status: 400 });
    }

    const trimmedPhone = phone.toString().trim();
    const fullNumber = trimmedPhone.startsWith("+91") ? trimmedPhone : `+91${trimmedPhone}`;

    if (!/^\+91\d{10}$/.test(fullNumber)) {
      return NextResponse.json({ error: "Invalid Indian phone number format." }, { status: 400 });
    }

    // Initialize Twilio client
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    // Send SMS
    const response = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: fullNumber,
    });

    return NextResponse.json({
      success: true,
      sid: response.sid,
      to: response.to,
      status: response.status,
    });

  } catch (error: unknown) {
    let errorMessage = "Failed to send SMS";
    let errorStack: string | undefined;

    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
      console.error("Twilio SMS Error:", error);
    } else {
      console.error("Unknown error while sending SMS:", error);
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorStack : undefined,
      },
      { status: 500 }
    );
  }
}
