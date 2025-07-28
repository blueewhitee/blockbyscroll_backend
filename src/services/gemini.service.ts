import { logger } from '../utils/logger';

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

interface GeminiApiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
  }[];
}

export class GeminiService {
  private config: GeminiConfig;
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(config: GeminiConfig) {
    this.config = {
      ...config,
      model: config.model || 'gemini-2.0-flash-lite' // Latest model as of 2025
    };
    
    if (!config.apiKey) {
      throw new Error('Gemini API key is required');
    }
  }

  public async analyzeContent(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
    try {
      const prompt = this.buildPrompt(request);
      const response = await this.callGeminiAPI(prompt);
      return this.parseResponse(response);
    } catch (error) {
      logger.error('Error analyzing content', { error: error instanceof Error ? error.message : String(error) });
      return this.getFallbackResponse(error);
    }
  }

  private buildPrompt(request: AIAnalysisRequest): string {
    const { content, context } = request;
    
    return `You are a digital wellness AI that analyzes scrolling behavior. Return ONLY valid JSON, no other text.

CONTEXT:
- Domain: ${context.domain}
- Scrolls: ${context.scrollCount}/${context.maxScrolls}
- Time scrolling: ${context.scrollTime} minutes
- Time of day: ${context.timeOfDay}

CONTENT:
"${content.substring(0, 1000)}..."

ANALYZE and return JSON with these exact fields:

{
  "user_pattern": "Deep Focus/Learning" | "Active Socializing" | "Intentional Leisure" | "Casual Browsing/Catch-up" | "Passive Consumption/Doomscrolling" | "Anxiety-Driven Information Seeking",
  "addiction_risk": 0-10,
  "educational_value": 0-10,
  "recommended_action": "session_extension" | "gentle_reward" | "maintain_limit" | "show_warning" | "immediate_break",
  "bonus_scrolls": 0-20,
  "reasoning": "brief explanation",
  "break_suggestion": "specific suggestion or null"
}

REWARD STRATEGY - Always give some bonus scrolls to keep users engaged:
- Deep Focus/Learning: 12-20 bonus scrolls (high educational value)
- Active Socializing: 8-15 bonus scrolls (meaningful connections)
- Intentional Leisure: 6-12 bonus scrolls (quality entertainment)
- Casual Browsing/Catch-up: 3-8 bonus scrolls (light engagement reward)
- Passive Consumption/Doomscrolling: 1-5 bonus scrolls (minimal but still rewarding)
- Anxiety-Driven Information Seeking: 2-6 bonus scrolls (acknowledge need but encourage balance)

EXAMPLES:

Educational content:
{
  "user_pattern": "Deep Focus/Learning",
  "addiction_risk": 2,
  "educational_value": 9,
  "recommended_action": "session_extension",
  "bonus_scrolls": 18,
  "reasoning": "Excellent learning content! Here are extra scrolls to keep building those skills",
  "break_suggestion": null
}

Social media casual scroll:
{
  "user_pattern": "Casual Browsing/Catch-up",
  "addiction_risk": 4,
  "educational_value": 3,
  "recommended_action": "gentle_reward",
  "bonus_scrolls": 5,
  "reasoning": "Nice catch-up session! Here are some bonus scrolls to keep exploring",
  "break_suggestion": null
}

Doomscrolling content:
{
  "user_pattern": "Passive Consumption/Doomscrolling",
  "addiction_risk": 7,
  "educational_value": 1,
  "recommended_action": "gentle_reward",
  "bonus_scrolls": 3,
  "reasoning": "We all need some mindless browsing! Here are a few extra scrolls to keep you going - maybe try something enriching next?",
  "break_suggestion": "Search for something you're genuinely curious about"
}

NOW ANALYZE AND RETURN ONLY JSON:`;
  }

  private async callGeminiAPI(prompt: string): Promise<string> {
    const url = `${this.baseUrl}/${this.config.model}:generateContent?key=${this.config.apiKey}`;
    
    logger.debug('Making API call to Gemini', { 
      url: url.replace(this.config.apiKey, 'API_KEY_HIDDEN'),
      model: this.config.model,
      temperature: this.config.temperature,
      maxTokens: this.config.maxTokens
    });
    
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: this.config.temperature,
        maxOutputTokens: this.config.maxTokens,
        topP: 0.8,
        topK: 40
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    };

    logger.debug('Gemini API request body', { requestBody });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'NoMoScroll-Backend/1.0.0'
      },
      body: JSON.stringify(requestBody)
    });

    logger.debug('Gemini API response status', { 
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Gemini API error response', { 
        status: response.status,
        errorText 
      });
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    // Fix: Properly type the response
    const data = await response.json() as GeminiApiResponse;
    logger.debug('Raw Gemini API response', { data });
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      logger.error('Invalid Gemini response structure', { data });
      throw new Error('Invalid response format from Gemini API');
    }

    const responseText = data.candidates[0].content.parts[0].text;
    logger.debug('Extracted Gemini response text', { responseText });
    
    return responseText;
  }

  private parseResponse(responseText: string): AIAnalysisResponse {
    logger.debug('Parsing Gemini response', { 
      responseText,
      responseLength: responseText.length 
    });
    
    try {
      // Clean the response text more thoroughly
      let cleanedText = responseText.trim();
      
      // Remove markdown code blocks if present
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      // More aggressive JSON extraction
      const jsonPatterns = [
        /\{[\s\S]*?\}(?=\s*$)/,  // JSON at the end
        /\{[\s\S]*?\}(?=\s*\n)/,  // JSON followed by newline
        /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/,  // Nested JSON
        /\{[\s\S]*\}/  // Any JSON-like structure
      ];
      
      for (const pattern of jsonPatterns) {
        const match = cleanedText.match(pattern);
        if (match) {
          cleanedText = match[0];
          break;
        }
      }
      
      // Remove any trailing text after the JSON
      const jsonEnd = cleanedText.lastIndexOf('}');
      if (jsonEnd !== -1) {
        cleanedText = cleanedText.substring(0, jsonEnd + 1);
      }
      
      logger.debug('Cleaned text for JSON parsing', { cleanedText });
      
      const parsed = JSON.parse(cleanedText);
      logger.debug('Successfully parsed JSON from Gemini', { parsed });
      
      // Validate required fields exist
      if (!parsed.user_pattern || !parsed.recommended_action) {
        logger.error('Missing required fields in Gemini response', { parsed });
        throw new Error('Invalid response structure');
      }
      
      return {
        user_pattern: parsed.user_pattern || 'Casual Browsing/Catch-up',
        addiction_risk: Math.max(0, Math.min(10, parsed.addiction_risk || 5)),
        educational_value: Math.max(0, Math.min(10, parsed.educational_value || 0)),
        recommended_action: parsed.recommended_action || 'maintain_limit',
        bonus_scrolls: Math.max(0, Math.min(20, parsed.bonus_scrolls || 0)),
        reasoning: parsed.reasoning || 'Analysis completed',
        break_suggestion: parsed.break_suggestion || null,
        // Legacy fields for backward compatibility
        content_type: parsed.content_type || 'unknown',
        confidence_score: Math.max(0, Math.min(1, parsed.confidence_score || 0.8))
      };
    } catch (error) {
      logger.error('Error parsing Gemini response', { 
        error: error instanceof Error ? error.message : String(error),
        responseText 
      });
      
      // Try one more time with a simple regex extraction
      try {
        const simpleMatch = responseText.match(/\{[^{}]*"user_pattern"[^{}]*\}/);
        if (simpleMatch) {
          const parsed = JSON.parse(simpleMatch[0]);
          logger.info('Recovered Gemini response with simple regex', { parsed });
          return this.normalizeResponse(parsed);
        }
      } catch (recoveryError) {
        logger.error('Recovery attempt failed', { 
          recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError)
        });
      }
      
      throw new Error('Failed to parse AI response');
    }
  }

  private normalizeResponse(parsed: any): AIAnalysisResponse {
    return {
      user_pattern: parsed.user_pattern || 'Casual Browsing/Catch-up',
      addiction_risk: Math.max(0, Math.min(10, parsed.addiction_risk || 5)),
      educational_value: Math.max(0, Math.min(10, parsed.educational_value || 0)),
      recommended_action: parsed.recommended_action || 'maintain_limit',
      bonus_scrolls: Math.max(0, Math.min(20, parsed.bonus_scrolls || 0)),
      reasoning: parsed.reasoning || 'Analysis completed',
      break_suggestion: parsed.break_suggestion || null,
      content_type: parsed.content_type || 'unknown',
      confidence_score: Math.max(0, Math.min(1, parsed.confidence_score || 0.8))
    };
  }

  private getFallbackResponse(error: any): AIAnalysisResponse {
    logger.error('Using fallback response due to error', { 
      error: error instanceof Error ? error.message : String(error)
    });
    
    return {
      user_pattern: 'Casual Browsing/Catch-up',
      addiction_risk: 5,
      educational_value: 5,
      recommended_action: 'maintain_limit',
      bonus_scrolls: 0,
      reasoning: 'AI analysis unavailable, maintaining original scroll limit',
      break_suggestion: 'Take a 5-minute break to rest your eyes',
      // Legacy fields for backward compatibility
      content_type: 'unknown',
      confidence_score: 0.0
    };
  }

  public async testConnection(): Promise<boolean> {
    try {
      const testRequest: AIAnalysisRequest = {
        content: 'Test content for API validation',
        context: {
          scrollCount: 1,
          maxScrolls: 30,
          domain: 'test.com',
          timestamp: Date.now(),
          timeOfDay: new Date().toLocaleTimeString(),
          scrollTime: 1
        }
      };
      
      await this.analyzeContent(testRequest);
      return true;
    } catch (error) {
      logger.error('Gemini connection test failed', { 
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
}
