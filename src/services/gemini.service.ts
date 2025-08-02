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
  break_suggestion?: string | null;
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
      
      const parsed = JSON.parse(jsonText);
      
      // Runtime validation to ensure type safety
      if (!this.isValidAIAnalysisResponse(parsed)) {
        logger.error('Invalid AI response structure', { parsed });
        throw new Error('AI returned invalid response structure');
      }
      
      // Generate random bonus scrolls based on AI classification
      parsed.bonus_scrolls = this.generateRandomBonusScrolls(parsed.user_pattern);
      
      return parsed as AIAnalysisResponse;
    } catch (error) {
      logger.error('Error analyzing content with Gemini', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Failed to analyze content with Gemini');
    }
  }

  private generateRandomBonusScrolls(userPattern: string): number {
    const ranges = {
      'Deep Focus/Learning': { min: 20, max: 25 },
      'Active Socializing': { min: 15, max: 20 },
      'Intentional Leisure': { min: 10, max: 15 },
      'Casual Browsing/Catch-up': { min: 8, max: 13 },
      'Passive Consumption/Doomscrolling': { min: 3, max: 5 },
      'Anxiety-Driven Information Seeking': { min: 3, max: 5 }
    };

    const range = ranges[userPattern as keyof typeof ranges] || ranges['Casual Browsing/Catch-up'];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  private isValidAIAnalysisResponse(obj: any): obj is AIAnalysisResponse {
    const validPatterns = ['Deep Focus/Learning', 'Active Socializing', 'Intentional Leisure', 'Casual Browsing/Catch-up', 'Passive Consumption/Doomscrolling', 'Anxiety-Driven Information Seeking'];
    const validActions = ['session_extension', 'gentle_reward', 'maintain_limit', 'show_warning', 'immediate_break'];
    
    return (
      obj &&
      typeof obj === 'object' &&
      typeof obj.user_pattern === 'string' &&
      validPatterns.includes(obj.user_pattern) &&
      typeof obj.addiction_risk === 'number' &&
      obj.addiction_risk >= 0 && obj.addiction_risk <= 1 &&
      typeof obj.educational_value === 'number' &&
      obj.educational_value >= 0 && obj.educational_value <= 1 &&
      typeof obj.recommended_action === 'string' &&
      validActions.includes(obj.recommended_action) &&
      typeof obj.reasoning === 'string' &&
      (obj.break_suggestion === undefined || obj.break_suggestion === null || typeof obj.break_suggestion === 'string')
    );
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
        "user_pattern": "Deep Focus/Learning",
        "addiction_risk": 0.5,
        "educational_value": 0.7,
        "recommended_action": "session_extension",
        "reasoning": "Brief explanation with appropriate tone for the pattern",
        "break_suggestion": null
      }
      \`\`\`

      **CRITICAL: Return valid JSON with these exact field names and types:**
      - user_pattern: string (exact match from the 6 options above)
      - addiction_risk: number between 0.0 and 1.0
      - educational_value: number between 0.0 and 1.0  
      - recommended_action: string (exact match from the 5 options above)
      - reasoning: string
      - break_suggestion: string or null (only for warnings/breaks)

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
      5.  **reasoning**: Match the tone to the pattern. Keep it short and to the point:
          - Deep Focus/Learning: Enthusiastic/Encouraging tone. "Excellent! Deep learning on [topic]. Keep going!"
          - Active Socializing: Warm/Friendly tone. "Great social engagement with friends and community!"
          - Intentional Leisure: Cheerful/Supportive tone. "Nice! Planning your [activity]. Enjoy the research!"
          - Casual Browsing: Neutral/Informative tone. "Staying updated with general content."
          - Doomscrolling: Concerned/Firm tone. "Mindless scrolling detected. Time for a break!"
          - Anxiety-Driven: Gentle/Caring tone. "Noticed anxious browsing. Let's take a calming break."
      
      **Focus on accurate pattern classification. Bonus scrolls will be automatically generated based on your classification.**
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
