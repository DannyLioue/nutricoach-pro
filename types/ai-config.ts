/**
 * AI Configuration Type Definitions
 *
 * Types for AI provider, model, and user configuration management.
 */

/**
 * Supported AI providers
 */
export type AIProviderType = 'google' | 'openai' | 'anthropic';

/**
 * AI task types that can be configured with different models
 */
export type AITaskType =
  | 'health-analysis'
  | 'diet-recommendation'
  | 'exercise-recommendation'
  | 'lifestyle-recommendation'
  | 'diet-photo-analysis'
  | 'consultation-analysis'
  | 'weekly-summary'
  | 'general-text';

/**
 * AI capabilities that a model may support
 */
export type AICapability = 'text' | 'vision' | 'json-mode' | 'function-calling';

/**
 * AI Provider entity
 */
export interface AIProvider {
  id: string;
  name: AIProviderType;
  displayName: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * AI Model entity
 */
export interface AIModel {
  id: string;
  providerId: string;
  modelId: string; // e.g., "gemini-2.5-pro", "gpt-4o"
  displayName: string;
  description?: string;
  capabilities: AICapability[];
  maxTokens?: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User's stored API key (safe display info only)
 */
export interface UserAIKey {
  id: string;
  userId: string;
  providerId: string;
  keyLast4: string; // Last 4 digits for display (e.g., "...xyz9")
  isValid: boolean;
  lastValidated?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User's model configuration for a specific task
 */
export interface AIModelConfig {
  id: string;
  userId: string;
  modelId: string;
  taskType: AITaskType;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User's complete AI preferences
 */
export interface UserAIPreferences {
  defaultProvider?: string;
  useEnvFallback: boolean;
}

/**
 * Configuration display for UI - current model for a task
 */
export interface AITaskConfig {
  taskType: AITaskType;
  taskName: string; // Human-readable name (e.g., "健康报告分析")
  description: string; // Description of what the task does
  currentModel: {
    modelId: string;
    displayName: string;
    provider: string;
    providerName: string;
  } | null;
  availableModels: Array<{
    modelId: string;
    displayName: string;
    provider: string;
    providerName: string;
  }>;
  isCustomConfigured: boolean;
}

/**
 * API response for user's AI configuration
 */
export interface UserAIConfigResponse {
  keys: Array<{
    id: string;
    providerId: string;
    providerName: string;
    displayName: string;
    keyLast4: string;
    isValid: boolean;
    lastValidated?: Date;
  }>;
  configs: Array<{
    id: string;
    userId: string;
    modelId: string;
    taskType: AITaskType;
    enabled: boolean;
    model: {
      id: string;
      modelId: string;
      displayName: string;
      provider: {
        id: string;
        name: string;
        displayName: string;
      };
    };
  }>;
  providers: Array<{
    id: string;
    name: string;
    displayName: string;
    enabled: boolean;
    models: Array<{
      id: string;
      modelId: string;
      displayName: string;
      capabilities: AICapability[];
      enabled: boolean;
    }>;
  }>;
  preferences: UserAIPreferences;
}

/**
 * Request body for updating AI configuration
 */
export interface UpdateAIConfigRequest {
  defaultProvider?: string;
  useEnvFallback?: boolean;
  modelConfigs?: Array<{
    taskType: string;
    modelId: string;
    enabled?: boolean;
  }>;
}

/**
 * Request body for adding an API key
 */
export interface AddAPIKeyRequest {
  providerId: string;
  apiKey: string;
}

/**
 * Task definitions for the UI
 */
export interface TaskDefinition {
  taskType: AITaskType;
  taskName: string;
  description: string;
}

/**
 * Model information for task configuration
 */
export interface TaskModelInfo {
  modelId: string;
  displayName: string;
  provider: string;
  providerName: string;
}

/**
 * Full task configuration with current and available models
 */
export interface TaskConfiguration {
  taskType: AITaskType;
  taskName: string;
  description: string;
  currentModel: TaskModelInfo | null;
  availableModels: TaskModelInfo[];
  isCustomConfigured: boolean;
}
