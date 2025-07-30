
import type { ClassificationMetadata } from './data-classification';

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
  // Data classification metadata
  classification?: ClassificationMetadata;
  organizationId?: string;
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
  // Data classification metadata
  classification?: ClassificationMetadata;
  organizationId?: string;
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
  // Data classification metadata
  classification?: ClassificationMetadata;
  organizationId?: string;
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
  | 'org.read' | 'org.write'
  | 'data.classify' | 'data.declassify' | 'data.access_restricted' | 'data.access_confidential';

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
  // Data classification metadata
  classification?: ClassificationMetadata;
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
  // Data classification metadata
  classification?: ClassificationMetadata;
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
  organizationName?: string;
  invitedBy: string;
  inviterName?: string;
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

// Enhanced Drill-Down Analytics Interfaces

export interface AgentProfileDrillDown {
  agentName: string;
  profileDetails: {
    totalExperience: string;
    specializations: string[];
    certifications: string[];
    currentWorkload: number;
    availabilityStatus: 'available' | 'busy' | 'away' | 'offline';
    skillRatings: { skill: string; rating: number }[];
    languages: string[];
    shiftPattern: string;
    timezone: string;
  };
  performanceCharts: {
    ticketVolumeChart: { date: string; volume: number; target: number }[];
    csatTrendChart: { date: string; csat: number; benchmark: number }[];
    resolutionTimeChart: { date: string; avgTime: number; slaTarget: number }[];
    categoryDistribution: { category: string; percentage: number; trend: 'up' | 'down' | 'stable' }[];
  };
  workloadMetrics: {
    currentCapacity: number;
    utilizationRate: number;
    overtimeHours: number;
    peakHours: string[];
    queueDepth: number;
    concurrentTickets: number;
    workloadDistribution: { timeSlot: string; ticketCount: number }[];
  };
  qualityMetrics: {
    firstContactResolution: number;
    escalationRate: number;
    reopenRate: number;
    customerCompliments: number;
    qualityScoreHistory: { date: string; score: number }[];
    accuracyRate: number;
    complianceScore: number;
  };
}

export interface RiskAnalysisDrillDown {
  agentName: string;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  riskHeatmap: {
    burnoutRisk: { score: number; trend: 'increasing' | 'stable' | 'decreasing'; factors: string[] };
    performanceRisk: { score: number; trend: 'increasing' | 'stable' | 'decreasing'; factors: string[] };
    workloadRisk: { score: number; trend: 'increasing' | 'stable' | 'decreasing'; factors: string[] };
    satisfactionRisk: { score: number; trend: 'increasing' | 'stable' | 'decreasing'; factors: string[] };
    engagementRisk: { score: number; trend: 'increasing' | 'stable' | 'decreasing'; factors: string[] };
    attendanceRisk: { score: number; trend: 'increasing' | 'stable' | 'decreasing'; factors: string[] };
  };
  mitigationStrategies: {
    immediate: { action: string; priority: 'high' | 'medium' | 'low'; estimatedImpact: string }[];
    shortTerm: { action: string; priority: 'high' | 'medium' | 'low'; estimatedImpact: string }[];
    longTerm: { action: string; priority: 'high' | 'medium' | 'low'; estimatedImpact: string }[];
  };
  historicalRiskData: { date: string; riskScore: number; triggers: string[] }[];
  earlyWarningSignals: {
    signal: string;
    severity: 'low' | 'medium' | 'high';
    firstDetected: string;
    frequency: number;
  }[];
  benchmarkComparison: {
    teamAverage: number;
    industryBenchmark: number;
    topPerformerBaseline: number;
  };
}

export interface SystemHealthDrillDown {
  agentName: string;
  overallHealthScore: number;
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  healthMetrics: {
    responseTimeHealth: { score: number; trend: 'improving' | 'stable' | 'declining'; target: number };
    qualityHealth: { score: number; trend: 'improving' | 'stable' | 'declining'; target: number };
    workloadHealth: { score: number; trend: 'improving' | 'stable' | 'declining'; target: number };
    availabilityHealth: { score: number; trend: 'improving' | 'stable' | 'declining'; target: number };
    customerSatisfactionHealth: { score: number; trend: 'improving' | 'stable' | 'declining'; target: number };
    collaborationHealth: { score: number; trend: 'improving' | 'stable' | 'declining'; target: number };
  };
  alerts: {
    alertId: string;
    type: 'performance' | 'workload' | 'quality' | 'availability';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    triggeredAt: string;
    status: 'active' | 'acknowledged' | 'resolved';
    recommendedAction: string;
  }[];
  systemIndicators: {
    averageHandleTime: { current: number; target: number; variance: number };
    firstCallResolution: { current: number; target: number; variance: number };
    serviceLevel: { current: number; target: number; variance: number };
    abandonmentRate: { current: number; target: number; variance: number };
    adherenceToSchedule: { current: number; target: number; variance: number };
  };
  performanceTrends: {
    dailyHealthScores: { date: string; score: number }[];
    weeklyAverages: { week: string; score: number }[];
    monthlyComparison: { month: string; score: number; target: number }[];
  };
}

export interface StrategicInsightsDrillDown {
  agentName: string;
  executiveSummary: {
    overallPerformance: 'excellent' | 'good' | 'satisfactory' | 'needs_improvement' | 'poor';
    keyStrengths: string[];
    criticalAreas: string[];
    strategicValue: string;
    investmentRecommendation: 'promote' | 'develop' | 'maintain' | 'review' | 'manage_out';
  };
  careerDevelopment: {
    currentLevel: string;
    nextLevel: string;
    readinessScore: number;
    developmentPlan: { milestone: string; timeline: string; resources: string[] }[];
    skillGaps: { skill: string; currentLevel: number; targetLevel: number; priority: 'high' | 'medium' | 'low' }[];
    mentorshipOpportunities: string[];
    leadershipPotential: number;
  };
  teamImpact: {
    influenceScore: number;
    mentorshipActivities: { activity: string; impact: string; frequency: string }[];
    knowledgeSharing: { topic: string; recipients: number; effectiveness: number }[];
    collaborationMetrics: { metric: string; score: number; benchmark: number }[];
    teamMoraleImpact: number;
  };
  businessValue: {
    revenueImpact: { direct: number; indirect: number; currency: string };
    costSavings: { area: string; amount: number; currency: string }[];
    customerRetention: { influenced: number; value: number };
    processImprovements: { improvement: string; impact: string; measuredBy: string }[];
    innovationContributions: string[];
  };
  futureProjections: {
    sixMonthOutlook: { metric: string; projected: number; confidence: number }[];
    yearEndProjection: { metric: string; projected: number; confidence: number }[];
    careerTrajectory: string;
    riskFactors: string[];
    opportunityAreas: string[];
  };
}

export interface ForecastConfidenceDrillDown {
  agentName: string;
  forecastAccuracy: {
    historicalAccuracy: { period: string; accuracy: number; variance: number }[];
    predictionReliability: number;
    confidenceIntervals: { forecast: string; lower: number; upper: number; actual?: number }[];
    modelPerformance: { model: string; accuracy: number; lastUpdated: string }[];
  };
  predictionMetrics: {
    volumeForecasting: { accuracy: number; meanAbsoluteError: number; trendAccuracy: number };
    csatPrediction: { accuracy: number; meanAbsoluteError: number; trendAccuracy: number };
    resolutionTimePrediction: { accuracy: number; meanAbsoluteError: number; trendAccuracy: number };
    burnoutPrediction: { accuracy: number; falsePositiveRate: number; falseNegativeRate: number };
  };
  dataQuality: {
    completeness: number;
    consistency: number;
    timeliness: number;
    accuracy: number;
    relevance: number;
    dataPoints: number;
    missingDataImpact: string;
  };
  uncertaintyFactors: {
    factor: string;
    impact: 'high' | 'medium' | 'low';
    likelihood: number;
    mitigationStrategy: string;
  }[];
};
