
import { NextResponse } from "next/server";
import ollama from "ollama";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notes = body.notes;

    if (typeof notes !== "string" || !notes.trim()) {
      return NextResponse.json(
        { error: "Please enter or upload study notes first." },
        { status: 400 }
      );
    }

    const response = await ollama.chat({
      model: "gemma3:4b",
      messages: [
        {
          role: "system",
          content:
            "You are a study assistant. Summarize the provided study notes for exam revision. Use clear headings, concise bullet points, important definitions, key formulas when present, and important distinctions. Stay faithful to the notes, do not invent facts, and do not omit essential concepts. Keep the summary easy to revise quickly.",
        },
        {
          role: "user",
          content: `Create revision notes from this material:\n\n${notes}`,
        },
      ],
    });

    const summary = response.message.content;

    if (!summary?.trim()) {
      throw new Error("The AI returned an empty summary.");
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Summary generation error:", error);

    return NextResponse.json(
      { error: "Could not generate a summary. Please try again." },
      { status: 500 }
    );
  }
}
