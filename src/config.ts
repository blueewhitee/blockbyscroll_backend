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
    console.log('Found GEMINI_API_KEY in environment variable.');
    return envApiKey;
  }

  // Fallback to Google Cloud Secret Manager for production on GCP
  console.log('GEMINI_API_KEY not in environment. Falling back to Secret Manager.');
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
    console.log('Successfully retrieved secret from Secret Manager.');
    return payload;
  } catch (error) {
    console.error('Failed to access secret from Secret Manager.', error);
    throw new Error(
      'GEMINI_API_KEY env var is not set and Secret Manager fallback failed.'
    );
  }
}
