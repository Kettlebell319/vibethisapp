import { TrendAggregator } from './trend-aggregator';
import { IdeaGenerator } from './idea-generator';
import { supabaseAdmin } from './supabase';

export class TrendAnalysisPipeline {
  private trendAggregator: TrendAggregator;
  private ideaGenerator: IdeaGenerator;

  constructor() {
    this.trendAggregator = new TrendAggregator();
    this.ideaGenerator = new IdeaGenerator();
  }

  async runDailyAnalysis(): Promise<void> {
    console.log('🚀 Starting daily trend analysis pipeline...');
    
    try {
      // Step 1: Collect trend signals from all sources
      const aggregatedTrends = await this.trendAggregator.collectAllTrendSignals();
      
      if (aggregatedTrends.length === 0) {
        console.log('❌ No trends found, stopping pipeline');
        return;
      }

      console.log(`📊 Found ${aggregatedTrends.length} aggregated trends`);
      
      // Step 2: Generate app ideas from top trends
      const generatedIdeas = await this.ideaGenerator.generateDailyIdeas(aggregatedTrends);
      
      console.log(`💡 Generated ${generatedIdeas.length} new app ideas`);
      
      // Step 3: Select and publish today's idea
      await this.selectAndPublishDailyIdea();
      
      console.log('✅ Daily trend analysis pipeline completed successfully');
      
    } catch (error) {
      console.error('❌ Pipeline failed:', error);
      throw error;
    }
  }

  async runQuickDemo(): Promise<any> {
    console.log('🎮 Running quick demo of trend analysis...');
    
    try {
      // For demo purposes, let's just generate one idea from a mock trend
      const mockTrend = {
        keywords: ['AI productivity', 'automation', 'no-code'],
        sources: {
          reddit: [{ title: 'Best AI productivity tools', score: 150, num_comments: 45 }],
          google_trends: [{ keyword: 'AI productivity', growth: 25, averageInterest: 60 }]
        },
        overallStrength: 0.75,
        category: 'Productivity',
        suggestedAppTypes: ['AI-powered tool', 'Automation service'],
        marketSignals: {
          searchVolume: 1200,
          socialMentions: 89
        }
      };

      console.log('📊 Using mock trend for demo:', mockTrend.keywords.join(', '));
      
      const idea = await this.ideaGenerator.generateIdeaFromTrend(mockTrend);
      
      if (idea) {
        console.log('💡 Generated demo idea:', idea.title);
        return {
          success: true,
          idea: idea,
          message: 'Demo idea generated successfully!'
        };
      } else {
        throw new Error('Failed to generate demo idea');
      }
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Demo failed to generate idea'
      };
    }
  }

  private async selectAndPublishDailyIdea(): Promise<void> {
    // Get unpublished ideas, ordered by trend strength and creation date
    const { data: unpublishedIdeas, error } = await supabaseAdmin
      .from('ideas')
      .select('*')
      .eq('is_published', false)
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      throw new Error(`Failed to fetch unpublished ideas: ${error.message}`);
    }

    if (!unpublishedIdeas || unpublishedIdeas.length === 0) {
      console.log('⚠️ No unpublished ideas available');
      return;
    }

    // Select the best idea based on multiple factors
    const selectedIdea = this.selectBestIdea(unpublishedIdeas);
    
    // Publish it for today
    const { error: updateError } = await supabaseAdmin
      .from('ideas')
      .update({
        is_published: true,
        published_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', selectedIdea.id);

    if (updateError) {
      throw new Error(`Failed to publish idea: ${updateError.message}`);
    }

    console.log(`📅 Published daily idea: "${selectedIdea.title}"`);
  }

  private selectBestIdea(ideas: any[]): any {
    // Score ideas based on multiple factors
    const scoredIdeas = ideas.map(idea => ({
      ...idea,
      score: this.calculateIdeaScore(idea)
    }));

    // Sort by score and return the best one
    scoredIdeas.sort((a, b) => b.score - a.score);
    return scoredIdeas[0];
  }

  private calculateIdeaScore(idea: any): number {
    let score = 0;

    // Trend strength (40% of score)
    const trendStrength = idea.trend_signals?.strength || 0;
    score += trendStrength * 0.4;

    // Build difficulty preference (30% of score) - favor easier builds
    const difficultyScore = (6 - idea.difficulty_score) / 5; // Invert difficulty (easier = higher score)
    score += difficultyScore * 0.3;

    // Revenue potential (20% of score)
    const revenueScore = idea.revenue_potential === 'high' ? 1 : 
                       idea.revenue_potential === 'medium' ? 0.7 : 0.4;
    score += revenueScore * 0.2;

    // Recency bonus (10% of score)
    const hoursAgo = (Date.now() - new Date(idea.created_at).getTime()) / (1000 * 60 * 60);
    const recencyScore = Math.max(0, 1 - (hoursAgo / 72)); // Decay over 3 days
    score += recencyScore * 0.1;

    return score;
  }

  // Method to get today's published idea for the frontend
  async getTodaysIdea(): Promise<any> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabaseAdmin
      .from('ideas')
      .select('*')
      .eq('is_published', true)
      .eq('published_date', today)
      .single();

    if (error) {
      console.log('No idea published for today yet');
      return null;
    }

    return data;
  }
}