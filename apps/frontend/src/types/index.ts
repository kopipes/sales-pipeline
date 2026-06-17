// ─── Auth ────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  access_token: string;
  user: User;
}

// ─── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  jobTitle?: string;
  avatarUrl?: string;
  status: string;
  role: { id: string; name: string; scopeLevel: string };
  division: { id: string; name: string; code: string };
}

// ─── Division ────────────────────────────────────────────────────────────────
export interface Division {
  id: string;
  name: string;
  code: string;
  colorTag?: string;
  isActive: boolean;
}

// ─── Company ─────────────────────────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  industry?: { id: string; name: string };
  channelType: string;
  website?: string;
  notes?: string;
}

// ─── Contact ─────────────────────────────────────────────────────────────────
export interface Contact {
  id: string;
  companyId: string;
  company?: { id: string; name: string };
  fullName: string;
  jobTitle?: string;
  phone?: string;
  email?: string;
  isPrimary: boolean;
  notes?: string;
}

// ─── Pipeline Stage ──────────────────────────────────────────────────────────
export interface PipelineStage {
  id: string;
  name: string;
  sortOrder: number;
  isWon: boolean;
  isLost: boolean;
}

// ─── Deal ────────────────────────────────────────────────────────────────────
export interface Deal {
  id: string;
  dealName: string;
  companyId: string;
  company: { id: string; name: string };
  divisionId: string;
  division: { id: string; name: string; code: string; colorTag?: string };
  salesRepId: string;
  salesRep: { id: string; fullName: string };
  dealTypeId: string;
  dealType: { id: string; name: string };
  stageId: string;
  stage: PipelineStage;
  estimatedValue: number;
  probabilityPct: number;
  weightedValue: number;
  expectedClosingDate?: string;
  actualClosingDate?: string;
  lostReason?: string;
  remarks?: string;
  // IP Licensing
  ipAssetName?: string;
  royaltyPct?: number;
  minimumGuarantee?: number;
  // Job/Project
  jobCategoryId?: string;
  billingType?: string;
  createdAt: string;
  updatedAt: string;
  stageChangedAt: string;
}

// ─── Activity ────────────────────────────────────────────────────────────────
export interface Activity {
  id: string;
  companyId: string;
  company: { id: string; name: string };
  contactId?: string;
  contact?: { id: string; fullName: string };
  dealId?: string;
  deal?: { id: string; dealName: string };
  divisionId: string;
  division: { id: string; name: string };
  salesRepId: string;
  salesRep: { id: string; fullName: string };
  activityDate: string;
  medium: string;
  objective: string;
  resultNotes?: string;
  nextAction?: string;
  nextActionDate?: string;
  createdAt: string;
}

// ─── Job ─────────────────────────────────────────────────────────────────────
export interface Job {
  id: string;
  dealId?: string;
  deal?: { id: string; dealName: string };
  companyId: string;
  company: { id: string; name: string };
  divisionId: string;
  division: { id: string; name: string; code: string; colorTag?: string };
  jobTitle: string;
  jobCategoryId: string;
  jobCategory: { id: string; name: string };
  periodMonth: number;
  periodYear: number;
  salesAmount: number;
  cogsAmount: number;
  operatingProfit: number;
  operatingProfitPct: number;
  billingType: string;
  jobStatus: string;
  picId: string;
  pic: { id: string; fullName: string };
  notes?: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────
export interface KpiData {
  totalPipelineValue: number;
  weightedPipeline: number;
  wonRevenue: number;
  targetRevenue: number;
  targetAchievementPct: number;
  forecastedRevenue: number;
  dealsAtRisk: { count: number; value: number };
  activeDealCount: number;
  wonDealCount: number;
}

export interface FunnelStage {
  stageId: string;
  name: string;
  sortOrder: number;
  isWon: boolean;
  isLost: boolean;
  count: number;
  value: number;
  conversionRate?: number;
}

export interface DivisionPipeline {
  divisionId: string;
  name: string;
  colorTag?: string;
  value: number;
  percentage: number;
}

export interface WinLoss {
  won: number;
  lost: number;
  winRate: number;
}
