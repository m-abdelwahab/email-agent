import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { db } from "~/lib/db";
import { messages } from "~/lib/db/schema";

const emailSchema = z.object({
  id: z.string(),
  subject: z.string(),
  from: z.string(),
  to: z.string(),
  date: z.string(),
  body: z.string(),
  attachments: z.array(
    z.object({ name: z.string(), type: z.string(), size: z.number() }),
  ),
});

export async function POST(request: Request) {
  try {
    const secret = request.headers.get("X-Webhook-Secret");

    if (!secret) {
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 401 },
      );
    }

    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (secret !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validatedData = emailSchema.parse(body);

    // TODO: Generate summary and labels using the AI SDK
    // Documentation: https://sdk.vercel.ai/docs/reference/ai-sdk-core/generate-object

    const summary = "This is a test summary";
    const labels = ["test", "test2"];

    await db
      .insert(messages)
      .values({
        id: validatedData.id,
        subject: validatedData.subject,
        from: validatedData.from,
        to: validatedData.to,
        body: validatedData.body,
        attachments: JSON.stringify(validatedData.attachments),
        summary: summary, // TODO: Replace with the actual summary from the AI SDK
        labels: labels, // TODO: Replace with the actual labels from the AI SDK
        date: validatedData.date,
      })
      .onConflictDoNothing({ target: messages.id });

    return NextResponse.json({
      status: "success",
      data: {
        email: validatedData,
        summary: summary, // TODO: Replace with the actual summary from the AI SDK
        labels: labels, // TODO: Replace with the actual labels from the AI SDK
      },
    });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
