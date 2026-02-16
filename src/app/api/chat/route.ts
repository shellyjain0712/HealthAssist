import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
if (!process.env.GEMINI_API_KEY) {
  console.error("⚠️  GEMINI_API_KEY is not set in environment variables!");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

// System prompt for the AI health assistant
const SYSTEM_PROMPT = `You are HealthAssist AI, a compassionate and knowledgeable medical assistant chatbot. Your role is to:

**Core Responsibilities:**
1. Listen carefully to patients' symptoms and concerns with genuine empathy
2. Ask relevant follow-up questions to better understand their condition  
3. Provide informational guidance about potential conditions (NEVER diagnose)
4. Suggest appropriate medical specialists when needed
5. Assess urgency levels: LOW, MEDIUM, HIGH, or EMERGENCY
6. Offer practical self-care advice when appropriate
7. Always remind users you're not a substitute for professional medical care

**Communication Style:**
- Be warm, empathetic, and conversational (not robotic)
- Use natural language - talk like a caring friend who knows medicine
- Ask clarifying questions one or two at a time (don't overwhelm)
- If symptoms suggest emergency care, clearly state this immediately
- Never provide definitive diagnoses - use phrases like "this could be" or "might indicate"
- Keep responses concise but informative (2-4 short paragraphs usually)
- Use bullet points for advice or recommendations when helpful
- Maintain conversation context and refer back to previous messages
- Be culturally sensitive and non-judgmental

**Response Format:**
- Start with empathy and acknowledgment
- Share possible conditions (2-4 max, most likely first)
- Suggest specialists if needed
- Provide practical self-care advice (3-5 actionable tips)
- Assess urgency clearly
- Ask 1-2 follow-up questions to gather more info (unless emergency)
- End with a gentle disclaimer

**Emergency Keywords - If you detect ANY of these, immediately recommend emergency care:**
- Chest pain with sweating/jaw pain/arm pain
- Severe difficulty breathing or can't catch breath
- Sudden severe headache (worst ever)
- Sudden weakness/numbness on one side
- Confusion or difficulty speaking
- Coughing/vomiting blood
- Severe bleeding
- Severe allergic reaction
- Suicidal thoughts
- Seizures

**Remember:** You inform and guide - NEVER diagnose. You're a helpful companion, not a replacement for doctors.`;

// GET - Fetch chat sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      // Fetch specific session with messages
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId: session.user.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!chatSession) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ session: chatSession });
    }

    // Fetch all sessions for user
    const sessions = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 },
    );
  }
}

// POST - Send a message and get AI response
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    // Validate Gemini API key
    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        {
          error:
            "AI service not configured. Please add GEMINI_API_KEY to your environment variables.",
        },
        { status: 500 },
      );
    }

    let chatSession;
    let conversationHistory: { role: string; content: string }[] = [];

    if (sessionId) {
      // Continue existing session - fetch conversation history
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId: session.user.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!chatSession) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 },
        );
      }

      // Build conversation history for context
      conversationHistory = chatSession.messages.map(
        (msg: { role: string; content: string }) => ({
          role: msg.role === "user" ? "user" : "model",
          content: msg.content,
        }),
      );
    } else {
      // Create new session
      chatSession = await prisma.chatSession.create({
        data: {
          userId: session.user.id,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        },
      });
    }

    // Save user message to database
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "user",
        content: message,
      },
    });

    // Generate AI response using Gemini with conversation context
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: SYSTEM_PROMPT }],
        },
        {
          role: "model",
          parts: [
            {
              text: "I understand. I'm HealthAssist AI, your compassionate medical assistant. I'll provide informational guidance with empathy, assess urgency, suggest specialists when needed, and always remind users I'm not a substitute for professional care. I'll be conversational, ask clarifying questions, and prioritize safety. How can I help you today?",
            },
          ],
        },
        ...conversationHistory.map((msg) => ({
          role: msg.role as "user" | "model",
          parts: [{ text: msg.content }],
        })),
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
    });

    const result = await chat.sendMessage(message);
    const aiResponse = result.response.text();

    // Extract urgency level from AI response
    let urgencyLevel: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY" = "LOW";
    const urgencyMatch = aiResponse.match(
      /urgency[:\s]*(LOW|MEDIUM|HIGH|EMERGENCY)/i,
    );
    if (urgencyMatch) {
      urgencyLevel = urgencyMatch[1].toUpperCase() as
        | "LOW"
        | "MEDIUM"
        | "HIGH"
        | "EMERGENCY";
    }

    // Check for emergency keywords in user message
    const emergencyKeywords = [
      "can't breathe",
      "chest pain",
      "severe pain",
      "blood",
      "suicide",
      "kill myself",
      "seizure",
      "unconscious",
      "severe bleeding",
    ];
    const isEmergency = emergencyKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword),
    );
    if (isEmergency) {
      urgencyLevel = "EMERGENCY";
    }

    // Save AI response to database
    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "assistant",
        content: aiResponse,
      },
    });

    // Update session metadata
    await prisma.chatSession.update({
      where: { id: chatSession.id },
      data: {
        urgencyLevel,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      sessionId: chatSession.id,
      message: {
        id: aiMessage.id,
        role: "assistant",
        content: aiResponse,
        createdAt: aiMessage.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error processing message:", error);

    // Handle specific Gemini API errors
    if (error?.message?.includes("API_KEY")) {
      return NextResponse.json(
        {
          error:
            "Invalid API key. Please check your GEMINI_API_KEY environment variable.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to process message. Please try again.",
        details: error?.message,
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete a chat session
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    await prisma.chatSession.delete({
      where: { id: sessionId, userId: session.user.id },
    });

    return NextResponse.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 },
    );
  }
}
