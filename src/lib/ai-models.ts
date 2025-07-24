import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatOpenAI } from '@langchain/openai';

export interface AIModelConfig {
  provider: 'google' | 'anthropic' | 'openai';
  modelName: string;
  apiKey: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AgentModelSelection {
  primary: AIModelConfig;
  fallback?: AIModelConfig;
}

export const MODEL_CONFIGS = {
  // Google AI Models
  'gemini-1.5-flash': {
    provider: 'google' as const,
    modelName: 'gemini-1.5-flash',
    apiKey: process.env.GOOGLE_API_KEY || '',
    temperature: 0.7,
  },
  'gemini-1.5-pro': {
    provider: 'google' as const,
    modelName: 'gemini-1.5-pro', 
    apiKey: process.env.GOOGLE_API_KEY || '',
    temperature: 0.7,
  },
  'gemini-2.0-flash': {
    provider: 'google' as const,
    modelName: 'gemini-1.5-flash',
    apiKey: process.env.GOOGLE_API_KEY || '',
    temperature: 0.7,
  },
  // Anthropic Models (placeholder for future implementation)
  'claude-3.5-sonnet': {
    provider: 'anthropic' as const,
    modelName: 'claude-3-5-sonnet-20241022',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    temperature: 0.7,
  },
  // OpenAI Models (placeholder for future implementation)
  'gpt-4o': {
    provider: 'openai' as const,
    modelName: 'gpt-4o',
    apiKey: process.env.OPENAI_API_KEY || '',
    temperature: 0.7,
  },
} as const;

export const AGENT_MODEL_SELECTIONS: Record<string, AgentModelSelection> = {
  discovery: {
    primary: MODEL_CONFIGS['gemini-2.0-flash'],
    fallback: MODEL_CONFIGS['gemini-1.5-flash'],
  },
  performance: {
    primary: MODEL_CONFIGS['gemini-2.0-flash'],
    fallback: MODEL_CONFIGS['gemini-1.5-pro'],
  },
  risk: {
    primary: MODEL_CONFIGS['gemini-2.0-flash'],
    fallback: MODEL_CONFIGS['gemini-1.5-pro'],
  },
  coaching: {
    primary: MODEL_CONFIGS['claude-3.5-sonnet'], // Will fallback to Google if no Anthropic key
    fallback: MODEL_CONFIGS['gemini-2.0-flash'],
  },
  sentiment: {
    primary: MODEL_CONFIGS['gemini-2.0-flash'],
    fallback: MODEL_CONFIGS['gemini-1.5-flash'],
  },
  synthesis: {
    primary: MODEL_CONFIGS['gpt-4o'], // Will fallback to Google if no OpenAI key
    fallback: MODEL_CONFIGS['gemini-2.0-flash'],
  },
  social: {
    primary: MODEL_CONFIGS['gemini-2.0-flash'],
    fallback: MODEL_CONFIGS['gemini-1.5-flash'],
  },
  query: {
    primary: MODEL_CONFIGS['gemini-2.0-flash'],
    fallback: MODEL_CONFIGS['gemini-1.5-flash'],
  },
};

export function createModel(config: AIModelConfig): any {
  switch (config.provider) {
    case 'google':
      return new ChatGoogleGenerativeAI({
        modelName: config.modelName,
        apiKey: config.apiKey,
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      });
    case 'anthropic':
      return new ChatAnthropic({
        model: config.modelName,
        apiKey: config.apiKey,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    case 'openai':
      return new ChatOpenAI({
        model: config.modelName,
        apiKey: config.apiKey,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
      });
    default:
      throw new Error(`Unsupported model provider: ${config.provider}`);
  }
}

export function getModelForAgent(agentType: string): any {
  const selection = AGENT_MODEL_SELECTIONS[agentType];
  if (!selection) {
    throw new Error(`Unknown agent type: ${agentType}`);
  }

  try {
    // Try primary model first
    if (selection.primary.apiKey) {
      return createModel(selection.primary);
    }
  } catch (error) {
    console.warn(`Failed to create primary model for ${agentType}:`, error);
  }

  // Fallback to secondary model
  if (selection.fallback && selection.fallback.apiKey) {
    console.log(`Using fallback model for ${agentType}: ${selection.fallback.modelName}`);
    return createModel(selection.fallback);
  }

  throw new Error(`No available models for agent type: ${agentType}`);
}

export interface ModelPerformanceMetrics {
  agentType: string;
  modelName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  error?: string;
}

export class PerformanceTracker {
  private static metrics: ModelPerformanceMetrics[] = [];

  static startTimer(agentType: string, modelName: string): number {
    return Date.now();
  }

  static recordMetric(
    agentType: string,
    modelName: string,
    startTime: number,
    success: boolean,
    error?: string
  ): void {
    const endTime = Date.now();
    const duration = endTime - startTime;

    this.metrics.push({
      agentType,
      modelName,
      startTime,
      endTime,
      duration,
      success,
      error,
    });

    console.log(`Agent ${agentType} (${modelName}): ${duration}ms ${success ? '✓' : '✗'}`);
  }

  static getMetrics(): ModelPerformanceMetrics[] {
    return [...this.metrics];
  }

  static clearMetrics(): void {
    this.metrics = [];
  }

  static getAveragePerformance(agentType?: string): Record<string, number> {
    const filteredMetrics = agentType 
      ? this.metrics.filter(m => m.agentType === agentType)
      : this.metrics;

    const grouped = filteredMetrics.reduce((acc, metric) => {
      const key = `${metric.agentType}-${metric.modelName}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(metric.duration);
      return acc;
    }, {} as Record<string, number[]>);

    return Object.entries(grouped).reduce((acc, [key, durations]) => {
      acc[key] = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      return acc;
    }, {} as Record<string, number>);
  }
}