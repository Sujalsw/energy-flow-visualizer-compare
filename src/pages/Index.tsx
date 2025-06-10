
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Zap, Activity, TrendingUp, Grid, AlertCircle } from 'lucide-react';
import LiveHeatmap from '../components/LiveHeatmap';
import { fetchLatestData } from '../services/api';

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

const colors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#f97316', '#84cc16', '#ec4899', '#6366f1',
  '#14b8a6', '#f43f5e', '#22c55e', '#a855f7', '#0ea5e9'
];

// Generate chart data from API response
const generateChartData = (apiData: any[], selectedFeeders: string[], selectedParameters: string[]) => {
  const data = [];
  const now = new Date();
  
  // Create 24 data points representing the last 24 * 40 seconds (16 minutes)
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - i * 40 * 1000);
    const dataPoint: any = {
      timestamp: timestamp.toLocaleTimeString(),
      fullTimestamp: timestamp
    };
    
    selectedFeeders.forEach(feeder => {
      selectedParameters.forEach(param => {
        const key = `${feeder}_${param}`;
        const feederData = apiData.find(item => item.slave_name === feeder);
        
        if (feederData && feederData[param] !== undefined) {
          // Add some variation to simulate time series data
          const baseValue = feederData[param];
          const variation = (Math.random() - 0.5) * 0.1 * baseValue;
          dataPoint[key] = Math.max(0, Number((baseValue + variation).toFixed(2)));
        } else {
          dataPoint[key] = 0;
        }
      });
    });
    
    data.push(dataPoint);
  }
  
  return data;
};

const Index = () => {
  const [selectedFeeders, setSelectedFeeders] = useState<string[]>(['SERVER ROOM UPS 10 KVA']);
  const [selectedParameters, setSelectedParameters] = useState<string[]>(['current_r']);
  const [chartData, setChartData] = useState<any[]>([]);
  const [networkError, setNetworkError] = useState<string>('');

  // Fetch chart data from API
  const fetchChartData = async () => {
    if (selectedFeeders.length > 0 && selectedParameters.length > 0) {
      try {
        setNetworkError('');
        const apiData = await fetchLatestData();
        const newData = generateChartData(apiData, selectedFeeders, selectedParameters);
        setChartData(newData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setNetworkError('Network unavailable. Please check your connection.');
      }
    }
  };

  // Update chart data when selections change
  useEffect(() => {
    fetchChartData();
  }, [selectedFeeders, selectedParameters]);

  // Auto-start live updates for chart data
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (selectedFeeders.length > 0 && selectedParameters.length > 0) {
      // Set up interval for live updates every 10 seconds
      interval = setInterval(() => {
        fetchChartData();
      }, 10000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [selectedFeeders, selectedParameters]);

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
    <div style={{ fontFamily: 'Roboto, sans-serif' }}>
      {/* Professional Navbar */}
      <nav style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        height: '60px',
        backgroundColor: '#1A2526',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        zIndex: 1000,
        borderBottom: '1px solid #e0e0e0'
      }}>
        <img 
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/JSW_Group_logo.svg/240px-JSW_Group_logo.svg.png"
          alt="JSW Logo"
          style={{
            width: '40px',
            height: '40px',
            marginRight: '10px',
            objectFit: 'contain'
          }}
        />
        <span style={{ fontSize: '18px', fontWeight: '500' }}>
          JSW Mangalore Container Terminal Pvt. Ltd.
        </span>
      </nav>

      {/* Main Content with margin for fixed navbar */}
      <div style={{ marginTop: '60px', fontFamily: 'Roboto, sans-serif' }}>
        {/* Live Heatmap Section - immediately after navbar */}
        <div style={{ padding: '10px 20px' }}>
          <div style={{
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <LiveHeatmap />
          </div>
        </div>

        {/* Comparison Section */}
        <div style={{ padding: '20px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Control Panel */}
            <div style={{
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              overflow: 'hidden'
            }}>
              <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Activity className="h-6 w-6 text-cyan-400" />
                    <span>Comparison Control Panel</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-6">
                    {/* Feeder Selection */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-cyan-300">Select Feeders</h3>
                      <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto p-4 bg-gray-900/50 rounded-lg border border-gray-600">
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

                  {/* Control Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-400">Live Updates Active</span>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      {selectedFeeders.length > 0 && selectedParameters.length > 0 && (
                        <span>Total lines: {selectedFeeders.length * selectedParameters.length}</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Chart Display */}
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
