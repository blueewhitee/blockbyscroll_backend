import { logger } from '../utils/logger';
import {
  GoogleGenerativeAI,
  GenerationConfig,
  SafetySetting,
  HarmCategory,
  HarmBlockThreshold,
} from '@google/generative-ai';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface AIAnalysisResponse {
  user_pattern: 'Deep Focus/Learning' | 'Active Socializing' | 'Intentional Leisure' | 'Casual Browsing/Catch-up' | 'Passive Consumption/Doomscrolling' | 'Anxiety-Driven Information Seeking';
  addiction_risk: number;
  educational_value: number;
  recommended_action: 'session_extension' | 'gentle_reward' | 'maintain_limit' | 'show_warning' | 'immediate_break';
  bonus_scrolls: number;
  reasoning: string;
  break_suggestion?: string;
  // Legacy fields for backward compatibility
  content_type?: 'productive' | 'neutral' | 'entertainment' | 'doomscroll' | 'unknown';
  confidence_score?: number;
}

export interface AIAnalysisRequest {
  content: string;
  context: {
    scrollCount: number;
    maxScrolls: number;
    domain: string;
    timestamp: number;
    timeOfDay: string;
    scrollTime: number;
  };
}

export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private generationConfig: GenerationConfig;
  private safetySettings: SafetySetting[];
  private model: string;

  constructor(config: GeminiConfig) {
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model;
    this.generationConfig = {
      temperature: config.temperature,
      maxOutputTokens: config.maxTokens,
      responseMimeType: 'application/json',
    };
    this.safetySettings = [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
  }

  public async analyzeContent(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const prompt = this.buildPrompt(request);
      const generativeModel = this.genAI.getGenerativeModel({
        model: this.model,
        generationConfig: this.generationConfig,
        safetySettings: this.safetySettings,
      });

      const result = await generativeModel.generateContent(prompt);
      const response = result.response;
      const jsonText = response.text();
      
      return JSON.parse(jsonText) as AIAnalysisResponse;
    } catch (error) {
      logger.error('Error analyzing content with Gemini', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to analyze content with Gemini');
    }
  }

  public getConfig(): GeminiConfig {
    return {
        apiKey: '[redacted]',
        model: this.model,
        temperature: this.generationConfig.temperature || 0,
        maxTokens: this.generationConfig.maxOutputTokens || 0,
    };
  }

  private buildPrompt(request: AIAnalysisRequest): string {
    // This prompt remains the same as it's about the logic, not the API call
    const { content, context } = request;
    return `
      Analyze the provided text content and user behavior to determine the user's scrolling pattern, addiction risk, and educational value.
      
      **User Context:**
      - Domain: ${context.domain}
      - Time of Day: ${context.timeOfDay}
      - Scroll Count: ${context.scrollCount} / ${context.maxScrolls}
      - Time Spent Scrolling (seconds): ${context.scrollTime}

      **Content Snippet (first 500 chars):**
      \`\`\`
      ${content.substring(0, 500)}
      \`\`\`

      **Instructions:**
      Respond with a JSON object matching this exact structure:
      \`\`\`json
      {
        "user_pattern": "'Deep Focus/Learning' | 'Active Socializing' | 'Intentional Leisure' | 'Casual Browsing/Catch-up' | 'Passive Consumption/Doomscrolling' | 'Anxiety-Driven Information Seeking'",
        "addiction_risk": "A number between 0 (low) and 1 (high). Consider scroll speed, time, and content type.",
        "educational_value": "A number between 0 (low) and 1 (high).",
        "recommended_action": "'session_extension' | 'gentle_reward' | 'maintain_limit' | 'show_warning' | 'immediate_break'",
        "bonus_scrolls": "A number of extra scrolls to grant. Typically 0, or 5-10 for highly productive content.",
        "reasoning": "A brief explanation for your analysis.",
        "break_suggestion": "Optional: A short, actionable suggestion for a break if recommended_action is 'show_warning' or 'immediate_break'."
      }
      \`\`\`

      **Analysis Guidelines:**
      1.  **user_pattern**:
          - 'Deep Focus/Learning': Long articles, educational sites (e.g., docs, tutorials), focused reading.
          - 'Active Socializing': Social media, but with evidence of engagement (e.g., reading long comments, profiles).
          - 'Intentional Leisure': Hobby sites, planning activities, reading reviews.
          - 'Casual Browsing/Catch-up': News headlines, forums, general interest.
          - 'Passive Consumption/Doomscrolling': Endless feeds (social media, news), short-form video, high scroll rate with low engagement.
          - 'Anxiety-Driven Information Seeking': Repeatedly checking news, health sites, or forums for urgent/negative information.
      2.  **addiction_risk**: High for 'Doomscrolling' and 'Anxiety-Driven'. Moderate for 'Casual Browsing'. Low for 'Deep Focus'.
      3.  **educational_value**: High for 'Deep Focus'. Low for 'Doomscrolling'.
      4.  **recommended_action**:
          - 'session_extension'/'gentle_reward': For 'Deep Focus' or highly educational content.
          - 'maintain_limit': For 'Intentional Leisure' or 'Active Socializing'.
          - 'show_warning': When approaching the limit with 'Casual Browsing' or signs of doomscrolling.
          - 'immediate_break': For clear 'Doomscrolling' or 'Anxiety-Driven' patterns, especially if over the limit.
      5.  **reasoning**: Be concise. Example: "User is in deep focus on a technical article, which is productive."
      `;
  }

  public async testConnection(): Promise<boolean> {
    try {
      const generativeModel = this.genAI.getGenerativeModel({ model: this.model });
      const prompt = 'This is a test prompt.';
      const result = await generativeModel.generateContent(prompt);
      return result.response.text().length > 0;
    } catch (error) {
      logger.error('Gemini connection test failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}
