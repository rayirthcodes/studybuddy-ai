
import { NextResponse } from "next/server";
import ollama from "ollama";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const notes = body.notes;

    if (typeof notes !== "string" || !notes.trim()) {
      return NextResponse.json(
        { error: "Please enter your study notes first." },
        { status: 400 }
      );
    }

    const response = await ollama.chat({
      model: "gemma3:4b",
      messages: [
        {
          role: "system",
          content: `Create exactly 5 multiple-choice questions using only the supplied study notes.
Return ONLY valid JSON, with no markdown fences, in this format:
{
  "questions": [
    {
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "explanation": "Brief explanation"
    }
  ]
}
Every question must have exactly four options.
correctAnswer must be an integer from 0 to 3.
Include an explanation for every answer.`,
        },
        {
          role: "user",
          content: `Create a quiz from these notes:\n\n${notes}`,
        },
      ],
      format: "json",
    });

    const quiz = JSON.parse(response.message.content);

    if (
      !Array.isArray(quiz.questions) ||
      quiz.questions.length !== 5 ||
      !quiz.questions.every(
        (q: any) =>
          typeof q.question === "string" &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          Number.isInteger(q.correctAnswer) &&
          q.correctAnswer >= 0 &&
          q.correctAnswer <= 3 &&
          typeof q.explanation === "string"
      )
    ) {
      throw new Error("The AI returned an invalid quiz format. Please try again.");
    }

    return NextResponse.json({ questions: quiz.questions });
  } catch (error) {
    console.error("Quiz generation error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown quiz generation error",
      },
      { status: 500 }
    );
  }
}
