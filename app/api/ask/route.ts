
import { NextResponse } from "next/server";
import ollama from "ollama";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = body.question;
    const notes = body.notes ?? "";

    if (typeof question !== "string" || !question.trim()) {
      return NextResponse.json(
        { error: "Please enter a question." },
        { status: 400 }
      );
    }

    const response = await ollama.chat({
      model: "gemma3:4b",
      messages: [
        {
          role: "system",
          content:
            "You are StudyBuddy AI, a friendly study tutor. Explain concepts clearly in simple language, use the student's notes when provided, and give step-by-step explanations.",
        },
        {
          role: "user",
          content: `Study notes:\n${notes || "No notes provided."}\n\nQuestion:\n${question}`,
        },
      ],
    });

    return NextResponse.json({
      answer: response.message.content,
    });
  } catch (error) {
    console.error("StudyBuddy AI error:", error);

    return NextResponse.json(
      {
        error:
          "Could not get an answer from Gemma. Check that Ollama is running.",
      },
      { status: 500 }
    );
  }
}
