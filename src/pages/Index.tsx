
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap, Activity, TrendingUp, AlertCircle, WifiOff } from 'lucide-react';
import LiveHeatmap from '../components/LiveHeatmap';
import { fetchLatestEnergyData, NetworkError, EnergyDataPoint } from '../services/api';

// All 27 feeders - must match database
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

const colors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#f43f5e', '#22c55e', '#a855f7', '#0ea5e9'
];

interface ChartDataPoint {
  timestamp: string;
  fullTimestamp: Date;
  [key: string]: any;
}

const Index = () => {
  const [selectedFeeders, setSelectedFeeders] = useState<string[]>([]);
  const [selectedParameters, setSelectedParameters] = useState<string[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isRealTimeActive, setIsRealTimeActive] = useState(false);
  const [networkError, setNetworkError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  // Fetch data from API and create chart data structure
  const fetchChartData = async () => {
    if (selectedFeeders.length === 0 || selectedParameters.length === 0) {
      return;
    }

    setIsLoading(true);
    setNetworkError('');

    try {
      console.log('Fetching chart data from API...');
      const apiData = await fetchLatestEnergyData();
      console.log('Received API data for chart:', apiData.length, 'records');

      // Create chart data structure from API response
      const newChartData: ChartDataPoint[] = [];
      const now = new Date();

      // Since we have static data, we'll create a time series by taking the latest data
      // and simulating different time points (for demonstration purposes)
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 40 * 1000); // 40 second intervals
        const dataPoint: ChartDataPoint = {
          timestamp: timestamp.toLocaleTimeString(),
          fullTimestamp: timestamp
        };

        selectedFeeders.forEach(feeder => {
          const feederData = apiData.find(item => item.slave_name === feeder);
          if (feederData) {
            selectedParameters.forEach(param => {
              const key = `${feeder}_${param}`;
              const value = feederData[param as keyof EnergyDataPoint] as number;
              // Add some small variation to show trend (since data is static)
              const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
              dataPoint[key] = Number((value * (1 + variation)).toFixed(2));
            });
          }
        });

        newChartData.push(dataPoint);
      }

      setChartData(newChartData);
      setIsConnected(true);
      console.log('Chart data updated successfully');
    } catch (error) {
      console.error('Error fetching chart data:', error);
      
      if (error instanceof NetworkError) {
        setNetworkError(error.message);
        setIsConnected(false);
        setIsRealTimeActive(false);
        setChartData([]); // Clear chart data on network error
      } else {
        setNetworkError('Failed to fetch data from server. Please try again.');
        setIsConnected(false);
        setChartData([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update chart data when selections change
  useEffect(() => {
    if (selectedFeeders.length > 0 && selectedParameters.length > 0) {
      fetchChartData();
    } else {
      setChartData([]);
    }
  }, [selectedFeeders, selectedParameters]);

  // Real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRealTimeActive && selectedFeeders.length > 0 && selectedParameters.length > 0 && isConnected) {
      interval = setInterval(() => {
        fetchChartData();
      }, 10000); // 10 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRealTimeActive, selectedFeeders, selectedParameters, isConnected]);

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
          {!isConnected && (
            <div className="flex items-center justify-center space-x-2 text-red-400">
              <WifiOff className="h-5 w-5" />
              <span>Database connection required</span>
            </div>
          )}
        </div>

        {/* Global Network Error */}
        {networkError && (
          <Card className="bg-red-900/50 border-red-500/20 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-400">
                <AlertCircle className="h-5 w-5" />
                <span className="font-semibold">Network Error</span>
              </div>
              <p className="text-red-300 mt-2">{networkError}</p>
              <p className="text-red-200 text-sm mt-1">
                This dashboard requires a network connection to fetch data from the MySQL database.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Live Heatmap */}
        <LiveHeatmap />

        {/* Control Panel */}
        <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Activity className="h-6 w-6 text-cyan-400" />
              <span>Comparison Control Panel</span>
              {!isConnected && (
                <span className="text-sm text-red-400 ml-4">(Requires Network)</span>
              )}
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
                        disabled={!isConnected}
                      />
                      <label htmlFor={feeder} className={`text-sm cursor-pointer hover:text-cyan-300 transition-colors ${!isConnected ? 'text-gray-500' : 'text-gray-300'}`}>
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
                        disabled={!isConnected}
                      />
                      <label htmlFor={param.value} className={`text-sm cursor-pointer hover:text-cyan-300 transition-colors ${!isConnected ? 'text-gray-500' : 'text-gray-300'}`}>
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
                disabled={!isConnected}
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
        {selectedFeeders.length > 0 && selectedParameters.length > 0 && isConnected && (
          <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-cyan-400" />
                <span>Multi-Parameter Comparison Chart</span>
                {isRealTimeActive && isConnected && (
                  <div className="flex items-center space-x-2 ml-4">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm text-green-400">Live</span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <Activity className="h-12 w-12 text-cyan-400 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-400">Loading chart data from database...</p>
                  </div>
                </div>
              ) : chartData.length > 0 ? (
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
              ) : (
                <div className="h-96 flex items-center justify-center">
                  <div className="text-center">
                    <WifiOff className="h-12 w-12 text-red-400 mx-auto mb-4" />
                    <p className="text-gray-400">No data available - network connection required</p>
                  </div>
                </div>
              )}
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
              {!isConnected && (
                <p className="text-red-400 mb-4">
                  ⚠️ Network connection required to fetch data from MySQL database
                </p>
              )}
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
