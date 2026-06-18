import React, { useState, useEffect, useRef } from "react";
import {
  Scale,
  Plus,
  MessageSquare,
  Trash2,
  Edit3,
  Send,
  Sparkles,
  BookOpen,
  Menu,
  X,
  User,
  Database,
  Info,
  ArrowRight,
  CheckCircle,
  HelpCircle,
  Shield,
  FileText,
  AlertTriangle,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ChatSession, Message } from "./types";
import { findFallbackLaw, LawArticle, LawPrecedent } from "./data/fallbackLawDb";
import LawDbViewer from "./components/LawDbViewer";

// Default template queries to help users get started immediately
const QUICK_TEMPLATES = [
  {
    title: "임대차 보증금 회수",
    query: "전세 계약이 끝났는데 집주인이 돈이 없다며 보증금을 돌려주지 않습니다. 대항력과 확정일자가 있는데 저는 어떻게 처신해야 하나요?",
    icon: Shield,
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20"
  },
  {
    title: "임대인 실거주 갱신거절",
    query: "임대인이 실거주를 하겠다면서 임대차 계약 갱신 요구를 거절했습니다. 제가 실제로 실거주 여부를 확인하거나 대처할 방법이 있나요?",
    icon: FileText,
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
  },
  {
    title: "알바 주휴수당 요구",
    query: "편의점에서 주당 16시간 개근하며 한 달째 아르바이트 중인데 주휴수당을 받을 수 있나요? 점주가 알바는 안 줘도 된다고 합니다.",
    icon: Scale,
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20"
  },
  {
    title: "부당해고 구제신청",
    query: "상시 10인 이상 회사인데 말다툼 끝에 사장님이 내일부터 나오지 말라고 말했습니다. 부당해고에 해당하며 위로금이나 예고수당을 받나요?",
    icon: AlertTriangle,
    color: "text-red-500 bg-red-500/10 border-red-500/20"
  }
];

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDbViewerOpen, setIsDbViewerOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Profile configuration
  const [username, setUsername] = useState("익명의 한소생");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempUsername, setTempUsername] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load username & chat sessions from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem("klaw_username");
    if (savedName) {
      setUsername(savedName);
      setTempUsername(savedName);
    } else {
      setTempUsername("익명의 한소생");
    }

    const savedSessions = localStorage.getItem("klaw_sessions");
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (parsed && parsed.length > 0) {
          setSessions(parsed);
          setActiveSessionId(parsed[0].id);
          return;
        }
      } catch (e) {
        console.error("Failed to parse sessions", e);
      }
    }

    // Seed default welcoming session
    const defaultWelcomeSession: ChatSession = {
      id: "welcome-session",
      title: "💡 첫 국가법령 가이드",
      createdAt: new Date().toLocaleDateString(),
      messages: [
        {
          id: "msg-welcome",
          role: "model",
          content: "안녕하세요! **K-Law Intelligence (국가법령 Q&A)** 비서 서비스에 오신 것을 환영합니다.\n\n" +
            "저는 대한민국 국가법령 및 대법원의 판례 자료를 기반으로 일상생활에서 발생할 수 있는 분쟁이나 노동·임대차 법률 상담 정보를 알기 쉽게 가이드해 드립니다.\n\n" +
            "### ⚖️ 제공해 드릴 수 있는 핵심 가이드:\n" +
            "- **주택/상가 임대차**: 전세 계약 연장, 임대인 실거주 거절 사유, 대항력·우선변제권 확보 조건 및 보증금 반환 소송 과정 가이드\n" +
            "- **근로기준 및 고용**: 부당해고 제한 요건, 30일 해고 예고 수당 기준, 근로시간별 유급 주휴수당 미지급 대처 경로\n" +
            "- **일반 민법 및 불법행위**: 임대 물품 하자수선의무 책임 범위, 채무불이행 및 타인 불법행위에 따른 실질적 손해배상 청구 소송 요지\n\n" +
            "--- \n" +
            "**[오프라인 안전 백업 DB 작동 중]**\n" +
            "현재 본 시스템은 임대차보호법과 근로기준법의 중추 법조문 및 대법원 랜드마크 판결례로 구성된 **오프라인 안전 DB**를 실시간 참조하고 있습니다. 어떠한 점검 환경하에서도 중단 없는 고결성 답변 생성이 보장됩니다.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: {
            articles: [],
            precedents: []
          }
        }
      ]
    };
    setSessions([defaultWelcomeSession]);
    setActiveSessionId(defaultWelcomeSession.id);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("klaw_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  // Auto scroll to chat bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessions, isLoading, activeSessionId]);

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Handler: Start a fresh session
  const createNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: "📝 새로운 법률 상담",
      createdAt: new Date().toLocaleDateString(),
      messages: [
        {
          id: `msg-welcome-${Date.now()}`,
          role: "model",
          content: "새로운 법률 상담 채팅방이 개설되었습니다.\n\n해결하고자 하시는 계약서상의 의문점, 고용 분쟁, 또는 대항력 발생 등 다양한 법률 상황에 대해 질문해 주십시오. 구체적인 해결 절차와 법 조항 및 판례 인용 정보 위주로 정성껏 지연 없이 안내해 드리겠습니다.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }
      ]
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newId);
    setErrorMessage(null);
    if (sidebarOpen) setSidebarOpen(false);
  };

  // Handler: Save profile name
  const saveProfileName = () => {
    const trimmed = tempUsername.trim();
    if (trimmed) {
      setUsername(trimmed);
      localStorage.setItem("klaw_username", trimmed);
      setIsEditingName(false);
    }
  };

  // Handler: Delete session
  const deleteSession = (evt: React.MouseEvent, idToDelete: string) => {
    evt.stopPropagation();
    const filtered = sessions.filter((s) => s.id !== idToDelete);
    if (filtered.length === 0) {
      // Re-create default if all deleted
      const freshId = "welcome-session";
      const resetSession: ChatSession = {
        id: freshId,
        title: "💡 첫 국가법령 가이드",
        createdAt: new Date().toLocaleDateString(),
        messages: [
          {
            id: "msg-welcome-reset",
            role: "model",
            content: "초기화되었습니다. 자유롭게 법률 상담을 시작해보세요.",
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          }
        ]
      };
      setSessions([resetSession]);
      setActiveSessionId(freshId);
    } else {
      setSessions(filtered);
      if (activeSessionId === idToDelete) {
        setActiveSessionId(filtered[0].id);
      }
    }
  };

  // Handler: Rename session title
  const renameSession = (id: string) => {
    const oldTitle = sessions.find((s) => s.id === id)?.title || "";
    const newTitle = prompt("상담방의 새로운 제목을 입력하세요:", oldTitle);
    if (newTitle && newTitle.trim()) {
      setSessions(
        sessions.map((s) => (s.id === id ? { ...s, title: newTitle.trim() } : s))
      );
    }
  };

  // Render markdown helper
  const parseMessageContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, index) => {
      // 1. Divider line
      if (line.trim() === "---") {
        return <hr key={index} className="my-5 border-zinc-800" />;
      }

      // 2. Actionable disclaimer card formatter
      if (
        line.includes("법적 책임 면책") ||
        line.includes("면책 고지") ||
        line.includes("Disclaimer") ||
        line.includes("공식적인 법적 효력")
      ) {
        return (
          <div
            key={index}
            className="mt-5 p-4 bg-red-950/20 border border-red-900/40 rounded-xl text-[11px] text-zinc-300 leading-relaxed font-sans flex gap-3"
          >
            <Info className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-red-400 block mb-1">⚖️ K-Law AI 안내 및 지침 면책 고시:</span>
              <span>{line.replace(/^[*\s-]+/, "")}</span>
            </div>
          </div>
        );
      }

      // 3. Header formatting
      if (line.startsWith("### ")) {
        return (
          <h4 key={index} className="text-zinc-100 font-bold text-sm tracking-tight mt-4 mb-2 flex items-center gap-2">
            <span className="w-1.5 h-3 bg-red-600 rounded"></span>
            {line.replace("### ", "")}
          </h4>
        );
      }
      if (line.startsWith("## ")) {
        return (
          <h3
            key={index}
            className="text-zinc-500 font-extrabold text-xs tracking-wider uppercase mt-5 mb-2.5 border-b border-zinc-800 pb-1.5"
          >
            {line.replace("## ", "")}
          </h3>
        );
      }
      if (line.startsWith("# ")) {
        return (
          <h2 key={index} className="text-zinc-100 font-extrabold text-lg tracking-tight mt-6 mb-3 text-red-500">
            {line.replace("# ", "")}
          </h2>
        );
      }

      // 4. List elements
      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        const bulletContent = line.trim().replace(/^[-*]\s+/, "");
        return (
          <li key={index} className="ml-5 list-disc text-sm text-zinc-300 leading-relaxed py-0.5">
            {renderBoldText(bulletContent)}
          </li>
        );
      }

      // 5. Linebreaks
      if (line.trim() === "") {
        return <div key={index} className="h-2.5" />;
      }

      // 6. Normal text
      return (
        <p key={index} className="text-sm text-zinc-300 leading-relaxed py-1">
          {renderBoldText(line)}
        </p>
      );
    });
  };

  const renderBoldText = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <strong key={i} className="text-zinc-100 font-bold bg-zinc-800/40 px-1 rounded border border-zinc-750">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  // Active chat query execution
  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim()) return;

    setIsLoading(true);
    setErrorMessage(null);

    const userMsg: Message = {
      id: `msg-user-${Date.now()}`,
      role: "user",
      content: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    setInputMessage("");

    const updatedMessages = [...activeSession.messages, userMsg];
    
    let updatedTitle = activeSession.title;
    if (activeSession.title.includes("새로운 법률 상담") || activeSession.title.includes("첫 국가법령")) {
      updatedTitle = queryText.length > 15 ? queryText.substring(0, 15) + "..." : queryText;
    }

    setSessions(
      sessions.map((s) =>
        s.id === activeSessionId
          ? { ...s, title: updatedTitle, messages: updatedMessages }
          : s
      )
    );

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: activeSession.messages,
          query: queryText
        })
      });

      const data = await response.json();

      if (data.success) {
        const modelMsg: Message = {
          id: `msg-model-${Date.now()}`,
          role: "model",
          content: data.response,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          sources: data.sources
        };

        setSessions(
          sessions.map((s) =>
            s.id === activeSessionId
              ? { ...s, title: updatedTitle, messages: [...updatedMessages, modelMsg] }
              : s
          )
        );
      } else {
        setErrorMessage(data.error || "답변을 가져오는 중 오류가 발생했습니다.");
      }
    } catch (err: any) {
      console.error("Error sending message:", err);
      setErrorMessage("서버와 통신하는 중 오류가 발생했습니다. 네트워크 연결을 확인하고 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 flex flex-col md:flex-row font-sans overflow-hidden">
      
      {/* MOBILE HEADER BAR */}
      <div className="md:hidden w-full bg-[#1e293b] border-b border-slate-700/50 p-4 flex items-center justify-between z-25">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-red-650 rounded flex items-center justify-center font-black text-white shrink-0">K</div>
          <span className="font-bold tracking-tight text-slate-200 uppercase font-display text-sm">국가법령 Q&A</span>
          <span className="text-[9px] font-bold bg-red-500/10 border border-red-500/20 text-red-500 px-1.5 py-0.5 rounded tracking-widest uppercase font-mono">
            안전 모드
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsDbViewerOpen(true)}
            className="p-1.5 text-slate-400 bg-[#0f172a] border border-slate-700/60 rounded hover:text-slate-100"
            title="법령집 열기"
          >
            <BookOpen className="h-4 w-4" />
          </button>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 text-slate-400 bg-[#0f172a] border border-slate-700/60 rounded hover:text-slate-100"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SIDEBAR CONTAINER (DESKTOP & MOBILE SIDE DRAWER) */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-zinc-950 border-r border-zinc-850 flex flex-col transform md:transform-none md:static transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-zinc-855 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-red-950/40 text-red-500 rounded-lg border border-red-900/30">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100 tracking-tight">K-Law Intelligence</h1>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wider">법령 및 판례 도우미</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1 bg-zinc-900 border border-zinc-800 hover:text-zinc-100 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Action: Create New Consulting room */}
        <div className="p-4 bg-zinc-950">
          <button
            onClick={createNewSession}
            className="w-full py-2.5 px-4 bg-red-950/30 hover:bg-red-950/50 border border-red-900/35 text-red-400 rounded-xl flex items-center justify-center gap-2.5 text-xs font-semibold tracking-tight transition-all active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            새로운 상담 시작하기
          </button>
        </div>

        {/* History / Sessions Directory */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 bg-zinc-950/60 font-sans">
          <div className="px-3 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest block">
            역대 상세 상담 기록
          </div>
          {sessions.map((item) => {
            const isActive = item.id === activeSessionId;
            return (
              <div
                key={item.id}
                onClick={() => {
                  setActiveSessionId(item.id);
                  if (sidebarOpen) setSidebarOpen(false);
                }}
                className={`group px-3 py-2.5 rounded-xl cursor-pointer flex items-center justify-between text-xs tracking-tight transition-all ${
                  isActive
                    ? "bg-zinc-900 border border-zinc-800 text-zinc-100 font-medium font-semibold"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-90 w/40 border border-transparent"
                }`}
              >
                <div className="flex items-center space-x-2.5 overflow-hidden w-full pr-2">
                  <MessageSquare
                    className={`h-3.5 w-3.5 shrink-0 ${isActive ? "text-red-500" : "text-zinc-500 group-hover:text-zinc-400"}`}
                  />
                  <span className="truncate">{item.title}</span>
                </div>
                <div className="flex shrink-0 opacity-0 group-hover:opacity-100 gap-1 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      renameSession(item.id);
                    }}
                    className="p-1 hover:text-zinc-200 text-zinc-500 hover:bg-zinc-800 rounded transition-colors"
                    title="상담방 이름 변경"
                  >
                    <Edit3 className="h-3 w-3" />
                  </button>
                  <button
                    onClick={(e) => deleteSession(e, item.id)}
                    className="p-1 hover:text-red-400 text-zinc-500 hover:bg-zinc-800 rounded transition-colors"
                    title="삭제"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Profile: Database & Client Storage settings */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950 flex flex-col space-y-3">
          <div className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-850/60">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 overflow-hidden">
                {isEditingName ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      className="bg-zinc-950 border border-zinc-750 text-xs text-zinc-100 px-1.5 py-0.5 rounded focus:outline-none w-28 placeholder-zinc-500"
                      value={tempUsername}
                      onChange={(e) => setTempUsername(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveProfileName()}
                      autoFocus
                    />
                    <button
                      onClick={saveProfileName}
                      className="text-[10px] text-red-500 hover:text-red-400 font-bold"
                    >
                      저장
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-zinc-200 truncate block max-w-28">{username}</span>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-zinc-500 hover:text-zinc-300"
                      title="이름 수정"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <span className="text-[9px] text-zinc-550 block font-mono">기기 브라우저 암호 저장</span>
              </div>
            </div>
            {/* Sync Alert (Explains Firebase configuration setup declined) */}
            <div className="pt-2 border-t border-zinc-850 flex flex-col space-y-1.5">
              <span className="text-[10px] text-zinc-400 leading-tight">
                현재 LocalStorage 기기 모드 작동 중. 데이터의 유실을 방지하고 구글 클라우드와 상시 완벽 동기화하시겠습니까?
              </span>
              <button
                onClick={() =>
                  alert(
                    "사용자 거부로 인해 Firebase DB 연동이 제공되지 않는 상태입니다. 현재 브라우저 로컬 저장소 모드가 실행 중이지만, 기기 내부 스토리지에는 완벽히 100% 데이터를 안전하게 유지해 주므로 안심하셔도 좋습니다!"
                  )
                }
                className="w-full text-center py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 rounded text-[9px] font-bold transition-all"
              >
                Google 계정 클라우드 연동 문의
              </button>
            </div>
          </div>

          <div className="text-[10px] text-zinc-500 flex items-center justify-between">
            <span>ⓒ 2026 K-Law Intelligence</span>
            <span className="text-red-550 uppercase tracking-widest font-bold">V1.0</span>
          </div>
        </div>
      </div>

      {/* SIDEBAR BACKGROUND OVERLAY FOR MOBILE */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/55 z-30 md:hidden transition-opacity"
        />
      )}

      {/* MAIN CONSULTATION WORKSPACE CONTAINER */}
      <div className="flex-1 flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-hidden bg-[#0d0e11]">
        
        {/* Workspace Top Status Bar */}
        <div className="px-6 py-4 border-b border-zinc-850 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-zinc-200 truncate max-w-sm">
                {activeSession?.title || "📝 새로운 상담방"}
              </span>
              <span className="hidden sm:inline-block text-[9px] bg-red-950/50 border border-red-900/40 text-red-500 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                정부 API 연동 예비
              </span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-0.5 flex items-center gap-1.5 leading-snug">
              <Database className="h-3 w-3 text-red-500 shrink-0" />
              오프라인 핵심 백업 DB 가동 상태 (주택임대치법, 민법, 상가임대차, 근로기준법)
            </p>
          </div>

          <div className="hidden md:flex gap-3 items-center">
            <button
              onClick={() => setIsDbViewerOpen(true)}
              className="py-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 hover:text-zinc-100 text-zinc-400 rounded-xl border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <BookOpen className="h-3.5 w-3.5" />
              수록 핵심 법령집 검색 ({15})
            </button>
            <div className="flex items-center gap-1.5 text-xs text-amber-500 px-2.5 py-1.5 bg-amber-500/5 rounded-xl border border-amber-500/10 font-medium">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              안전 모드
            </div>
          </div>
        </div>

        {/* Messages list (Chat stage) */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-6 flex flex-col bg-zinc-900/15">
          
          <AnimatePresence initial={false}>
            {activeSession?.messages.map((msg, index) => {
              const isAi = msg.role === "model";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`w-full max-w-3xl xl:max-w-4xl mx-auto flex gap-4 ${
                    isAi ? "items-start" : "items-start justify-end flex-row-reverse"
                  }`}
                >
                  {/* Avatar bubble */}
                  <div
                    className={`h-9 w-9 rounded-xl flex items-center justify-center shrink-0 border shadow-md ${
                      isAi
                        ? "bg-red-950/30 text-red-500 border-red-900/30"
                        : "bg-zinc-800 text-zinc-300 border-zinc-700"
                    }`}
                  >
                    {isAi ? <Scale className="h-4.5 w-4.5" /> : <User className="h-4.5 w-4.5" />}
                  </div>

                  <div className={`space-y-1.5 max-w-[85%] md:max-w-[76%] ${!isAi ? "text-right" : ""}`}>
                    {/* Timestamp & label header */}
                    <div className="flex items-center gap-2 text-[10px] text-zinc-550">
                      <span className="font-semibold text-zinc-400">
                        {isAi ? "국가법령지능 K-Law" : username}
                      </span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    {/* Message Bubble Card */}
                    <div
                      className={`text-zinc-250 p-4.5 rounded-2xl shadow-sm text-left ${
                        isAi
                          ? "bg-[#14161b] border border-zinc-850 leading-relaxed text-zinc-200"
                          : "bg-red-650 text-white rounded-tr-none font-sans"
                      }`}
                    >
                      <div className="prose prose-invert prose-xs max-w-none text-zinc-200">
                        {isAi ? parseMessageContent(msg.content) : <p className="text-sm font-medium">{msg.content}</p>}
                      </div>

                      {/* Cited Sources Box (Available for AI Responses) */}
                      {isAi && msg.sources && (msg.sources.articles.length > 0 || msg.sources.precedents.length > 0) && (
                        <div className="mt-4 pt-3.5 border-t border-zinc-850/70">
                          <details className="group cursor-pointer">
                            <summary className="text-[11px] font-bold text-red-500 hover:text-red-400 select-none flex items-center gap-1.5">
                              <BookOpen className="h-3.5 w-3.5 shrink-0" />
                              참조된 백업 데이터베이스 (총법 {msg.sources.articles.length}건, 판례 {msg.sources.precedents.length}건)
                              <ChevronRight className="h-3 w-3 shrink-0 transform group-open:rotate-90 transition-transform ml-auto" />
                            </summary>
                            <div className="mt-2.5 space-y-2 max-h-56 overflow-y-auto pr-1">
                              {msg.sources.articles.map((art) => (
                                <div
                                  key={art.id}
                                  className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850/60 text-xs"
                                >
                                  <div className="flex items-center justify-between text-[10px] font-extrabold text-red-400 uppercase tracking-widest mb-1.5">
                                    <span>{art.actName}</span>
                                    <span>{art.articleNo}</span>
                                  </div>
                                  <p className="font-semibold text-zinc-200">{art.title}</p>
                                  <p className="mt-1 text-zinc-400 leading-normal text-[11px] font-mono p-2 bg-black/25 rounded-md border border-zinc-900">
                                    {art.content}
                                  </p>
                                  <p className="mt-1.5 text-[11px] text-zinc-300">
                                    <span className="font-bold text-zinc-400">교안요약:</span> {art.summary}
                                  </p>
                                </div>
                              ))}
                              {msg.sources.precedents.map((prec) => (
                                <div
                                  key={prec.id}
                                  className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-850/60 text-xs"
                                >
                                  <div className="flex items-center justify-between text-[10px] font-bold text-emerald-400 mb-1.5">
                                    <span>{prec.caseName}</span>
                                    <span className="font-mono text-zinc-500">{prec.caseNumber}</span>
                                  </div>
                                  <p className="font-semibold text-zinc-200">{prec.holding}</p>
                                  <p className="mt-1 text-zinc-400 leading-normal text-[11px] font-mono bg-black/25 p-2 rounded-md border border-zinc-900">
                                    {prec.summary}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </details>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* AI Loader */}
          {isLoading && (
            <div className="w-full max-w-3xl xl:max-w-4xl mx-auto flex gap-4 items-start">
              <div className="h-9 w-9 rounded-xl bg-red-950/30 text-red-500 border border-red-900/30 flex items-center justify-center shrink-0">
                <Scale className="h-4.5 w-4.5 animate-spin" />
              </div>
              <div className="space-y-1.5 max-w-[85%]">
                <div className="flex items-center gap-1 text-[10px] text-zinc-550">
                  <span className="font-semibold text-zinc-400">국가법령지능 AI</span>
                  <span>•</span>
                  <span>데이터 정밀 분석 중...</span>
                </div>
                <div className="p-4 bg-zinc-950 border border-zinc-850 rounded-2xl flex items-center space-x-3 text-sm text-zinc-400">
                  <span className="relative flex h-2 w-2 mt-0.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                  <span>백업 DB 조문 검색 및 대한민국 헌법·법률 자구 대입 중...</span>
                </div>
              </div>
            </div>
          )}

          {/* Failure Alert Box */}
          {errorMessage && (
            <div className="w-full max-w-3xl xl:max-w-4xl mx-auto p-4 bg-amber-950/20 border border-amber-900/40 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-amber-400 block mb-1">법률 분석 단절 알림:</span>
                <p>{errorMessage}</p>
                <button
                  onClick={() => handleSendMessage(activeSession.messages[activeSession.messages.length - 1]?.content)}
                  className="mt-2.5 px-3 py-1 bg-amber-900/40 hover:bg-amber-900/60 text-amber-200 rounded font-semibold border border-amber-800"
                >
                  답변 재생성 및 재시도
                </button>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Workspace Bottom Quick Prompts & Form Input */}
        <div className="p-4 md:p-6 border-t border-zinc-850 bg-zinc-950/90 backdrop-blur-md shrink-0 select-none">
          <div className="max-w-3xl xl:max-w-4xl mx-auto space-y-4">
            
            {/* Template quick-chips when no chat has historically occurred */}
            {activeSession && activeSession.messages.length <= 1 && (
              <div>
                <div className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest block mb-2.5">
                  가장 빈번한 4대 민생 고충 빠른 질의 해결
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QUICK_TEMPLATES.map((tpl, i) => {
                    const IconComp = tpl.icon;
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setInputMessage(tpl.query);
                          handleSendMessage(tpl.query);
                        }}
                        className={`p-3.5 rounded-xl border bg-zinc-900/40 text-left hover:bg-zinc-900 hover:border-zinc-700 transition-all flex gap-3 cursor-pointer group active:scale-[0.99]`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 border ${tpl.color} group-hover:scale-105 transition-transform`}>
                          <IconComp className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-zinc-200 mb-0.5 flex items-center gap-1.5">
                            {tpl.title}
                            <ArrowRight className="h-3 w-3 text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </div>
                          <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                            {tpl.query}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* General Disclaimer Alert on Input */}
            <div className="flex items-center gap-2 p-2 px-3 bg-zinc-900/65 border border-zinc-850 rounded-xl text-[10px] text-zinc-400 leading-normal">
              <span className="flex h-1.5 w-1.5 rounded-full bg-red-650"></span>
              <span>대한민국 헌법 보장: 국가법령정보 백업 DB와 연동되어 작동하며, AI가 생성된 법률 참고 답변은 유권해석의 근거가 아닙니다.</span>
            </div>

            {/* Core message text box input form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputMessage);
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                placeholder="임대차 보증금 돌려받기, 부당해고 처단금, 알바 주휴수당 등 법률 질문을 입력하십시오..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
                className="w-full pl-4 pr-14 py-3.5 bg-[#121419] border border-zinc-800 text-sm text-zinc-100 rounded-xl placeholder-zinc-500 focus:outline-none focus:border-red-900/80 focus:ring-1 focus:ring-red-900/25 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="absolute right-2 px-3.5 py-2 bg-red-600 hover:bg-red-700 disabled:bg-zinc-850 disabled:text-zinc-650 border border-red-700 disabled:border-transparent text-white rounded-lg transition-all active:scale-[0.96] flex items-center justify-center cursor-pointer"
                title="질문 전송"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>

          </div>
        </div>

      </div>

      {/* DETAILED LAW OR COURT RULINGS PRECEDENT SEARCH MODAL EXPOSER */}
      <LawDbViewer isOpen={isDbViewerOpen} onClose={() => setIsDbViewerOpen(false)} />

    </div>
  );
}
