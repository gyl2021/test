export interface Citation {
  position: number;
  dataset_name: string;
  dataset_id: string;
  document_name: string;
  document_id: string;
  segment_id: string;
  score: number;
  content: string;
}

export interface DifyResponseMetadata {
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  retriever_resources?: Citation[];
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  citations?: Citation[];
  isStreaming?: boolean;
}

export interface StoredConversation {
  id: string; // The Dify conversation_id
  title: string;
  messages: Message[];
  updatedAt: number;
}

export interface AppConfig {
  apiKey: string;
  baseUrl: string;
}

export interface ChatRequestPayload {
  inputs: Record<string, any>;
  query: string;
  response_mode: 'streaming' | 'blocking';
  conversation_id?: string;
  user: string;
  files?: any[];
}