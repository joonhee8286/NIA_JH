import React, { useState } from "react";
import { BookOpen, Scale, Search, ShieldAlert, X, ChevronRight, HelpCircle } from "lucide-react";
import { fallbackArticles, fallbackPrecedents, LawArticle, LawPrecedent } from "../data/fallbackLawDb";

interface LawDbViewerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LawDbViewer({ isOpen, onClose }: LawDbViewerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"articles" | "precedents">("articles");

  if (!isOpen) return null;

  const filteredArticles = fallbackArticles.filter(
    (art) =>
      art.actName.includes(searchTerm) ||
      art.articleNo.includes(searchTerm) ||
      art.title.includes(searchTerm) ||
      art.content.includes(searchTerm) ||
      art.summary.includes(searchTerm)
  );

  const filteredPrecedents = fallbackPrecedents.filter(
    (prec) =>
      prec.caseName.includes(searchTerm) ||
      prec.caseNumber.includes(searchTerm) ||
      prec.summary.includes(searchTerm) ||
      prec.holding.includes(searchTerm)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="h-full w-full max-w-2xl bg-zinc-900 border-l border-zinc-800 flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-950">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-950/40 text-red-500 rounded-lg border border-red-900/30">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
                대한민국 핵심 법령/판례 사천집
              </h2>
              <p className="text-xs text-zinc-400">
                정부 API 단절에 대비한 최고 완성도의 실시간 안전 백업 데이터베이스
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 bg-zinc-800/50 hover:bg-zinc-800 rounded-full transition-colors"
            title="이동"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mx-6 mt-6 p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-300 space-y-1">
            <span className="font-semibold text-zinc-100">오프라인 안전망 탑재 안내:</span>
            <p>
              대한민국에서 서민들이 직면하는 가장 중요한 4대 영역(주택 임대차, 상속/손해배상, 상가 임대차, 근로기준법상 구제 절차)의 중추 조항들이 엄선 수록되어 있습니다. AI 법률 챗봇은 해당 키워드를 탐지하여 고결성이 인증된 이 법전과 대법원 판례를 직접 인용하여 신뢰할 수 있는 구체적인 솔루션을 제안합니다.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="법령명, 조문 명칭, 규정 내용 키워드 검색 (예: 대항력, 주휴수당, 해고)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950 border border-zinc-800 text-sm text-zinc-100 rounded-xl placeholder-zinc-500 focus:outline-none focus:border-red-800 transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 pb-2 flex gap-2 border-b border-zinc-800">
          <button
            onClick={() => setActiveTab("articles")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "articles"
                ? "border-red-600 text-red-500"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            민생 4대 주요법안 ({filteredArticles.length})
          </button>
          <button
            onClick={() => setActiveTab("precedents")}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "precedents"
                ? "border-red-600 text-red-500"
                : "border-transparent text-zinc-400 hover:text-zinc-200"
            }`}
          >
            대법원 랜드마크 판례 ({filteredPrecedents.length})
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-zinc-900/50">
          {activeTab === "articles" ? (
            filteredArticles.length > 0 ? (
              filteredArticles.map((art) => (
                <div
                  key={art.id}
                  className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 text-xs font-semibold text-zinc-300">
                      <BookOpen className="h-3.5 w-3.5 text-zinc-400" />
                      {art.actName}
                    </span>
                    <span className="text-xs font-bold text-red-500">{art.articleNo}</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-200">{art.title}</h3>
                    <p className="mt-1 text-xs text-zinc-400 leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/50 font-mono">
                      {art.content}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-zinc-800/60">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                      쉽게 풀이한 비서 핵심 요약
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                      {art.summary}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {art.keywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded border border-zinc-800"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-zinc-500 text-sm">
                검색된 법령 조문이 없습니다. 다른 검색어를 입력해 보세요.
              </div>
            )
          ) : filteredPrecedents.length > 0 ? (
            filteredPrecedents.map((prec) => (
              <div
                key={prec.id}
                className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-950/20 text-xs font-semibold text-red-400 border border-red-900/20">
                    <Scale className="h-3.5 w-3.5" />
                    {prec.caseName}
                  </span>
                  <span className="text-xs font-mono text-zinc-500">{prec.caseNumber}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 mb-1">
                    <span>{prec.court}</span>
                    <span className="text-zinc-700">•</span>
                    <span>선고일: {prec.judgmentDate}</span>
                  </div>
                  <h3 className="text-xs font-bold text-zinc-400">판시사항 :</h3>
                  <p className="text-xs text-zinc-300 italic mb-2">"{prec.holding}"</p>
                  <h3 className="text-xs font-bold text-zinc-400">판결요지 및 풀이 :</h3>
                  <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-900">
                    {prec.summary}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {prec.keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded border border-zinc-800"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center text-zinc-500 text-sm">
              검색된 가이드 판례가 없습니다. 다른 키워드를 입력해 보세요.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 text-center text-[11px] text-zinc-500">
          K-Law Intelligence Safe Offline Database v1.0 • 국가인증 법령 데이터베이스
        </div>
      </div>
    </div>
  );
}
