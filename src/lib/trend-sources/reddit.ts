import snoowrap from 'snoowrap';

interface RedditSignal {
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  created_utc: number;
  url: string;
  subreddit: string;
  keywords: string[];
}

export class RedditTrendAnalyzer {
  private reddit: snoowrap;

  constructor() {
    this.reddit = new snoowrap({
      userAgent: 'VibeThisApp trend analyzer v1.0',
      clientId: process.env.REDDIT_CLIENT_ID!,
      clientSecret: process.env.REDDIT_CLIENT_SECRET!,
      username: process.env.REDDIT_USERNAME!,
      password: process.env.REDDIT_PASSWORD!,
    });
  }

  async getHotPosts(subreddit: string, limit: number = 25): Promise<RedditSignal[]> {
    try {
      const posts = await this.reddit.getSubreddit(subreddit).getHot({ limit });
      
      return posts.map(post => ({
        title: post.title,
        selftext: post.selftext,
        score: post.score,
        num_comments: post.num_comments,
        created_utc: post.created_utc,
        url: post.url,
        subreddit: post.subreddit.display_name,
        keywords: this.extractKeywords(post.title + ' ' + post.selftext)
      }));
    } catch (error) {
      console.error(`Error fetching Reddit posts from r/${subreddit}:`, error);
      return [];
    }
  }

  async scanTrendingSubreddits(): Promise<RedditSignal[]> {
    const subreddits = [
      'SideProject',
      'Entrepreneur', 
      'nocode',
      'webdev',
      'MachineLearning',
      'artificial',
      'ChatGPT',
      'OpenAI',
      'selfhosted',
      'privacy',
      'productivity'
    ];

    const allSignals: RedditSignal[] = [];
    
    for (const sub of subreddits) {
      const signals = await this.getHotPosts(sub, 10);
      allSignals.push(...signals);
      
      // Add delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return allSignals;
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - look for tech terms, tools, common patterns
    const techKeywords = [
      'AI', 'ML', 'API', 'SaaS', 'app', 'tool', 'platform', 'automation',
      'Claude', 'GPT', 'OpenAI', 'Anthropic', 'Replit', 'Vercel', 'Supabase',
      'React', 'Next.js', 'TypeScript', 'Python', 'JavaScript', 'Node.js',
      'database', 'webhook', 'integration', 'workflow', 'dashboard', 'analytics',
      'mobile', 'iOS', 'Android', 'web', 'browser', 'extension', 'plugin',
      'startup', 'business', 'revenue', 'monetize', 'subscription', 'freemium'
    ];

    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    const keywords = words.filter(word => 
      techKeywords.some(keyword => 
        keyword.toLowerCase().includes(word) || word.includes(keyword.toLowerCase())
      )
    );

    return [...new Set(keywords)]; // Remove duplicates
  }

  calculateSignalStrength(signal: RedditSignal): number {
    // Calculate signal strength based on engagement and recency
    const hoursAgo = (Date.now() / 1000 - signal.created_utc) / 3600;
    const ageMultiplier = Math.max(0.1, 1 - (hoursAgo / 168)); // Decay over a week
    
    const engagementScore = (signal.score + signal.num_comments * 2) / 100;
    const keywordBonus = signal.keywords.length > 3 ? 1.2 : 1.0;
    
    return Math.min(1.0, (engagementScore * ageMultiplier * keywordBonus) / 10);
  }
}