
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Play, Pause } from 'lucide-react';

// All 27 feeders
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

// Parameters to normalize
const parameters = [
  'current_r', 'current_y', 'current_b',
  'voltage_ry', 'voltage_yb', 'voltage_br',
  'power_factor_r', 'power_factor_y', 'power_factor_b',
  'active_energy'
];

// Predefined ranges for normalization
const parameterRanges = {
  current_r: { min: 0, max: 100 },
  current_y: { min: 0, max: 100 },
  current_b: { min: 0, max: 100 },
  voltage_ry: { min: 200, max: 280 },
  voltage_yb: { min: 200, max: 280 },
  voltage_br: { min: 200, max: 280 },
  power_factor_r: { min: 0.5, max: 1.0 },
  power_factor_y: { min: 0.5, max: 1.0 },
  power_factor_b: { min: 0.5, max: 1.0 },
  active_energy: { min: 0, max: 2000 }
};

interface FeederData {
  feeder: string;
  activityScore: number;
  isOff: boolean;
  rawData: any;
  timestamp: string;
}

// Generate mock data that simulates the latest API response
const generateMockApiData = () => {
  const now = new Date();
  const data = [];
  
  slaveFeeders.forEach((feeder, index) => {
    // Simulate some feeders being "off" occasionally
    const isOff = Math.random() < 0.15; // 15% chance of being off
    
    const dataPoint = {
      id: index + 1,
      timestamp: now.toISOString(),
      location: "MRSS",
      slave_id: index + 1,
      slave_name: feeder,
      current_r: isOff ? 0 : Math.random() * 80 + 10,
      current_y: isOff ? 0 : Math.random() * 80 + 10,
      current_b: isOff ? 0 : Math.random() * 80 + 10,
      voltage_ry: isOff ? 0 : Math.random() * 60 + 220,
      voltage_yb: isOff ? 0 : Math.random() * 60 + 220,
      voltage_br: isOff ? 0 : Math.random() * 60 + 220,
      power_factor_r: isOff ? 0 : Math.random() * 0.4 + 0.6,
      power_factor_y: isOff ? 0 : Math.random() * 0.4 + 0.6,
      power_factor_b: isOff ? 0 : Math.random() * 0.4 + 0.6,
      active_energy: isOff ? 0 : Math.random() * 1500 + 500
    };
    
    data.push(dataPoint);
  });
  
  return data;
};

// Normalize a parameter value to 0-1 scale
const normalizeParameter = (value: number, param: string): number => {
  const range = parameterRanges[param as keyof typeof parameterRanges];
  if (!range) return 0;
  
  return Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
};

// Calculate activity score for a feeder
const calculateActivityScore = (data: any): { score: number; isOff: boolean } => {
  // Check if all parameters are zero (machine is off)
  const allParametersZero = parameters.every(param => data[param] === 0);
  
  if (allParametersZero) {
    return { score: 0, isOff: true };
  }
  
  // Normalize each parameter and calculate average
  const normalizedValues = parameters.map(param => normalizeParameter(data[param], param));
  const averageScore = normalizedValues.reduce((sum, val) => sum + val, 0) / normalizedValues.length;
  
  return { score: averageScore, isOff: false };
};

// Get color based on activity score and off status
const getActivityColor = (activityScore: number, isOff: boolean): string => {
  if (isOff) {
    return '#0000FF'; // Blue for off machines
  }
  
  // Color gradient based on activity score
  if (activityScore <= 0.25) {
    // Green to Yellow (0-0.25)
    const ratio = activityScore / 0.25;
    const red = Math.floor(255 * ratio);
    return `rgb(${red}, 255, 0)`;
  } else if (activityScore <= 0.5) {
    // Yellow to Orange (0.25-0.5)
    const ratio = (activityScore - 0.25) / 0.25;
    const green = Math.floor(255 * (1 - ratio * 0.35));
    return `rgb(255, ${green}, 0)`;
  } else if (activityScore <= 0.75) {
    // Orange to Red (0.5-0.75)
    const ratio = (activityScore - 0.5) / 0.25;
    const green = Math.floor(165 * (1 - ratio));
    return `rgb(255, ${green}, 0)`;
  } else {
    // Red (0.75-1.0)
    return '#FF0000';
  }
};

// Process API data into grid format
const processGridData = (apiData: any[]): FeederData[] => {
  return slaveFeeders.map(feeder => {
    const feederData = apiData.find(item => item.slave_name === feeder);
    
    if (!feederData) {
      return {
        feeder,
        activityScore: 0,
        isOff: true,
        rawData: null,
        timestamp: new Date().toISOString()
      };
    }
    
    const { score, isOff } = calculateActivityScore(feederData);
    
    return {
      feeder,
      activityScore: score,
      isOff: isOff,
      rawData: feederData,
      timestamp: feederData.timestamp
    };
  });
};

// Arrange feeders in 3x9 grid
const arrangeInGrid = (feeders: FeederData[]): FeederData[][] => {
  const grid: FeederData[][] = [];
  
  for (let row = 0; row < 3; row++) {
    const rowData: FeederData[] = [];
    for (let col = 0; col < 9; col++) {
      const index = row * 9 + col;
      if (index < feeders.length) {
        rowData.push(feeders[index]);
      }
    }
    grid.push(rowData);
  }
  
  return grid;
};

const LiveHeatmap: React.FC = () => {
  const [gridData, setGridData] = useState<FeederData[][]>([]);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch and process data
  const fetchData = () => {
    try {
      // In a real implementation, this would be an actual API call
      // const response = await fetch('/api/energy-data');
      // const apiData = await response.json();
      
      const apiData = generateMockApiData();
      const processedData = processGridData(apiData);
      const gridArranged = arrangeInGrid(processedData);
      setGridData(gridArranged);
      setLastUpdate(new Date());
      
      console.log('Grid heatmap data updated:', processedData.length, 'feeders');
    } catch (error) {
      console.error('Error fetching grid heatmap data:', error);
    }
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);

  // Auto-update mechanism
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLiveActive) {
      interval = setInterval(() => {
        fetchData();
      }, 35000); // 35 seconds (30-40 second range)
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLiveActive]);

  return (
    <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-cyan-400" />
            <span>Live Activity Heatmap - 3x9 Grid</span>
            {isLiveActive && (
              <div className="flex items-center space-x-2 ml-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Live</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdate && (
              <span className="text-sm text-gray-400">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <Button
              onClick={() => setIsLiveActive(!isLiveActive)}
              variant={isLiveActive ? "destructive" : "default"}
              className={`${isLiveActive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isLiveActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop Live
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Live
                </>
              )}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {gridData.length > 0 ? (
          <div className="space-y-4">
            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 p-4 bg-gray-900/50 rounded-lg">
              <span className="text-sm text-gray-300 font-semibold">Activity Score Legend:</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#0000FF' }}></div>
                <span className="text-xs text-gray-400">Off</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#00FF00' }}></div>
                <span className="text-xs text-gray-400">Low</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFFF00' }}></div>
                <span className="text-xs text-gray-400">Medium</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFA500' }}></div>
                <span className="text-xs text-gray-400">High</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FF0000' }}></div>
                <span className="text-xs text-gray-400">Critical</span>
              </div>
            </div>

            {/* 3x9 Grid Heatmap */}
            <div className="space-y-3">
              {gridData.map((row, rowIndex) => (
                <div key={rowIndex} className="flex space-x-3 justify-center">
                  {row.map((feederData, colIndex) => {
                    const backgroundColor = getActivityColor(feederData.activityScore, feederData.isOff);
                    const textColor = feederData.isOff || feederData.activityScore > 0.5 ? '#FFFFFF' : '#000000';
                    
                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        className="relative group cursor-pointer border border-gray-600 rounded-lg p-4 min-w-[160px] min-h-[120px] flex flex-col justify-center items-center text-center transition-all hover:scale-105 hover:shadow-lg"
                        style={{ backgroundColor }}
                      >
                        <div 
                          className="text-sm font-semibold leading-tight mb-2"
                          style={{ color: textColor }}
                        >
                          {feederData.feeder}
                        </div>
                        <div 
                          className="text-xs font-mono"
                          style={{ color: textColor }}
                        >
                          {feederData.isOff ? 'OFF' : `Score: ${feederData.activityScore.toFixed(2)}`}
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                          <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg border border-gray-600 max-w-xs">
                            <div className="font-semibold">{feederData.feeder}</div>
                            <div>Status: {feederData.isOff ? 'OFF' : 'ACTIVE'}</div>
                            <div>Activity Score: {feederData.activityScore.toFixed(3)}</div>
                            <div>Last Update: {new Date(feederData.timestamp).toLocaleTimeString()}</div>
                            {!feederData.isOff && feederData.rawData && (
                              <>
                                <div className="mt-1 text-gray-300">Sample Values:</div>
                                <div>Current R: {feederData.rawData.current_r?.toFixed(1)}A</div>
                                <div>Voltage RY: {feederData.rawData.voltage_ry?.toFixed(1)}V</div>
                                <div>Active Energy: {feederData.rawData.active_energy?.toFixed(1)}kWh</div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Update Info */}
            <div className="text-center text-sm text-gray-400">
              <p>
                Updates every 30-40 seconds • 
                Showing latest data for all 27 feeders in 3x9 grid • 
                Activity score based on normalized average of all parameters
              </p>
              <p className="mt-1">
                Blue = Machine Off | Green→Yellow→Orange→Red = Increasing Activity Level
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Activity className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Loading Grid Data...
            </h3>
            <p className="text-gray-400">
              Fetching real-time activity data for all 27 feeders
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveHeatmap;
