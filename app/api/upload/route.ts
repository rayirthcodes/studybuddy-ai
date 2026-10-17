
import { NextResponse } from "next/server";
import { extractText } from "unpdf";
import mammoth from "mammoth";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a file to upload." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "The selected file is empty." },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File must be smaller than 10 MB." },
        { status: 400 }
      );
    }

    const filename = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    if (filename.endsWith(".pdf")) {
      const result = await extractText(new Uint8Array(buffer), {
        mergePages: true,
      });

      extractedText = result.text;
    } else if (filename.endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      return NextResponse.json(
        { error: "Please upload a PDF or DOCX file." },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        {
          error:
            "No readable text found. Scanned PDFs may require OCR.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      filename: file.name,
      text: extractedText,
    });
  } catch (error) {
    console.error("File upload error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not read this file.",
      },
      { status: 500 }
    );
  }
}
