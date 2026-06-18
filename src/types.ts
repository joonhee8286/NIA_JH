import { LawArticle, LawPrecedent } from "./data/fallbackLawDb";

export interface Message {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
  sources?: {
    articles: LawArticle[];
    precedents: LawPrecedent[];
  };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: Message[];
}

export interface AppConfig {
  isOfflineMode: boolean;
  apiStatus: "Active" | "Fallback" | "Pending";
  firebaseConfigured: boolean;
}
