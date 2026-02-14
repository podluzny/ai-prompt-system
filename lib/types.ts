export interface Project {
  id: string
  user_id: string
  name: string
  description: string
  content?: string | null
  keywords: string[]
  regex_patterns: string[]
  ai_models: AIModel[]
  created_at: string
  updated_at: string
}

export interface AIModel {
  id?: string // Added optional id field for tracking in UI
  provider: string
  model: string
  apiKey?: string | null
  folderId?: string | null // For Yandex AI
  baseURL?: string | null // For custom providers
}

export interface Prompt {
  id: string
  project_id: string
  text: string
  order_index: number
  created_at: string
}

export interface TestRun {
  id: string
  project_id: string
  status: "pending" | "running" | "completed" | "failed"
  total_requests: number
  completed_requests: number
  failed_requests: number
  started_at: string
  completed_at?: string
}

export interface AIResponse {
  id: string
  test_run_id: string
  prompt_id: string
  ai_model: string
  request_text: string
  response_text?: string
  status: "pending" | "success" | "error" | "retrying"
  error_message?: string
  attempt_count: number
  keywords_found: Record<string, number>
  regex_matches: Record<string, number>
  match_percentage: number
  response_time_ms?: number
  created_at: string
  flags?: string[] // Added flags field for response evaluation
}

export type ResponseFlag = "interesting" | "needs_attention" | "error_flag" | "good_response" | "bad_response"
