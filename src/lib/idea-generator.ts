import Anthropic from '@anthropic-ai/sdk';
import { AggregatedTrend } from './trend-aggregator';
import { supabaseAdmin } from './supabase';

interface GeneratedIdea {
  title: string;
  description: string;
  content: {
    whatItIs: string;
    whyItMatters: string;
    toolsYoudUse: string[];
    mvpFeatureSet: string[];
    monetizationIdeas: string[];
    buildDifficulty: number;
    buildDifficultyReason: string;
    variations: string[];
    tweetableSummary: string;
  };
  difficulty_score: number;
  revenue_potential: 'low' | 'medium' | 'high';
  build_time_estimate: string;
  tools_required: string[];
  tags: string[];
  trend_signals: any;
}

export class IdeaGenerator {
  private anthropic: Anthropic;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }
    this.anthropic = new Anthropic({
      apiKey: apiKey,
    });
  }

  async generateIdeaFromTrend(trend: AggregatedTrend): Promise<GeneratedIdea | null> {
    try {
      const prompt = this.buildIdeaPrompt(trend);
      
      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.8,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const response = message.content[0];
      if (response.type !== 'text') {
        throw new Error('Unexpected response type from Claude');
      }

      return this.parseIdeaResponse(response.text, trend);
    } catch (error) {
      console.error('Failed to generate idea from trend:', error);
      return null;
    }
  }

  async generateDailyIdeas(topTrends: AggregatedTrend[]): Promise<GeneratedIdea[]> {
    console.log('🤖 Generating AI-powered app ideas...');
    
    const ideas: GeneratedIdea[] = [];
    
    // Generate ideas from top 5 trends
    for (const trend of topTrends.slice(0, 5)) {
      const idea = await this.generateIdeaFromTrend(trend);
      if (idea) {
        ideas.push(idea);
      }
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Store generated ideas in database
    for (const idea of ideas) {
      await this.storeIdea(idea);
    }

    console.log(`✅ Generated ${ideas.length} new app ideas`);
    return ideas;
  }

  private buildIdeaPrompt(trend: AggregatedTrend): string {
    return `You are powering a platform that gives users one high-signal, highly buildable app idea per day for "vibecoders" — non-technical indie hackers, creators, and solo builders using AI tools like Claude, Replit, Bolt, Loveable, and low-code platforms.

Based on this trending signal data:
- Keywords: ${trend.keywords.join(', ')}
- Category: ${trend.category}
- Strength: ${trend.overallStrength.toFixed(2)}
- Suggested app types: ${trend.suggestedAppTypes.join(', ')}
- Market signals: ${JSON.stringify(trend.marketSignals, null, 2)}

Generate ONE specific, buildable app idea that:
• Is specific and shippable (not vague)
• Slightly clever or unexpected
• Useful or monetizable
• Backed by the trend data provided
• Written in a fun, smart, punchy voice

IMPORTANT: Respond with ONLY valid JSON. No additional text, explanations, or formatting. Just the JSON object below:

{
  "title": "Catchy, tweetable title",
  "description": "1-2 sentence description focusing on vibe and value",
  "whatItIs": "Describe what the app does in 1–2 clear sentences. Focus on the vibe and value, not technical jargon.",
  "whyItMatters": "Explain the problem, trend, or use case this taps into. Make it feel relevant, cool, or niche-specific.",
  "toolsYoudUse": ["Claude", "Replit", "Supabase", "etc"],
  "mvpFeatureSet": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"],
  "monetizationIdeas": ["Revenue idea 1", "Revenue idea 2"],
  "buildDifficulty": 3,
  "buildDifficultyReason": "Brief explanation why this difficulty rating",
  "variations": ["Variation 1", "Variation 2", "Variation 3"],
  "tweetableSummary": "One bold takeaway in tweet-style that captures the essence"
}

Make it concrete, actionable, and exciting for vibecoders to build TODAY.`;
  }

  private parseIdeaResponse(response: string, trend: AggregatedTrend): GeneratedIdea | null {
    try {
      // Clean up the response - remove any HTML, markdown, or extra text
      let cleanResponse = response;
      
      // Remove any HTML tags
      cleanResponse = cleanResponse.replace(/<[^>]*>/g, '');
      
      // Extract JSON from response (more robust regex)
      const jsonMatch = cleanResponse.match(/\{[\s\S]*?\}(?=\s*$|\s*\n\s*$)/);
      if (!jsonMatch) {
        console.log('Raw response:', response);
        throw new Error('No valid JSON found in response');
      }

      let jsonString = jsonMatch[0];
      
      // Clean up common JSON issues
      jsonString = jsonString
        .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
        .replace(/[\u2018\u2019]/g, "'") // Replace smart apostrophes
        .replace(/\n/g, ' ') // Replace newlines with spaces
        .trim();

      const parsed = JSON.parse(jsonString);
      
      // Determine revenue potential based on monetization ideas
      const revenueKeywords = ['subscription', 'premium', 'enterprise', 'api', 'marketplace'];
      const hasHighRevenue = parsed.monetizationIdeas.some((idea: string) => 
        revenueKeywords.some(keyword => idea.toLowerCase().includes(keyword))
      );

      return {
        title: parsed.title,
        description: parsed.description,
        content: {
          whatItIs: parsed.whatItIs,
          whyItMatters: parsed.whyItMatters,
          toolsYoudUse: parsed.toolsYoudUse,
          mvpFeatureSet: parsed.mvpFeatureSet,
          monetizationIdeas: parsed.monetizationIdeas,
          buildDifficulty: parsed.buildDifficulty,
          buildDifficultyReason: parsed.buildDifficultyReason,
          variations: parsed.variations,
          tweetableSummary: parsed.tweetableSummary,
        },
        difficulty_score: parsed.buildDifficulty,
        revenue_potential: hasHighRevenue ? 'high' : parsed.monetizationIdeas.length > 1 ? 'medium' : 'low',
        build_time_estimate: this.estimateBuildTime(parsed.buildDifficulty),
        tools_required: parsed.toolsYoudUse,
        tags: this.generateTags(trend, parsed),
        trend_signals: {
          keywords: trend.keywords,
          category: trend.category,
          strength: trend.overallStrength,
          sources: Object.keys(trend.sources)
        }
      };
    } catch (error) {
      console.error('Failed to parse idea response:', error);
      console.log('Raw response:', response);
      return null;
    }
  }

  private estimateBuildTime(difficulty: number): string {
    const estimates = {
      1: '1-2 days',
      2: '3-5 days', 
      3: '1-2 weeks',
      4: '2-4 weeks',
      5: '1-2 months'
    };
    return estimates[difficulty as keyof typeof estimates] || '1-2 weeks';
  }

  private generateTags(trend: AggregatedTrend, parsed: any): string[] {
    const tags = [];
    
    // Add category-based tag
    if (trend.category !== 'General') {
      tags.push(trend.category.toLowerCase().replace('/', '-'));
    }
    
    // Add trend-based tag
    tags.push('trend-backed');
    
    // Add difficulty-based tag
    if (parsed.buildDifficulty <= 2) {
      tags.push('easy-build');
    } else if (parsed.buildDifficulty >= 4) {
      tags.push('advanced');
    }
    
    // Add revenue potential tag
    tags.push('revenue-ready');
    
    // Add source-based tags
    if (trend.sources.reddit) tags.push('community-driven');
    if (trend.sources.google_trends) tags.push('search-trending');
    
    return tags;
  }

  private async storeIdea(idea: GeneratedIdea): Promise<void> {
    if (!supabaseAdmin) {
      console.log('⚠️ Supabase not configured, skipping idea storage');
      return;
    }

    try {
      await supabaseAdmin
        .from('ideas')
        .insert({
          title: idea.title,
          description: idea.description,
          content: idea.content,
          difficulty_score: idea.difficulty_score,
          revenue_potential: idea.revenue_potential,
          build_time_estimate: idea.build_time_estimate,
          tools_required: idea.tools_required,
          tags: idea.tags,
          trend_signals: idea.trend_signals,
          published_date: new Date().toISOString().split('T')[0],
          is_published: false // Will be published after review
        });
      
      console.log(`💾 Stored idea: ${idea.title}`);
    } catch (error) {
      console.error('Failed to store idea:', error);
    }
  }
}