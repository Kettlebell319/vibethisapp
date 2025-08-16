import { RedditTrendAnalyzer } from './trend-sources/reddit';
import { GoogleTrendsAnalyzer } from './trend-sources/google-trends';
import { supabaseAdmin } from './supabase';

export interface AggregatedTrend {
  keywords: string[];
  sources: {
    reddit?: any[];
    google_trends?: any[];
    github?: any[];
  };
  overallStrength: number;
  category: string;
  suggestedAppTypes: string[];
  marketSignals: {
    searchVolume?: number;
    socialMentions?: number;
    competitorCount?: number;
  };
}

export class TrendAggregator {
  private redditAnalyzer: RedditTrendAnalyzer;
  private googleTrendsAnalyzer: GoogleTrendsAnalyzer;

  constructor() {
    this.redditAnalyzer = new RedditTrendAnalyzer();
    this.googleTrendsAnalyzer = new GoogleTrendsAnalyzer();
  }

  async collectAllTrendSignals(): Promise<AggregatedTrend[]> {
    console.log('🔍 Starting trend signal collection...');
    
    // Collect from all sources
    const [redditSignals, googleTrendsSignals] = await Promise.all([
      this.collectRedditSignals(),
      this.collectGoogleTrendsSignals()
    ]);

    // Store raw signals in database
    await this.storeRawSignals(redditSignals, googleTrendsSignals);

    // Aggregate and analyze
    const aggregatedTrends = this.aggregateSignals(redditSignals, googleTrendsSignals);
    
    console.log(`✅ Collected ${aggregatedTrends.length} aggregated trends`);
    return aggregatedTrends;
  }

  private async collectRedditSignals() {
    console.log('📱 Collecting Reddit signals...');
    try {
      const signals = await this.redditAnalyzer.scanTrendingSubreddits();
      console.log(`Found ${signals.length} Reddit signals`);
      return signals;
    } catch (error) {
      console.error('Reddit collection failed:', error);
      return [];
    }
  }

  private async collectGoogleTrendsSignals() {
    console.log('📈 Collecting Google Trends signals...');
    try {
      const keywords = this.googleTrendsAnalyzer.getAppIdeaKeywords();
      const signals = await this.googleTrendsAnalyzer.getTrendingKeywords(keywords);
      console.log(`Found ${signals.length} Google Trends signals`);
      return signals;
    } catch (error) {
      console.error('Google Trends collection failed:', error);
      return [];
    }
  }

  private async storeRawSignals(redditSignals: any[], googleTrendsSignals: any[]) {
    if (!supabaseAdmin) {
      console.log('⚠️ Supabase not configured, skipping signal storage');
      return;
    }

    console.log('💾 Storing raw signals in database...');
    
    try {
      // Store Reddit signals
      for (const signal of redditSignals) {
        await supabaseAdmin
          .from('trend_signals')
          .insert({
            source: 'reddit',
            signal_type: 'discussion_post',
            keyword: signal.keywords.join(', '),
            data: signal,
            strength_score: this.redditAnalyzer.calculateSignalStrength(signal)
          });
      }

      // Store Google Trends signals
      for (const signal of googleTrendsSignals) {
        await supabaseAdmin
          .from('trend_signals')
          .insert({
            source: 'google_trends',
            signal_type: 'search_volume',
            keyword: signal.keyword,
            data: signal,
            strength_score: this.googleTrendsAnalyzer.calculateTrendStrength(signal)
          });
      }

      console.log('✅ Raw signals stored successfully');
    } catch (error) {
      console.error('Failed to store raw signals:', error);
    }
  }

  private aggregateSignals(redditSignals: any[], googleTrendsSignals: any[]): AggregatedTrend[] {
    const trends: Map<string, AggregatedTrend> = new Map();

    // Process Reddit signals
    redditSignals.forEach(signal => {
      signal.keywords.forEach((keyword: string) => {
        this.addOrUpdateTrend(trends, keyword, 'reddit', signal);
      });
    });

    // Process Google Trends signals
    googleTrendsSignals.forEach(signal => {
      this.addOrUpdateTrend(trends, signal.keyword, 'google_trends', signal);
    });

    // Convert to array and sort by strength
    return Array.from(trends.values())
      .filter(trend => trend.overallStrength > 0.1) // Filter weak signals
      .sort((a, b) => b.overallStrength - a.overallStrength)
      .slice(0, 20); // Top 20 trends
  }

  private addOrUpdateTrend(
    trends: Map<string, AggregatedTrend>, 
    keyword: string, 
    source: string, 
    signal: any
  ) {
    const trendKey = keyword.toLowerCase();
    
    if (!trends.has(trendKey)) {
      trends.set(trendKey, {
        keywords: [keyword],
        sources: {},
        overallStrength: 0,
        category: this.categorizeKeyword(keyword),
        suggestedAppTypes: this.suggestAppTypes(keyword),
        marketSignals: {}
      });
    }

    const trend = trends.get(trendKey)!;
    
    // Add signal to appropriate source
    if (!trend.sources[source as keyof typeof trend.sources]) {
      trend.sources[source as keyof typeof trend.sources] = [];
    }
    trend.sources[source as keyof typeof trend.sources]!.push(signal);

    // Update overall strength
    const signalStrength = source === 'reddit' 
      ? this.redditAnalyzer.calculateSignalStrength(signal)
      : this.googleTrendsAnalyzer.calculateTrendStrength(signal);
    
    trend.overallStrength = Math.max(trend.overallStrength, signalStrength);
  }

  private categorizeKeyword(keyword: string): string {
    const categories = {
      'AI/ML': ['ai', 'ml', 'gpt', 'claude', 'chatgpt', 'artificial', 'machine learning'],
      'Productivity': ['productivity', 'workflow', 'automation', 'scheduling', 'todo'],
      'Business': ['saas', 'startup', 'revenue', 'business', 'invoice', 'crm'],
      'Social': ['social', 'community', 'networking', 'messaging', 'collaboration'],
      'Health': ['fitness', 'health', 'wellness', 'medical', 'mental health'],
      'Finance': ['finance', 'budget', 'crypto', 'investment', 'banking', 'money'],
      'Development': ['code', 'api', 'development', 'programming', 'web', 'mobile']
    };

    for (const [category, terms] of Object.entries(categories)) {
      if (terms.some(term => keyword.toLowerCase().includes(term))) {
        return category;
      }
    }

    return 'General';
  }

  private suggestAppTypes(keyword: string): string[] {
    const suggestions: string[] = [];
    const word = keyword.toLowerCase();

    if (word.includes('ai') || word.includes('gpt')) {
      suggestions.push('AI-powered tool', 'Automation service', 'Content generator');
    }
    if (word.includes('productivity') || word.includes('workflow')) {
      suggestions.push('Productivity app', 'Team tool', 'Process optimizer');
    }
    if (word.includes('social') || word.includes('community')) {
      suggestions.push('Social platform', 'Community tool', 'Networking app');
    }
    if (word.includes('finance') || word.includes('budget')) {
      suggestions.push('Financial tracker', 'Budget app', 'Investment tool');
    }
    if (word.includes('health') || word.includes('fitness')) {
      suggestions.push('Health tracker', 'Fitness app', 'Wellness platform');
    }

    return suggestions.length > 0 ? suggestions : ['Utility app', 'SaaS tool', 'Mobile app'];
  }
}