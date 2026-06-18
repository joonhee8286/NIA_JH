import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { findFallbackLaw } from "./src/data/fallbackLawDb"; // note the standard path and extension

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON parser middleware
  app.use(express.json());

  // API 1: Healthcheck
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API 2: Chat with AI Legal Assistant using Gemini 2.5 Flash
  app.post("/api/chat", async (req: express.Request, res: express.Response) => {
    try {
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!geminiKey) {
        return res.status(400).json({
          success: false,
          error: "GEMINI_API_KEY가 서버에 등록되어 있지 않습니다. Google AI Studio 우측 상단의 'Secrets' 메뉴에서 GEMINI_API_KEY를 등록하여 AI 서비스를 복구해 주십시오."
        });
      }

      const { messages = [], query = "" } = req.body;
      if (!query || typeof query !== "string") {
        return res.status(400).json({ success: false, error: "법률 질의 내용을 입력해 주세요." });
      }

      // Query local/fallback law files for keyword matches
      const dbSearch = findFallbackLaw(query);

      // Build context grounding string
      let groundingContext = "";
      if (dbSearch.articles.length > 0) {
        groundingContext += "=== [관련 대한민국 국가법령 조문 정보] ===\n";
        dbSearch.articles.forEach(art => {
          groundingContext += `• [${art.actName} ${art.articleNo} - ${art.title}]\n- 내용: ${art.content}\n- 핵심 요약: ${art.summary}\n\n`;
        });
      }
      if (dbSearch.precedents.length > 0) {
        groundingContext += "=== [관련 대법원 확정 판례 정보] ===\n";
        dbSearch.precedents.forEach(prec => {
          groundingContext += `• [${prec.caseName} (${prec.caseNumber}, ${prec.court})] 선고일: ${prec.judgmentDate}\n- 판결 내용: ${prec.summary}\n- 판시 사항: ${prec.holding}\n\n`;
        });
      }

      const systemInstruction = 
        "귀하는 대한민국 최고 수준의 지능형 대화형 법률 비서 'K-Law Intelligence (국가법령 Q&A)'입니다.\n" +
        "사용자의 일상생활 및 업무 중 발생하는 다양한 법률 질문에 대해 정확하고 신뢰할 수 있으며 가독성이 극대화된 대한민국 법률 해석을 제공합니다.\n\n" +
        "필수 준수 지침:\n" +
        "1. 제공된 [법령 조문 정보] 및 [참고 판례 정보]가 있다면 해당 조항과 선고번호를 명시적으로 언급하고 인용하여 설명하십시오.\n" +
        "2. 사용자가 손쉽게 실천할 수 있는 구체적인 법적 절차(예: 전세금 반환 청구 소송, 내용증명 우편 작성 방법, 임차권등기명령 신청 요건 및 기관, 지방노동조합/지방노동위원회 일방 권고사직 구제신청, 주휴수당 미지급분 계산 방법 등)를 단계별(1단계, 2단계, 3단계 등)로 세밀하고 친절히 고지하여 주십시오.\n" +
        "3. 법률적 논리를 엄격하게 하되, 문체는 친절하고 따뜻하며 조리 있고 전문성이 드러나도록 전개하십시오.\n" +
        "4. **[법적 면책 고지 및 대한법률구조공단 상담 권고]**: 본 AI의 답변은 공식 국가법령 및 판례 자료를 주된 학습 기반으로 생성된 참고 수준의 법률 정보이며 공식 법률 자문이 아닙니다. 실제 이의 제기, 소송, 행정구제 제기 시에는 반드시 전문 변호사나 법무사, 혹은 '대한법률구조공단(국번없이 132)'의 공식 무료법률 상담을 먼저 진행할 것을 정중히 안내하는 면책 문구를 답변 가장 하단에 가로 구분선(---)을 긋고 별도로 굵은 글씨로 노출하십시오.\n" +
        "5. 마크다운 기법(글머리 부호, 굵기 조절, 인용구 등)을 활용하여 줄글 구조를 배제하고 한눈에 읽히는 비주얼 아웃라인 형식으로 답변하십시오.";

      const userPrompt = `사용자의 질문:\n"${query}"\n\n[검색된 실시간 법률 및 판례 DB 자료]:\n${groundingContext || "주어진 쿼리에 대한 특정 매칭 조문은 발견되지 않았습니다. 일반적인 대한민국 헌법·민법·상법·근로기준법 및 관련 안전 법리를 종합하여 답변하십시오."}`;

      // Convert history to @google/genai format
      const formattedHistory = messages.map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

      // Initialize API Client
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      // Perform modeling with gemini-2.5-flash
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          ...formattedHistory,
          { role: "user", parts: [{ text: userPrompt }] }
        ],
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.35,
          topP: 0.9,
        }
      });

      const generatedText = response.text || "답변을 가져오는 데 실패했습니다.";
      
      return res.json({
        success: true,
        response: generatedText,
        sources: dbSearch,
        isFallback: true // Since we have fallback DB active
      });

    } catch (err: any) {
      console.error("Error in server chat endpoint:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "답변 처리 중 알 수 없는 시스템 오류가 발생했습니다."
      });
    }
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static build assets serving...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[K-Law Intelligence] Server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Critical error starting Express + Vite server:", err);
});
