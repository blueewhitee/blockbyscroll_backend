import { logger } from './utils/logger';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

/**
 * Returns a hardcoded configuration for the Gemini service.
 * This function ensures that the model is always 'gemini-2.0-flash-lite-001'
 * and cannot be overridden by environment variables.
 *
 * @param {string} apiKey The Gemini API key.
 * @returns {GeminiConfig} The configuration for the Gemini service.
 */
export function getGeminiConfig(apiKey: string): Readonly<GeminiConfig> {
  const model = 'gemini-2.0-flash-lite-001';
  logger.debug(`Gemini model fixed to: ${model}`);
  return Object.freeze({
    apiKey,
    model,
    temperature: 0.7,
    maxTokens: 2048,
  });
}

/**
 * Gets the Gemini API key.
 *
 * This function prioritizes reading the API key from the `GEMINI_API_KEY`
 * environment variable. If it's not set, it falls back to fetching it
 * from Google Cloud Secret Manager for production environments.
 *
 * @returns {Promise<string>} The Gemini API key.
 * @throws {Error} If the API key is not found.
 */
export async function getGeminiApiKey(): Promise<string> {
  // Prioritize environment variable for local Docker and testing
  const envApiKey = process.env.GEMINI_API_KEY;
  if (envApiKey) {
    logger.info('Found GEMINI_API_KEY in environment variable');
    return envApiKey;
  }

  // Fallback to Google Cloud Secret Manager for production on GCP
  logger.info('GEMINI_API_KEY not in environment, falling back to Secret Manager');
  try {
    const { SecretManagerServiceClient } = await import(
      '@google-cloud/secret-manager'
    );
    const secretManagerClient = new SecretManagerServiceClient();
    const secretName = process.env.GEMINI_API_KEY_SECRET || 'GEMINI_API_KEY';
    const gcpProject = process.env.GCP_PROJECT;

    if (!gcpProject) {
        throw new Error('GCP_PROJECT environment variable must be set for Secret Manager.');
    }

    const name = `projects/${gcpProject}/secrets/${secretName}/versions/latest`;
    const [version] = await secretManagerClient.accessSecretVersion({ name });
    const payload = version.payload?.data?.toString();
    
    if (!payload) {
      throw new Error(`Secret ${secretName} has no payload.`);
    }
    logger.info('Successfully retrieved secret from Secret Manager');
    return payload;
  } catch (error) {
    logger.error('Failed to access secret from Secret Manager', { 
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(
      'GEMINI_API_KEY env var is not set and Secret Manager fallback failed.'
    );
  }
}
