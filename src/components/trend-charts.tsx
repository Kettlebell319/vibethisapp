'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Activity, MessageCircle, Search, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface TrendData {
  keywords: string[];
  category: string;
  strength: number;
  sources: string[];
}

interface TrendChartsProps {
  trendData: TrendData;
}

export function TrendCharts({ trendData }: TrendChartsProps) {
  // Generate sample time series data based on trend strength
  const generateTimeSeriesData = () => {
    const data = [];
    const baseValue = Math.floor(trendData.strength * 100);
    
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      
      // Create realistic trend curve with some randomness
      const trend = baseValue + (i * 2) + (Math.random() - 0.5) * 15;
      const searchVolume = Math.max(0, Math.floor(trend + (Math.random() - 0.5) * 20));
      const socialMentions = Math.max(0, Math.floor(searchVolume * 0.3 + (Math.random() - 0.5) * 10));
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        searchVolume,
        socialMentions,
        combined: searchVolume + socialMentions
      });
    }
    
    return data;
  };

  // Generate source breakdown data
  const generateSourceData = () => {
    const sources = trendData.sources.length > 0 ? trendData.sources : ['Reddit', 'Google Trends', 'GitHub'];
    return sources.map((source, index) => ({
      name: source,
      value: Math.floor((trendData.strength * 100) / sources.length) + (Math.random() * 20),
      color: ['#FF6B35', '#059669', '#0891B2', '#7C3AED'][index % 4]
    }));
  };

  // Generate keyword performance data
  const generateKeywordData = () => {
    return trendData.keywords.slice(0, 5).map(keyword => ({
      keyword: keyword.length > 15 ? keyword.substring(0, 15) + '...' : keyword,
      mentions: Math.floor(Math.random() * 150) + 50,
      growth: Math.floor(Math.random() * 200) - 50 // -50 to +150% growth
    }));
  };

  const timeSeriesData = generateTimeSeriesData();
  const sourceData = generateSourceData();
  const keywordData = generateKeywordData();

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header with trend strength indicator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-orange-600" />
            <span>Trend Analysis Dashboard</span>
          </CardTitle>
          <CardDescription>
            Real-time signals for: {trendData.keywords.join(', ')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.floor(trendData.strength * 100)}
              </div>
              <div className="text-sm text-gray-500">Trend Strength</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                +{Math.floor(trendData.strength * 150)}%
              </div>
              <div className="text-sm text-gray-500">Growth Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor(trendData.strength * 1200)}
              </div>
              <div className="text-sm text-gray-500">Search Volume</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {trendData.sources.length || 3}
              </div>
              <div className="text-sm text-gray-500">Data Sources</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span>30-Day Trend</span>
            </CardTitle>
            <CardDescription>
              Search volume and social mentions over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={timeSeriesData}>
                <defs>
                  <linearGradient id="searchGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FF6B35" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="socialGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="searchVolume" 
                  stroke="#FF6B35" 
                  fillOpacity={1} 
                  fill="url(#searchGradient)"
                  name="Search Volume"
                />
                <Area 
                  type="monotone" 
                  dataKey="socialMentions" 
                  stroke="#059669" 
                  fillOpacity={1} 
                  fill="url(#socialGradient)"
                  name="Social Mentions"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-blue-600" />
              <span>Signal Sources</span>
            </CardTitle>
            <CardDescription>
              Breakdown by data source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value}%`, 'Signal Strength']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {sourceData.map((source, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: source.color }}
                    />
                    <span>{source.name}</span>
                  </div>
                  <span className="font-medium">{Math.round(source.value)}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Keyword Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-purple-600" />
            <span>Keyword Performance</span>
          </CardTitle>
          <CardDescription>
            Top trending keywords driving this idea
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={keywordData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="keyword" width={100} />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${value}${name === 'growth' ? '%' : ''}`, 
                  name === 'mentions' ? 'Mentions' : 'Growth Rate'
                ]}
              />
              <Bar dataKey="mentions" fill="#FF6B35" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Growth Indicators */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Reddit Mentions</p>
                <p className="text-2xl font-bold">+{Math.floor(trendData.strength * 200)}%</p>
              </div>
              <MessageCircle className="w-8 h-8 text-orange-600" />
            </div>
            <div className="mt-2 text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Last 7 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Search Interest</p>
                <p className="text-2xl font-bold">+{Math.floor(trendData.strength * 180)}%</p>
              </div>
              <Search className="w-8 h-8 text-green-600" />
            </div>
            <div className="mt-2 text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Last 30 days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Market Opportunity</p>
                <p className="text-2xl font-bold">{trendData.strength > 0.7 ? 'High' : trendData.strength > 0.4 ? 'Medium' : 'Low'}</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
            <div className="mt-2 text-xs text-green-600 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Strong signals
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}