import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap, Activity, TrendingUp, Grid } from 'lucide-react';
import HeatmapDashboard from '../components/HeatmapDashboard';
import LiveHeatmap from '../components/LiveHeatmap';

// Mock data structure matching your database schema
const slaveFeeders = [
  'INCOMING FEEDER 33 KV',
  'SERVER ROOM UPS 10 KVA',
  'GATE COMPLEX WEIGH BRIDGE',
  'MLDB',
  'ACDB',
  'MAIN DISTRIBUTION BOARD',
  'LIGHTING PANEL 1',
  'LIGHTING PANEL 2',
  'AC PANEL BLOCK A',
  'AC PANEL BLOCK B',
  'POWER DISTRIBUTION UNIT',
  'EMERGENCY BACKUP SYSTEM',
  'TRANSFORMER 1',
  'TRANSFORMER 2',
  'MOTOR CONTROL CENTER',
  'PUMP STATION 1',
  'PUMP STATION 2',
  'CONVEYOR SYSTEM',
  'CRANE POWER SUPPLY',
  'WORKSHOP EQUIPMENT',
  'LABORATORY POWER',
  'SECURITY SYSTEM POWER',
  'COMMUNICATION TOWER',
  'WATER TREATMENT PLANT',
  'WASTE MANAGEMENT UNIT',
  'BACKUP GENERATOR 1',
  'BACKUP GENERATOR 2'
];

const parameters = [
  { value: 'current_r', label: 'Current R Phase (A)', unit: 'A' },
  { value: 'current_y', label: 'Current Y Phase (A)', unit: 'A' },
  { value: 'current_b', label: 'Current B Phase (A)', unit: 'A' },
  { value: 'voltage_ry', label: 'Voltage R-Y (V)', unit: 'V' },
  { value: 'voltage_yb', label: 'Voltage Y-B (V)', unit: 'V' },
  { value: 'voltage_br', label: 'Voltage B-R (V)', unit: 'V' },
  { value: 'power_factor_r', label: 'Power Factor R', unit: '' },
  { value: 'power_factor_y', label: 'Power Factor Y', unit: '' },
  { value: 'power_factor_b', label: 'Power Factor B', unit: '' },
  { value: 'active_energy', label: 'Active Energy (kWh)', unit: 'kWh' }
];

// Generate mock time-series data
const generateMockData = (feeders: string[], params: string[]) => {
  const now = new Date();
  const data = [];
  
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 40 * 1000); // 40 second intervals
    const dataPoint: any = {
      timestamp: timestamp.toLocaleTimeString(),
      fullTimestamp: timestamp
    };
    
    feeders.forEach(feeder => {
      params.forEach(param => {
        const key = `${feeder}_${param}`;
        // Generate realistic mock data based on parameter type
        let value;
        if (param.includes('current')) {
          value = Math.random() * 50 + 10; // 10-60A
        } else if (param.includes('voltage')) {
          value = Math.random() * 50 + 220; // 220-270V
        } else if (param.includes('power_factor')) {
          value = Math.random() * 0.3 + 0.7; // 0.7-1.0
        } else if (param === 'active_energy') {
          value = Math.random() * 1000 + 500; // 500-1500 kWh
        } else {
          value = Math.random() * 100;
        }
        dataPoint[key] = Number(value.toFixed(2));
      });
    });
    
    data.push(dataPoint);
  }
  
  return data;
};

const colors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#f43f5e', '#22c55e', '#a855f7', '#0ea5e9'
];

const Index = () => {
  const [selectedFeeders, setSelectedFeeders] = useState<string[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);

  // Update chart data when selections change
  useEffect(() => {
    if (selectedFeeders.length > 0 && selectedParameters.length > 0) {
      const newData = generateMockData(selectedFeeders, selectedParameters);
      setChartData(newData);
    }
  }, [selectedFeeders, selectedParameters]);

  // Simulate real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRealTimeActive && selectedFeeders.length > 0 && selectedParameters.length > 0) {
      interval = setInterval(() => {
        setChartData(prev => {
          const newData = [...prev];
          // Remove oldest data point and add new one
          newData.shift();
          
          const now = new Date();
          const newDataPoint: any = {
            timestamp: now.toLocaleTimeString(),
            fullTimestamp: now
          };
          
          selectedFeeders.forEach(feeder => {
            selectedParameters.forEach(param => {
              const key = `${feeder}_${param}`;
              let value;
              if (param.includes('current')) {
                value = Math.random() * 50 + 10;
              } else if (param.includes('voltage')) {
                value = Math.random() * 50 + 220;
              } else if (param.includes('power_factor')) {
                value = Math.random() * 0.3 + 0.7;
              } else if (param === 'active_energy') {
                value = Math.random() * 1000 + 500;
              } else {
                value = Math.random() * 100;
              }
              newDataPoint[key] = Number(value.toFixed(2));
            });
          });
          
          newData.push(newDataPoint);
          return newData;
        });
      }, 40000); // 40 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRealTimeActive, selectedFeeders, selectedParameters]);

  const handleFeederToggle = (feeder: string) => {
    setSelectedFeeders(prev => 
      prev.includes(feeder) 
        ? prev.filter(f => f !== feeder)
        : [...prev, feeder]
    );
  };

  const handleParameterToggle = (parameter: string) => {
    setSelectedParameters(prev => 
      prev.includes(parameter) 
        ? prev.filter(p => p !== parameter)
        : [...prev, parameter]
    );
  };

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

  // Get the latest values for heatmap
  const getLatestValues = () => {
    if (chartData.length === 0) return {};
    const latestData = chartData[chartData.length - 1];
    return latestData;
  };

  // Get color intensity based on value range for each parameter
  const getHeatmapColor = (value: number, param: string) => {
    let normalizedValue = 0;
    
    if (param.includes('current')) {
      normalizedValue = Math.min(value / 60, 1); // Max expected 60A
    } else if (param.includes('voltage')) {
      normalizedValue = Math.min((value - 200) / 80, 1); // Range 200-280V
    } else if (param.includes('power_factor')) {
      normalizedValue = Math.min((value - 0.7) / 0.3, 1); // Range 0.7-1.0
    } else if (param === 'active_energy') {
      normalizedValue = Math.min(value / 1500, 1); // Max expected 1500 kWh
    }
    
    const intensity = Math.max(0, Math.min(1, normalizedValue));
    const red = Math.floor(255 * (1 - intensity));
    const green = Math.floor(255 * intensity);
    
    return `rgb(${red}, ${green}, 100)`;
  };

  const latestValues = getLatestValues();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="flex items-center justify-center space-x-3">
            <Zap className="h-12 w-12 text-cyan-400" />
            <h1 className="text-5xl font-bold text-white bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Energy Monitor Pro
            </h1>
          </div>
          <p className="text-xl text-cyan-200">
            Real-time Multi-Feeder Electrical Parameter Comparison Dashboard
          </p>
        </div>

        {/* Live Heatmap - Power BI Style Table */}
        <LiveHeatmap />

        {/* Independent Heatmap Dashboard */}
        <HeatmapDashboard />

        {/* Control Panel */}
        <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Activity className="h-6 w-6 text-cyan-400" />
              <span>Comparison Control Panel</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Feeder Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300">Select Feeders</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                  {slaveFeeders.map(feeder => (
                    <div key={feeder} className="flex items-center space-x-2">
                      <Checkbox
                        id={feeder}
                        checked={selectedFeeders.includes(feeder)}
                        onCheckedChange={() => handleFeederToggle(feeder)}
                        className="border-cyan-500 text-cyan-400"
                      />
                      <label htmlFor={feeder} className="text-sm text-gray-300 cursor-pointer hover:text-cyan-300 transition-colors">
                        {feeder}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-cyan-400">
                  Selected: {selectedFeeders.length} feeders
                </div>
              </div>

              {/* Parameter Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-cyan-300">Select Parameters</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto p-4 bg-gray-900/50 rounded-lg border border-gray-600">
                  {parameters.map(param => (
                    <div key={param.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={param.value}
                        checked={selectedParameters.includes(param.value)}
                        onCheckedChange={() => handleParameterToggle(param.value)}
                        className="border-cyan-500 text-cyan-400"
                      />
                      <label htmlFor={param.value} className="text-sm text-gray-300 cursor-pointer hover:text-cyan-300 transition-colors">
                        {param.label}
                      </label>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-cyan-400">
                  Selected: {selectedParameters.length} parameters
                </div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <Button
                onClick={() => setIsRealTimeActive(!isRealTimeActive)}
                variant={isRealTimeActive ? "destructive" : "default"}
                className={`${isRealTimeActive 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isRealTimeActive ? 'Stop Real-time' : 'Start Real-time'}
              </Button>
              
              <div className="text-sm text-gray-400">
                {selectedFeeders.length > 0 && selectedParameters.length > 0 && (
                  <span>Total lines: {selectedFeeders.length * selectedParameters.length}</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chart Display */}
        {selectedFeeders.length > 0 && selectedParameters.length > 0 && (
          <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-cyan-400" />
                <span>Multi-Parameter Comparison Chart</span>
                {isRealTimeActive && (
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400">Live</span>
                  </div>
                )}
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
        )}

        {/* Real-time Heatmap - Only show selected feeders and parameters */}
        {selectedFeeders.length > 0 && selectedParameters.length > 0 && chartData.length > 0 && (
          <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Grid className="h-6 w-6 text-cyan-400" />
                <span>Real-time Values Heatmap</span>
                {isRealTimeActive && (
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400">Live</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left text-cyan-300 p-3 font-semibold">Feeder / Parameter</th>
                      {selectedParameters.map(param => {
                        const paramInfo = parameters.find(p => p.value === param);
                        return (
                          <th key={param} className="text-center text-cyan-300 p-3 font-semibold min-w-[120px]">
                            {paramInfo?.label || param}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFeeders.map(feeder => (
                      <tr key={feeder} className="border-t border-gray-600">
                        <td className="text-gray-300 p-3 font-medium text-sm">
                          {feeder}
                        </td>
                        {selectedParameters.map(param => {
                          const key = `${feeder}_${param}`;
                          const value = latestValues[key];
                          const paramInfo = parameters.find(p => p.value === param);
                          
                          return (
                            <td
                              key={key}
                              className="text-center p-3 text-white font-mono text-sm rounded-lg"
                              style={{
                                backgroundColor: value ? getHeatmapColor(value, param) : '#374151',
                                margin: '2px'
                              }}
                            >
                              {value ? `${value.toFixed(2)} ${paramInfo?.unit || ''}` : 'N/A'}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-xs text-gray-400 text-center">
                <p>Color intensity indicates relative value within expected range for each parameter</p>
                <p>Green = Higher values, Red = Lower values</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status/Instructions */}
        {(selectedFeeders.length === 0 || selectedParameters.length === 0) && (
          <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm">
            <CardContent className="text-center py-12">
              <Zap className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Get Started with Your Energy Analysis
              </h3>
              <p className="text-gray-400 mb-4">
                Select at least one feeder and one parameter to begin visualizing your energy data
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-sm text-gray-500">
                <div className="p-4 bg-gray-900/30 rounded-lg">
                  <strong className="text-cyan-400">Step 1:</strong> Choose feeders from the list (e.g., SERVER ROOM UPS, MLDB)
                </div>
                <div className="p-4 bg-gray-900/30 rounded-lg">
                  <strong className="text-cyan-400">Step 2:</strong> Select electrical parameters to monitor (e.g., Current R, Voltage RY)
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Index;
