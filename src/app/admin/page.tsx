'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendCharts } from '@/components/trend-charts';

export default function AdminPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTrendAnalysis = async (demo: boolean = true) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze-trends', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ demo }),
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getTodaysIdea = async () => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/analyze-trends');
      const data = await response.json();
      
      if (data.success) {
        setResult(data);
      } else {
        setError(data.message || 'Failed to get today\'s idea');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          VibeThisApp Admin Dashboard
        </h1>

        <div className="grid gap-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Trend Analysis Controls</CardTitle>
              <CardDescription>
                Test the AI-powered trend analysis and idea generation system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button 
                  onClick={() => runTrendAnalysis(true)}
                  disabled={isAnalyzing}
                  className="flex-1"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Run Demo Analysis'}
                </Button>
                <Button 
                  onClick={() => runTrendAnalysis(false)}
                  disabled={isAnalyzing}
                  variant="outline"
                  className="flex-1"
                >
                  {isAnalyzing ? 'Running...' : 'Full Analysis (Slow)'}
                </Button>
                <Button 
                  onClick={getTodaysIdea}
                  disabled={isAnalyzing}
                  variant="secondary"
                  className="flex-1"
                >
                  Get Today&apos;s Idea
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <CardTitle className="text-red-700">Error</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Results Display */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Analysis Result</CardTitle>
                <CardDescription>{result.message}</CardDescription>
              </CardHeader>
              <CardContent>
                {result.idea && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        💡 {result.idea.title}
                      </h3>
                      <p className="text-gray-600 mb-4">{result.idea.description}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">🚀 What It Is</h4>
                        <p className="text-gray-600 text-sm mb-4">{result.idea.content.whatItIs}</p>

                        <h4 className="font-semibold text-gray-900 mb-2">🧠 Why It Matters</h4>
                        <p className="text-gray-600 text-sm mb-4">{result.idea.content.whyItMatters}</p>

                        <h4 className="font-semibold text-gray-900 mb-2">🧰 Tools You&apos;d Use</h4>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {result.idea.content.toolsYoudUse.map((tool: string, idx: number) => (
                            <span key={idx} className="bg-gray-100 px-2 py-1 rounded text-sm">
                              {tool}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">📦 MVP Feature Set</h4>
                        <ul className="text-gray-600 text-sm mb-4 list-disc list-inside">
                          {result.idea.content.mvpFeatureSet.map((feature: string, idx: number) => (
                            <li key={idx}>{feature}</li>
                          ))}
                        </ul>

                        <h4 className="font-semibold text-gray-900 mb-2">💸 Monetization Ideas</h4>
                        <ul className="text-gray-600 text-sm mb-4 list-disc list-inside">
                          {result.idea.content.monetizationIdeas.map((idea: string, idx: number) => (
                            <li key={idx}>{idea}</li>
                          ))}
                        </ul>

                        <div className="flex justify-between text-sm text-gray-500">
                          <span>🧱 Build Difficulty: {result.idea.difficulty_score}/5</span>
                          <span>💰 Revenue: {result.idea.revenue_potential}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-semibold text-gray-900 mb-2">🧵 Tweetable Summary</h4>
                      <p className="text-gray-600 italic">&quot;{result.idea.content.tweetableSummary}&quot;</p>
                    </div>

                    {result.idea.trend_signals && (
                      <div className="pt-6 border-t">
                        <h4 className="font-semibold text-gray-900 mb-4">📊 Trend Analysis</h4>
                        <TrendCharts trendData={result.idea.trend_signals} />
                      </div>
                    )}
                  </div>
                )}

                {!result.idea && (
                  <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}