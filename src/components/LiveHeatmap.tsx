
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Activity, Play, Pause } from 'lucide-react';

interface HeatmapData {
  timestamp: string;
  feederName: string;
  value: number;
}

interface LiveHeatmapProps {
  slaveFeeders: string[];
  parameters: Array<{ value: string; label: string; unit: string }>;
}

export const LiveHeatmap: React.FC<LiveHeatmapProps> = ({ slaveFeeders, parameters }) => {
  const [selectedParameter, setSelectedParameter] = useState('active_energy');
  const [isLive, setIsLive] = useState(false);
  const [heatmapData, setHeatmapData] = useState<HeatmapData[][]>([]);
  const [timeLabels, setTimeLabels] = useState<string[]>([]);

  // Generate mock data for heatmap (12 time points for each feeder)
  const generateHeatmapData = (param: string) => {
    const now = new Date();
    const newTimeLabels = [];
    const newData: HeatmapData[][] = [];

    // Generate 12 time labels (T-11 to T-0)
    for (let i = 11; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 40 * 1000);
      newTimeLabels.push(`T-${i}`);
    }

    // Generate data for each feeder across all time points
    slaveFeeders.forEach(feeder => {
      const feederData: HeatmapData[] = [];
      newTimeLabels.forEach((label, timeIndex) => {
        let value;
        // Generate realistic mock data based on parameter type
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

        feederData.push({
          timestamp: label,
          feederName: feeder,
          value: Number(value.toFixed(2))
        });
      });
      newData.push(feederData);
    });

    setTimeLabels(newTimeLabels);
    setHeatmapData(newData);
  };

  // Update heatmap data when parameter changes
  useEffect(() => {
    generateHeatmapData(selectedParameter);
  }, [selectedParameter, slaveFeeders]);

  // Live update simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLive) {
      interval = setInterval(() => {
        setHeatmapData(prev => {
          const newData = prev.map(feederData => {
            // Remove first element and add new one at the end
            const updatedData = [...feederData];
            updatedData.shift();
            
            const now = new Date();
            let value;
            if (selectedParameter.includes('current')) {
              value = Math.random() * 50 + 10;
            } else if (selectedParameter.includes('voltage')) {
              value = Math.random() * 50 + 220;
            } else if (selectedParameter.includes('power_factor')) {
              value = Math.random() * 0.3 + 0.7;
            } else if (selectedParameter === 'active_energy') {
              value = Math.random() * 1000 + 500;
            } else {
              value = Math.random() * 100;
            }

            updatedData.push({
              timestamp: 'T-0',
              feederName: feederData[0].feederName,
              value: Number(value.toFixed(2))
            });

            return updatedData;
          });
          return newData;
        });

        // Update time labels to shift left
        setTimeLabels(prev => {
          const newLabels = [...prev];
          newLabels.shift();
          newLabels.push('T-0');
          return newLabels;
        });
      }, 40000); // 40 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLive, selectedParameter]);

  // Get color based on value range for selected parameter
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
    
    // Create gradient from green (low) to red (high)
    const red = Math.floor(255 * intensity);
    const green = Math.floor(255 * (1 - intensity));
    const blue = 50;
    
    return `rgba(${red}, ${green}, ${blue}, 0.8)`;
  };

  const selectedParamInfo = parameters.find(p => p.value === selectedParameter);

  return (
    <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-cyan-400" />
            <span>Live Energy Heatmap - All 27 Feeders</span>
            {isLive && (
              <div className="flex items-center space-x-2 ml-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Live</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <Select value={selectedParameter} onValueChange={setSelectedParameter}>
              <SelectTrigger className="w-64 bg-gray-700 border-gray-600">
                <SelectValue placeholder="Select parameter" />
              </SelectTrigger>
              <SelectContent>
                {parameters.map(param => (
                  <SelectItem key={param.value} value={param.value}>
                    {param.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => setIsLive(!isLive)}
              variant={isLive ? "destructive" : "default"}
              className={`${isLive 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              {isLive ? (
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
        <div className="mb-4">
          <h4 className="text-lg font-semibold text-cyan-300 mb-2">
            {selectedParamInfo?.label || selectedParameter} - Real-time Values
          </h4>
          <p className="text-sm text-gray-400">
            Showing last 12 time intervals (T-11 to T-0) • Updates every 40 seconds when live
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-full">
            {/* Header with time labels */}
            <div className="grid grid-cols-13 gap-1 mb-2">
              <div className="p-2 text-xs font-semibold text-cyan-300">
                Feeder / Time
              </div>
              {timeLabels.map((label, index) => (
                <div key={index} className="p-2 text-xs font-semibold text-cyan-300 text-center">
                  {label}
                </div>
              ))}
            </div>

            {/* Heatmap grid */}
            <div className="space-y-1">
              {heatmapData.map((feederData, feederIndex) => (
                <div key={slaveFeeders[feederIndex]} className="grid grid-cols-13 gap-1">
                  {/* Feeder name */}
                  <div className="p-2 text-xs text-gray-300 font-medium truncate" title={slaveFeeders[feederIndex]}>
                    {slaveFeeders[feederIndex]}
                  </div>
                  
                  {/* Data cells */}
                  {feederData.map((dataPoint, timeIndex) => (
                    <div
                      key={timeIndex}
                      className="p-2 text-xs text-white font-mono text-center rounded border border-gray-600 transition-colors duration-500"
                      style={{
                        backgroundColor: getHeatmapColor(dataPoint.value, selectedParameter),
                        minHeight: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      title={`${slaveFeeders[feederIndex]} - ${dataPoint.timestamp}: ${dataPoint.value.toFixed(2)} ${selectedParamInfo?.unit || ''}`}
                    >
                      {dataPoint.value.toFixed(1)}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatmapColor(0, selectedParameter) }}></div>
            <span className="text-xs text-gray-400">Low</span>
          </div>
          <div className="flex items-center space-x-1">
            {[0.25, 0.5, 0.75, 1].map((intensity) => (
              <div 
                key={intensity}
                className="w-4 h-4 rounded"
                style={{ 
                  backgroundColor: selectedParameter.includes('current') 
                    ? getHeatmapColor(intensity * 60, selectedParameter)
                    : selectedParameter.includes('voltage')
                    ? getHeatmapColor(200 + intensity * 80, selectedParameter)
                    : selectedParameter.includes('power_factor')
                    ? getHeatmapColor(0.7 + intensity * 0.3, selectedParameter)
                    : getHeatmapColor(intensity * 1500, selectedParameter)
                }}
              ></div>
            ))}
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: getHeatmapColor(1500, selectedParameter) }}></div>
            <span className="text-xs text-gray-400">High</span>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Green indicates lower values, Red indicates higher values within the expected range</p>
          <p>Hover over cells for detailed values • Grid updates automatically when live mode is active</p>
        </div>
      </CardContent>
    </Card>
  );
};
