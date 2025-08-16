import { NextRequest, NextResponse } from 'next/server';
import { TrendAnalysisPipeline } from '@/lib/trend-pipeline';

export async function POST(request: NextRequest) {
  try {
    const { demo } = await request.json();
    
    const pipeline = new TrendAnalysisPipeline();
    
    if (demo) {
      // Run a quick demo for testing
      const result = await pipeline.runQuickDemo();
      return NextResponse.json(result);
    } else {
      // Run full daily analysis
      await pipeline.runDailyAnalysis();
      return NextResponse.json({ 
        success: true, 
        message: 'Daily trend analysis completed successfully' 
      });
    }
    
  } catch (error) {
    console.error('Trend analysis API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to analyze trends'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const pipeline = new TrendAnalysisPipeline();
    const todaysIdea = await pipeline.getTodaysIdea();
    
    if (todaysIdea) {
      return NextResponse.json({
        success: true,
        idea: todaysIdea,
        message: 'Retrieved today\'s idea'
      });
    } else {
      return NextResponse.json({
        success: false,
        message: 'No idea published for today yet'
      });
    }
    
  } catch (error) {
    console.error('Get today\'s idea API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to get today\'s idea'
      },
      { status: 500 }
    );
  }
}