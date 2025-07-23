
export type DashboardComponentConfig = {
  id: string;
  label: string;
  visible: boolean;
  type: 'kpi' | 'chart' | 'summary';
  tab: 'snapshot' | 'trends';
  width: 'full' | 'half';
};

export type Ticket = {
  id: number;
  subject: string;
  requester: string;
  assignee?: string;
  description: string;
  created_at: string;
  first_response_at?: string;
  solved_at?: string;
  status: 'new' | 'open' | 'pending' | 'on-hold' | 'solved' | 'closed';
  priority: 'urgent' | 'high' | 'normal' | 'low' | null;
  tags: string[];
  view: string;
  category: string;
  conversation: {
    sender: 'customer' | 'agent';
    message: string;
    timestamp: string;
  }[];
  sla_breached: boolean;
  csat_score?: number; // 1-5
};

export type TicketAnalysis = {
  sentiment?: 'Positive' | 'Neutral' | 'Negative';
  category?: string;
  summary?: string;
};

export type AnalyzedTicket = Ticket & TicketAnalysis;

export type UserProfile = {
  name: string;
  email: string;
  totalTickets: number;
  avgCsat: string;
  lastContact: string;
  tickets: AnalyzedTicket[];
  sentiments: {
    Positive: number;
    Neutral: number;
    Negative: number;
  };
};

export type AgentProfile = {
  name: string;
  avatar: string;
  solvedTickets: number;
  avgResolutionTime: string;
  avgCsat: string;
  tickets: AnalyzedTicket[];
  sentimentCounts: {
    Positive: number;
    Neutral: number;
    Negative: number;
  };
  categoryCounts: { name: string, value: number }[];
  // New fields for tier management
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  performanceHistory: WeeklyPerformance[];
};

// New types for agent performance tracking
export type WeeklyPerformance = {
  weekStart: string; // ISO date string for start of week
  ticketsSolved: number;
  hoursWorked: number;
  ticketsPerHour: number;
  csatScore?: number;
  resolutionTimeHours?: number;
};

export type AgentTierMetrics = {
  tier1: {
    targetTicketsPerWeek: number;
    targetHoursPerWeek: number;
  };
  tier2: {
    targetTicketsPerWeek: number;
    targetHoursPerWeek: number;
  };
  tier3: {
    targetTicketsPerWeek: number;
    targetHoursPerWeek: number;
  };
};

export type CoachingInsight = {
  agentName: string;
  insightType: 'Positive' | 'Opportunity';
  category: string;
  description: string;
  exampleTicketIds: number[];
};

export type TicketCluster = {
  clusterId: number;
  theme: string;
  ticketIds: number[];
  keywords: string[];
};

// Enterprise User Roles with hierarchical permissions
export type UserRole = 'super_admin' | 'org_admin' | 'manager' | 'agent' | 'readonly';

// User permissions for fine-grained access control
export type Permission = 
  | 'users.read' | 'users.write' | 'users.delete'
  | 'tickets.read' | 'tickets.write' | 'tickets.delete'
  | 'analytics.read' | 'analytics.write'
  | 'ai.read' | 'ai.write'
  | 'settings.read' | 'settings.write'
  | 'audit.read'
  | 'org.read' | 'org.write';

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  organizationId?: string;
  organizationName?: string;
  department?: string;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  invitedBy?: string;
  emailVerified: boolean;
};

// Organization/Tenant management
export type Organization = {
  id: string;
  name: string;
  domain?: string;
  logo?: string;
  settings: OrganizationSettings;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  isActive: boolean;
  plan: 'free' | 'pro' | 'enterprise';
  maxUsers: number;
  currentUsers: number;
};

export type OrganizationSettings = {
  allowSelfRegistration: boolean;
  requireEmailVerification: boolean;
  sessionTimeoutMinutes: number;
  enableAuditLogging: boolean;
  allowedDomains: string[];
  customBranding: {
    primaryColor?: string;
    logoUrl?: string;
    companyName?: string;
  };
};

// User invitation system
export type UserInvitation = {
  id: string;
  email: string;
  role: UserRole;
  organizationId: string;
  invitedBy: string;
  invitedAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
};

export type VolumeForecast = {
  date: string;
  predictedVolume: number;
  upperBound: number;
  lowerBound: number;
};

export type CategoryTrend = {
  category: string;
  trend: 'Increasing' | 'Decreasing' | 'Stable';
  prediction: string;
};

export type EmergingIssue = {
  theme: string;
  impact: string;
  exampleTickets: string[];
};

export type AtRiskTicket = {
  ticketId: number;
  subject: string;
  reason: string;
  predictedCsat: number;
  deEscalationStrategy: string;
};

export type PredictedSlaBreach = {
  ticketId: number;
  subject: string;
  predictedBreachTime: string;
  reason: string;
};

export type DocumentationOpportunity = {
  topic: string;
  justification: string;
  relatedTicketCount: number;
  exampleTickets: string[];
};

export type PredictiveAnalysisOutput = {
  forecast: VolumeForecast[];
  overallAnalysis: string;
  agentTriageSummary: string;
  categoryTrends: CategoryTrend[];
  emergingIssues: EmergingIssue[];
  atRiskTickets: AtRiskTicket[];
  predictedSlaBreaches: PredictedSlaBreach[];
  documentationOpportunities: DocumentationOpportunity[];
  recommendations: string[];
  confidenceScore: number;
};

export type BurnoutIndicator = {
  agentName: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  ticketCount: number;
  avgResolutionTime: number;
  lastActivity: string;
};

export type KnowledgeGap = {
  topic: string;
  affectedTickets: number;
  agents: string[];
  impact: string;
  priority: 'low' | 'medium' | 'high';
  agentName?: string;
  frequency?: number;
  recommendedTraining?: string[];
};

export type PerformanceForecast = {
  date: string;
  forecastValue: number;
  confidence: number;
  type: 'volume' | 'resolution_time' | 'csat';
  agentName?: string;
  currentPerformance?: number;
  targetPerformance?: number;
};
