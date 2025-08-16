import googleTrends from 'google-trends-api';

interface TrendSignal {
  keyword: string;
  interest: number[];
  averageInterest: number;
  growth: number;
  relatedQueries: string[];
}

export class GoogleTrendsAnalyzer {
  
  async getTrendingKeywords(keywords: string[]): Promise<TrendSignal[]> {
    const signals: TrendSignal[] = [];
    
    for (const keyword of keywords) {
      try {
        const signal = await this.analyzeSingleKeyword(keyword);
        if (signal) {
          signals.push(signal);
        }
        
        // Rate limiting - Google Trends is strict
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error analyzing keyword "${keyword}":`, error);
      }
    }
    
    return signals.sort((a, b) => b.growth - a.growth);
  }

  private async analyzeSingleKeyword(keyword: string): Promise<TrendSignal | null> {
    try {
      // Get interest over time (last 3 months)
      const interestOverTime = await googleTrends.interestOverTime({
        keyword: keyword,
        startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 3 months ago
        endTime: new Date(),
        geo: 'US'
      });

      const data = JSON.parse(interestOverTime);
      const timelineData = data.default.timelineData;
      
      if (!timelineData || timelineData.length === 0) {
        return null;
      }

      const interests = timelineData.map((point: any) => point.value[0]);
      const averageInterest = interests.reduce((a: number, b: number) => a + b, 0) / interests.length;
      
      // Calculate growth (recent vs earlier periods)
      const recentPeriod = interests.slice(-10); // Last 10 data points
      const earlierPeriod = interests.slice(0, 10); // First 10 data points
      
      const recentAvg = recentPeriod.reduce((a: number, b: number) => a + b, 0) / recentPeriod.length;
      const earlierAvg = earlierPeriod.reduce((a: number, b: number) => a + b, 0) / earlierPeriod.length;
      
      const growth = earlierAvg > 0 ? ((recentAvg - earlierAvg) / earlierAvg) * 100 : 0;

      // Get related queries
      let relatedQueries: string[] = [];
      try {
        const relatedQueriesData = await googleTrends.relatedQueries({
          keyword: keyword,
          startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last month
          endTime: new Date(),
          geo: 'US'
        });
        
        const queriesData = JSON.parse(relatedQueriesData);
        if (queriesData.default.rankedList && queriesData.default.rankedList[0]) {
          relatedQueries = queriesData.default.rankedList[0].rankedKeyword
            .slice(0, 5)
            .map((item: any) => item.query);
        }
      } catch (error) {
        console.log('Could not fetch related queries for:', keyword);
      }

      return {
        keyword,
        interest: interests,
        averageInterest,
        growth,
        relatedQueries
      };

    } catch (error) {
      console.error(`Failed to analyze keyword "${keyword}":`, error);
      return null;
    }
  }

  // Pre-defined keywords to monitor for app ideas
  getAppIdeaKeywords(): string[] {
    return [
      // AI & Tech trends
      'AI automation',
      'ChatGPT plugin',
      'Claude API',
      'voice AI',
      'AI writing tool',
      'AI image generator',
      
      // Productivity & Business
      'no code app',
      'side hustle 2025',
      'SaaS idea',
      'productivity app',
      'remote work tool',
      'team collaboration',
      
      // Specific niches
      'fitness tracker',
      'meal planning app',
      'budget tracker',
      'social media scheduler',
      'invoice generator',
      'password manager',
      
      // Emerging platforms
      'Replit app',
      'Vercel deployment',
      'Supabase project',
      'Next.js template',
      'React component',
      'TypeScript starter'
    ];
  }

  calculateTrendStrength(signal: TrendSignal): number {
    // Combine average interest and growth for overall strength
    const interestScore = Math.min(signal.averageInterest / 100, 1.0); // Normalize to 0-1
    const growthScore = Math.max(0, Math.min(signal.growth / 100, 1.0)); // Normalize positive growth to 0-1
    const relatedQueriesBonus = signal.relatedQueries.length > 3 ? 1.1 : 1.0;
    
    return Math.min(1.0, (interestScore * 0.4 + growthScore * 0.6) * relatedQueriesBonus);
  }
}