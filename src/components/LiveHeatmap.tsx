
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

// Predefined ranges for normalization (you can adjust these based on your actual data ranges)
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

interface HeatmapData {
  feeder: string;
  timePoints: {
    timestamp: string;
    activityScore: number;
    isOff: boolean;
    rawData: any;
  }[];
}

// Generate mock data that simulates the API response
const generateMockApiData = () => {
  const now = new Date();
  const data = [];
  
  for (let timeOffset = 11; timeOffset >= 0; timeOffset--) {
    const timestamp = new Date(now.getTime() - timeOffset * 35 * 1000); // 35 second intervals
    
    slaveFeeders.forEach((feeder, index) => {
      // Simulate some feeders being "off" occasionally
      const isOff = Math.random() < 0.1; // 10% chance of being off
      
      const dataPoint = {
        id: index + 1 + timeOffset * 27,
        timestamp: timestamp.toISOString(),
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
  }
  
  return data;
};

// Normalize a parameter value to 0-1 scale
const normalizeParameter = (value: number, param: string): number => {
  const range = parameterRanges[param as keyof typeof parameterRanges];
  if (!range) return 0;
  
  return Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
};

// Calculate activity score for a feeder at a given time
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

// Process API data into heatmap format
const processHeatmapData = (apiData: any[]): HeatmapData[] => {
  const processed: HeatmapData[] = [];
  
  slaveFeeders.forEach(feeder => {
    const feederData = apiData.filter(item => item.slave_name === feeder);
    
    // Group by timestamp and calculate activity scores
    const timePointsMap = new Map();
    
    feederData.forEach(item => {
      const { score, isOff } = calculateActivityScore(item);
      timePointsMap.set(item.timestamp, {
        timestamp: item.timestamp,
        activityScore: score,
        isOff: isOff,
        rawData: item
      });
    });
    
    // Convert to array and sort by timestamp
    const timePoints = Array.from(timePointsMap.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    processed.push({
      feeder,
      timePoints
    });
  });
  
  return processed;
};

const LiveHeatmap: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData[]>([]);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch and process data
  const fetchData = () => {
    try {
      // In a real implementation, this would be an actual API call
      // const response = await fetch('/api/energy-data');
      // const apiData = await response.json();
      
      const apiData = generateMockApiData();
      const processedData = processHeatmapData(apiData);
      setHeatmapData(processedData);
      setLastUpdate(new Date());
      
      console.log('Heatmap data updated:', processedData.length, 'feeders');
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
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

  // Generate time column headers
  const getTimeHeaders = () => {
    if (heatmapData.length === 0) return [];
    
    const firstFeederTimePoints = heatmapData[0]?.timePoints || [];
    return firstFeederTimePoints.map((_, index) => `T-${11 - index}`);
  };

  const timeHeaders = getTimeHeaders();

  return (
    <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-cyan-400" />
            <span>Live Activity Heatmap - All Feeders</span>
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
        {heatmapData.length > 0 ? (
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

            {/* Heatmap Table */}
            <div className="overflow-x-auto bg-gray-900/30 rounded-lg">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="sticky left-0 bg-gray-800 text-cyan-300 p-3 text-left border border-gray-600 font-semibold min-w-[200px]">
                      Feeder Name
                    </th>
                    {timeHeaders.map((header, index) => (
                      <th 
                        key={index} 
                        className="text-cyan-300 p-3 text-center border border-gray-600 font-semibold min-w-[80px]"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapData.map((feederData, rowIndex) => (
                    <tr key={feederData.feeder} className="hover:bg-gray-700/30 transition-colors">
                      <td className="sticky left-0 bg-gray-800 text-gray-300 p-3 border border-gray-600 font-medium text-sm">
                        {feederData.feeder}
                      </td>
                      {feederData.timePoints.map((timePoint, colIndex) => {
                        const backgroundColor = getActivityColor(timePoint.activityScore, timePoint.isOff);
                        const textColor = timePoint.isOff || timePoint.activityScore > 0.5 ? '#FFFFFF' : '#000000';
                        
                        return (
                          <td
                            key={colIndex}
                            className="border border-gray-600 p-3 text-center relative group cursor-pointer"
                            style={{ backgroundColor }}
                          >
                            <div className="text-xs font-mono" style={{ color: textColor }}>
                              {timePoint.isOff ? 'OFF' : timePoint.activityScore.toFixed(2)}
                            </div>
                            
                            {/* Tooltip */}
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                              <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg border border-gray-600 max-w-xs">
                                <div className="font-semibold">{feederData.feeder}</div>
                                <div>Time: {new Date(timePoint.timestamp).toLocaleTimeString()}</div>
                                <div>Status: {timePoint.isOff ? 'OFF' : 'ACTIVE'}</div>
                                <div>Activity Score: {timePoint.activityScore.toFixed(3)}</div>
                                {!timePoint.isOff && (
                                  <>
                                    <div className="mt-1 text-gray-300">Sample Values:</div>
                                    <div>Current R: {timePoint.rawData.current_r?.toFixed(1)}A</div>
                                    <div>Voltage RY: {timePoint.rawData.voltage_ry?.toFixed(1)}V</div>
                                    <div>Active Energy: {timePoint.rawData.active_energy?.toFixed(1)}kWh</div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Update Info */}
            <div className="text-center text-sm text-gray-400">
              <p>
                Updates every 30-40 seconds • 
                Showing last 12 time points • 
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
              Loading Heatmap Data...
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
