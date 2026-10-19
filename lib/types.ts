export type SearchModule = 
  | 'todos'
  | 'instagram'
  | 'facebook'
  | 'telefone'
  | 'email'
  | 'tiktok'
  | 'pinterest'
  | 'twitter'
  | 'kwai'
  | 'linkedin'
  | 'imagem'
  | 'dominios'
  | 'vazamentos'
  | 'documentos'
  | 'planos'

export type SearchMode = 'varredura' | 'presenca' | 'perfil'

export interface SearchResult {
  id: string
  platform: string
  username: string
  displayName: string
  score: number
  bio?: string
  followers?: string
  following?: string
  posts?: string
  location?: string
  avatar?: string
  url?: string
  exists?: boolean
  status?: string
  httpStatus?: number
  extra?: Record<string, unknown>
  source: 'maigret' | 'holehe' | 'instaloader' | 'phonenumbers' | 'http-checker' | 'manual' | 'ip-intel' | 'domain-intel' | 'breach-check' | 'crypto-check' | 'exposed-db' | 'image-forensics' | 'phone-osint' | 'username-enum' | 'password-leak' | 'social-check' | 'telegram' | 'subdomain' | 'wayback' | 'ssl-tracker' | 'port-scanner'
  timestamp: number
}

export interface SearchState {
  query: string
  module: SearchModule
  mode: SearchMode
  status: 'idle' | 'scanning' | 'completed' | 'error'
  results: SearchResult[]
  progress: number
  error?: string
  avatarOnly: boolean
  transparent: boolean
  tor: boolean
}

export interface UsernameSearchRequest {
  target: string
  modules?: SearchModule[]
  mode?: SearchMode
  avatarOnly?: boolean
  transparent?: boolean
  tor?: boolean
}

export interface EmailSearchRequest {
  email: string
}

export interface PhoneSearchRequest {
  phone: string
}

export interface InstagramFollowersRequest {
  username: string
  sessionId?: string
}

export interface PresenceAnalysisRequest {
  username: string
  platforms?: SearchModule[]
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  details?: string
}

export interface MaigretResult {
  site: string
  url: string
  exists: boolean
  status: string
  http_status: number
  response_time: number
}

export interface HoleheResult {
  email: string
  site: string
  exists: boolean
  rate_limit: boolean
}

export interface InstaloaderProfile {
  username: string
  full_name: string
  biography: string
  followers: number
  following: number
  posts: number
  is_private: boolean
  is_verified: boolean
  profile_pic_url: string
  external_url: string
}

export interface PhoneInfo {
  number: string
  country_code: string
  national_number: string
  country: string
  location: string
  carrier: string
  line_type: string
  valid: boolean
  possible: boolean
}

export type SnapshotPlatform = 'instagram' | 'facebook'

export interface SnapshotProfileData {
  username: string
  full_name: string | null
  bio: string | null
  profile_pic_url: string | null
  profile_pic_hash: string | null
  followers_count: number | null
  following_count: number | null
  posts_count: number | null
  is_verified: boolean | null
  is_private: boolean | null
  external_url: string | null
  followers_sample: string[] | null
  following_sample: string[] | null
}

export interface Snapshot {
  id: string
  platform: SnapshotPlatform
  username: string
  timestamp: number
  profile: SnapshotProfileData
  provider: string
  status: 'complete' | 'partial' | 'error'
  error?: string
}

export interface SnapshotDiffField {
  field: string
  before: unknown
  after: unknown
  changed: boolean
  delta?: number | null
}

export interface FollowerDiff {
  new_observed: string[]
  not_observed_in_current: string[]
}

export interface SnapshotComparison {
  snapshot_before: Snapshot
  snapshot_after: Snapshot
  changed: boolean
  fields: SnapshotDiffField[]
  follower_diff: FollowerDiff | null
  summary: string[]
}

export interface InterestData {
  platform: SnapshotPlatform
  username: string
  hashtags: { tag: string; count: number }[]
  post_times: { hour: number; count: number }[]
  total_posts_analyzed: number
  avg_engagement: number | null
  top_interactions: { username: string; type: string; count: number }[]
  status: 'complete' | 'partial' | 'insufficient_data'
  message?: string
}

export type ProviderStatus = 'available' | 'partial' | 'unavailable' | 'error'

export interface FollowerProfile {
  username: string
  full_name: string | null
  profile_pic_url: string | null
  url: string | null
  follows_target: boolean | null
}

export interface FollowersData {
  platform: SnapshotPlatform
  target_username: string
  followers: FollowerProfile[]
  following_list: string[]
  total_returned: number
  has_temporal_order: boolean
  status: 'complete' | 'partial' | 'unavailable'
  message?: string
}

export interface InteractionProfile {
  username: string
  full_name: string | null
  profile_pic_url: string | null
  url: string | null
  likes_observed: number
  comments_observed: number
  total_interactions: number
  follows_target: boolean | null
  target_interacts_back: boolean | null
  reciprocity_status: string
}

export interface InteractionsData {
  platform: SnapshotPlatform
  target_username: string
  profiles: InteractionProfile[]
  total_posts_analyzed: number
  status: 'complete' | 'partial' | 'insufficient_data' | 'unavailable'
  message?: string
}

export interface DarkWebResult {
  id: string
  source: string
  title?: string
  data: string
  timestamp: number
  type: 'credential' | 'paste' | 'forum' | 'leak' | 'other'
}

export interface BulkScanTarget {
  target: string
  type: 'email' | 'domain' | 'username' | 'phone'
  results: Record<string, unknown>
  status: 'complete' | 'partial' | 'error'
  error?: string
}

export interface TimelineEvent {
  date: string
  timestamp: number
  event: string
  description: string
  source: string
  category: 'social' | 'breach' | 'domain' | 'email' | 'phone' | 'other'
}

export interface CorrelationResult {
  inputs: string[]
  matches: { field: string; value: string; sources: string[] }[]
  confidence: number
  summary: string
}

export interface SSLHistoryEntry {
  domain: string
  issuer: string
  cn: string
  valid_from: string
  valid_to: string
  serial: string
  fingerprint: string
}

export interface WaybackEntry {
  url: string
  timestamp: string
  status: string
  digest: string
}

export interface MetadataResult {
  filename: string
  type: string
  size: number
  metadata: Record<string, string>
}

export interface EmailTraceResult {
  email: string
  mx_records: string[]
  spf_record?: string
  dmarc_record?: string
  disposable: boolean
  provider: string
  risk_score: number
}

export interface AdvancedDorkResult {
  dork: string
  url: string
  category: string
}

export interface BulkScanResult {
  targets: BulkScanTarget[]
  total: number
  completed: number
  errors: number
  summary: string
}

export interface PremiumUser {
  userId: string
  email: string
  tier: 'free' | 'premium' | 'pro'
  createdAt: string
  expiresAt?: string
}