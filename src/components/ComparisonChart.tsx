
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Zap, AlertCircle } from 'lucide-react';
import { parameters, colors } from '../constants/feeders';

interface ComparisonChartProps {
  selectedFeeders: string[];
  selectedParameters: string[];
  chartData: any[];
  networkError: string;
}

const ComparisonChart = ({
  selectedFeeders,
  selectedParameters,
  chartData,
  networkError
}: ComparisonChartProps) => {
  const generateChartLines = () => {
    const lines = [];
    let colorIndex = 0;
    
    selectedFeeders.forEach(feeder => {
      selectedParameters.forEach(param => {
        const key = `${feeder}_${param}`;
        const paramInfo = parameters.find(p => p.value === param);
        const lineName = `${feeder} - ${paramInfo?.label || param}`;
        
        lines.push(
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            stroke={colors[colorIndex % colors.length]}
            strokeWidth={2}
            name={lineName}
            connectNulls={false}
            dot={false}
          />
        );
        colorIndex++;
      });
    });
    
    return lines;
  };

  return (
    <div style={{
      border: '1px solid #e0e0e0',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden'
    }}>
      {networkError ? (
        <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm h-full">
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">Network Error</h3>
            <p className="text-red-400">{networkError}</p>
          </CardContent>
        </Card>
      ) : selectedFeeders.length > 0 && selectedParameters.length > 0 ? (
        <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm h-full">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <TrendingUp className="h-6 w-6 text-cyan-400" />
              <span>Multi-Parameter Comparison Chart</span>
              <div className="flex items-center space-x-2 ml-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Live</span>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9ca3af"
                    fontSize={12}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#f3f4f6'
                    }}
                  />
                  <Legend />
                  {generateChartLines()}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm h-full">
          <CardContent className="text-center py-12">
            <Zap className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Energy Analysis Dashboard
            </h3>
            <p className="text-gray-400 mb-4">
              Default selections active - monitoring first feeder and parameter
            </p>
            <div className="text-sm text-gray-500">
              <p>Current monitoring: SERVER ROOM UPS 10 KVA - Current R Phase</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ComparisonChart;
