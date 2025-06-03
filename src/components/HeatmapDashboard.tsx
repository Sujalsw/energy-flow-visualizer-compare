
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Thermometer, Zap, Activity, Battery } from 'lucide-react';

// Same feeder list as in your main dashboard
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
  { value: 'current_r', label: 'Current R', unit: 'A', icon: Zap },
  { value: 'current_y', label: 'Current Y', unit: 'A', icon: Zap },
  { value: 'current_b', label: 'Current B', unit: 'A', icon: Zap },
  { value: 'voltage_ry', label: 'Voltage R-Y', unit: 'V', icon: Activity },
  { value: 'voltage_yb', label: 'Voltage Y-B', unit: 'V', icon: Activity },
  { value: 'voltage_br', label: 'Voltage B-R', unit: 'V', icon: Activity },
  { value: 'power_factor_r', label: 'PF R', unit: '', icon: Battery },
  { value: 'power_factor_y', label: 'PF Y', unit: '', icon: Battery },
  { value: 'power_factor_b', label: 'PF B', unit: '', icon: Battery },
  { value: 'active_energy', label: 'Active Energy', unit: 'kWh', icon: Thermometer }
];

// Generate mock data for the selected parameter
const generateHeatmapData = (parameter: string) => {
  const data: { [key: string]: number } = {};
  
  slaveFeeders.forEach(feeder => {
    let value;
    if (parameter.includes('current')) {
      value = Math.random() * 50 + 10; // 10-60A
    } else if (parameter.includes('voltage')) {
      value = Math.random() * 50 + 220; // 220-270V
    } else if (parameter.includes('power_factor')) {
      value = Math.random() * 0.3 + 0.7; // 0.7-1.0
    } else if (parameter === 'active_energy') {
      value = Math.random() * 1000 + 500; // 500-1500 kWh
    } else {
      value = Math.random() * 100;
    }
    data[feeder] = Number(value.toFixed(2));
  });
  
  return data;
};

// Get color based on value and parameter type
const getHeatmapColor = (value: number, parameter: string, minValue: number, maxValue: number) => {
  const normalizedValue = (value - minValue) / (maxValue - minValue);
  const intensity = Math.max(0, Math.min(1, normalizedValue));
  
  // Color gradient: green (low) -> yellow (medium) -> red (high)
  let r, g, b;
  if (intensity < 0.5) {
    // Green to Yellow
    r = Math.floor(255 * (intensity * 2));
    g = 255;
    b = 0;
  } else {
    // Yellow to Red
    r = 255;
    g = Math.floor(255 * (2 - intensity * 2));
    b = 0;
  }
  
  return `rgb(${r}, ${g}, ${b})`;
};

const HeatmapDashboard = () => {
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);
  const [heatmapData, setHeatmapData] = useState<{ [key: string]: number }>({});
  const [isLiveActive, setIsLiveActive] = useState(false);

  // Update data when parameter changes
  useEffect(() => {
    if (selectedParameter) {
      const newData = generateHeatmapData(selectedParameter);
      setHeatmapData(newData);
    }
  }, [selectedParameter]);

  // Live updates every 30-40 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLiveActive && selectedParameter) {
      interval = setInterval(() => {
        const newData = generateHeatmapData(selectedParameter);
        setHeatmapData(newData);
      }, 35000); // 35 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLiveActive, selectedParameter]);

  const handleParameterSelect = (parameter: string) => {
    setSelectedParameter(parameter);
  };

  // Calculate min/max values for color scaling
  const values = Object.values(heatmapData);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);

  // Arrange feeders in 3x9 grid
  const gridRows = [];
  for (let i = 0; i < slaveFeeders.length; i += 9) {
    gridRows.push(slaveFeeders.slice(i, i + 9));
  }

  const selectedParam = parameters.find(p => p.value === selectedParameter);

  return (
    <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Thermometer className="h-6 w-6 text-cyan-400" />
          <span>Independent Heatmap Dashboard</span>
          {isLiveActive && selectedParameter && (
            <div className="flex items-center space-x-2 ml-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Live</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Parameter Selection Buttons */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-cyan-300">Select Parameter to Visualize</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {parameters.map(param => {
              const IconComponent = param.icon;
              return (
                <Button
                  key={param.value}
                  onClick={() => handleParameterSelect(param.value)}
                  variant={selectedParameter === param.value ? "default" : "outline"}
                  className={`${
                    selectedParameter === param.value 
                      ? 'bg-cyan-600 hover:bg-cyan-700 text-white' 
                      : 'bg-gray-700 hover:bg-gray-600 text-gray-300 border-gray-600'
                  } h-auto py-3 px-4 flex flex-col items-center space-y-1`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="text-xs text-center">{param.label}</span>
                </Button>
              );
            })}
          </div>
          
          {/* Live Toggle */}
          {selectedParameter && (
            <div className="flex items-center space-x-4">
              <Button
                onClick={() => setIsLiveActive(!isLiveActive)}
                variant={isLiveActive ? "destructive" : "default"}
                className={`${isLiveActive 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
                } text-white`}
              >
                {isLiveActive ? 'Stop Live Updates' : 'Start Live Updates'}
              </Button>
              <span className="text-sm text-gray-400">
                Updates every 30-40 seconds
              </span>
            </div>
          )}
        </div>

        {/* Heatmap Visualization */}
        {selectedParameter && Object.keys(heatmapData).length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-cyan-300">
                Heatmap: {selectedParam?.label} {selectedParam?.unit && `(${selectedParam.unit})`}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Min: {minValue.toFixed(2)} {selectedParam?.unit}</span>
                <span>Max: {maxValue.toFixed(2)} {selectedParam?.unit}</span>
              </div>
            </div>

            {/* 3x9 Grid Heatmap */}
            <div className="space-y-2">
              {gridRows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-9 gap-2">
                  {row.map(feeder => {
                    const value = heatmapData[feeder];
                    const backgroundColor = getHeatmapColor(value, selectedParameter, minValue, maxValue);
                    
                    return (
                      <div
                        key={feeder}
                        className="relative group p-3 rounded-lg border border-gray-600 min-h-[80px] flex flex-col justify-center items-center transition-all duration-300 hover:scale-105 hover:z-10"
                        style={{ backgroundColor }}
                      >
                        <div className="text-center">
                          <div className="text-xs font-semibold text-gray-900 mb-1 leading-tight">
                            {feeder.split(' ').slice(0, 2).join(' ')}
                          </div>
                          <div className="text-sm font-bold text-gray-900">
                            {value.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-800">
                            {selectedParam?.unit}
                          </div>
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                          <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg border border-gray-600">
                            <div className="font-semibold">{feeder}</div>
                            <div>{selectedParam?.label}: {value.toFixed(2)} {selectedParam?.unit}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Color Legend */}
            <div className="flex items-center justify-center space-x-4 p-4 bg-gray-900/50 rounded-lg">
              <span className="text-sm text-gray-400">Intensity Scale:</span>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-xs text-gray-400">Low</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-xs text-gray-400">Medium</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-xs text-gray-400">High</span>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {!selectedParameter && (
          <div className="text-center py-12">
            <Thermometer className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              Select a Parameter to View Heatmap
            </h3>
            <p className="text-gray-400">
              Click on any parameter button above to visualize real-time data across all 27 feeders
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default HeatmapDashboard;
