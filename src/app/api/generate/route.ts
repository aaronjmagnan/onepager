import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const STYLE_DESCRIPTIONS: Record<string, string> = {
  executive:
    "Refined, authoritative, serif headings (Playfair Display from Google Fonts), structured layout, dark navy header block, premium consulting aesthetic, strong typographic hierarchy. Think McKinsey or Bain one-pager.",
  bold: "High contrast, Syne display font (Google Fonts), confident startup energy, light background, bold section labels, Google-color-inspired accents (blue, red, yellow, green used sparingly). Think a Y Combinator demo day handout.",
  minimal:
    "Ultra-minimal, whitespace-forward, DM Sans throughout (Google Fonts), muted palette of grays and off-whites, sophisticated restraint, thin rules as dividers. Think Apple product brief.",
  warm: "Approachable, editorial, warm cream tones (#faf6f1 background), rounded 8px elements, conversational but credible. Use Lora for headings and DM Sans for body (Google Fonts). Think a warm nonprofit annual report.",
  tech: "Monospace accents (JetBrains Mono from Google Fonts), crisp grid layout, developer-forward, subtle code-adjacent details like inline code blocks for key terms, light gray background sections. Think Stripe or Vercel documentation.",
  education:
    "Clear hierarchy, accessible, trustworthy, muted institutional blue palette (#1e3a5f, #e8f0fe), role badges as small colored pills, DM Sans body with Syne headings (Google Fonts). Friendly but professional. Think a university department handout.",
};

export async function POST(req: NextRequest) {
  try {
    const { title, tagline, body, cta, contact, docType, style } =
      await req.json();

    if (!title || !body) {
      return NextResponse.json(
        { error: "Title and body content are required" },
        { status: 400 }
      );
    }

    const styleDesc = STYLE_DESCRIPTIONS[style] || STYLE_DESCRIPTIONS.executive;

    const client = new Anthropic();

    const prompt = `You are a world-class document designer. Generate a single, complete, self-contained HTML document — a one-page ${docType || "document"}.

Return ONLY raw HTML. No markdown. No backticks. No preamble. No explanation. Just the complete HTML starting with <!DOCTYPE html>.

CONTENT:
- Title: ${title}
- Subtitle: ${tagline || "(none)"}
- Body content: ${body}
- Call to action: ${cta || "(none)"}
- Contact: ${contact || "(none)"}

DESIGN STYLE: ${styleDesc}

REQUIREMENTS:
- Complete HTML document with <!DOCTYPE html>, <html>, <head>, <body>
- Load any Google Fonts you use via <link> tags in the <head>
- All CSS must be in a single <style> tag in the <head> — no external stylesheets except Google Fonts
- Design for both screen and print. Use print-color-adjust: exact and -webkit-print-color-adjust: exact on ALL colored elements (backgrounds, colored text, badges, headers)
- The document body must have a LIGHT background so it prints cleanly. Dark headers or accent blocks are fine, but the main body background must be white or near-white.
- The page should look like it was designed by a professional graphic designer — strong typography, intentional whitespace, visual hierarchy
- Use semantic HTML. Structure the content logically with headings, sections, and clear visual breaks.
- The entire document must fit beautifully on a single page when printed at standard US Letter size
- Make it responsive so it also looks great on screen at any width
- Do NOT include any JavaScript`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No content generated" },
        { status: 500 }
      );
    }

    let html = textBlock.text.trim();

    // Strip markdown code fences if present
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\s*\n?/, "").replace(/\n?```\s*$/, "");
    }

    return NextResponse.json({ html });
  } catch (e: unknown) {
    console.error("Generation error:", e);
    const message =
      e instanceof Error ? e.message : "Failed to generate document";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
