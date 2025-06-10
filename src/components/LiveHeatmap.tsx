import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

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

// All 10 parameters
const parameters = [
  { key: 'current_r', label: 'Current R Phase (A)', group: 'current' },
  { key: 'current_y', label: 'Current Y Phase (A)', group: 'current' },
  { key: 'current_b', label: 'Current B Phase (A)', group: 'current' },
  { key: 'voltage_ry', label: 'Voltage R-Y (V)', group: 'voltage' },
  { key: 'voltage_yb', label: 'Voltage Y-B (V)', group: 'voltage' },
  { key: 'voltage_br', label: 'Voltage B-R (V)', group: 'voltage' },
  { key: 'power_factor_r', label: 'Power Factor R', group: 'power_factor' },
  { key: 'power_factor_y', label: 'Power Factor Y', group: 'power_factor' },
  { key: 'power_factor_b', label: 'Power Factor B', group: 'power_factor' },
  { key: 'active_energy', label: 'Active Energy (kWh)', group: 'active_energy' }
];

// Group-specific normalization ranges
const normalizationRanges = {
  current: { min: 0, max: 100 },
  voltage: { min: 0, max: 500 },
  power_factor: { min: 0, max: 1 },
  active_energy: { min: 0, max: 1000 }
};

interface HeatmapData {
  [feeder: string]: {
    [parameter: string]: {
      value: number;
      normalizedValue: number;
    };
  };
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
      voltage_ry: isOff ? 0 : Math.random() * 400 + 100,
      voltage_yb: isOff ? 0 : Math.random() * 400 + 100,
      voltage_br: isOff ? 0 : Math.random() * 400 + 100,
      power_factor_r: isOff ? 0 : Math.random() * 0.4 + 0.6,
      power_factor_y: isOff ? 0 : Math.random() * 0.4 + 0.6,
      power_factor_b: isOff ? 0 : Math.random() * 0.4 + 0.6,
      active_energy: isOff ? 0 : Math.random() * 800 + 200
    };
    
    data.push(dataPoint);
  });
  
  return data;
};

// Generate mock historical data for time range
const generateMockHistoricalData = (fromTime: string, toTime: string) => {
  const start = new Date(fromTime);
  const end = new Date(toTime);
  const data = [];
  
  // Generate data points every 10 seconds within the time range
  for (let time = new Date(start); time <= end; time.setSeconds(time.getSeconds() + 10)) {
    slaveFeeders.forEach((feeder, index) => {
      const isOff = Math.random() < 0.1; // 10% chance of being off
      
      const dataPoint = {
        id: index + 1,
        timestamp: time.toISOString(),
        location: "MRSS",
        slave_id: index + 1,
        slave_name: feeder,
        current_r: isOff ? 0 : Math.random() * 80 + 10,
        current_y: isOff ? 0 : Math.random() * 80 + 10,
        current_b: isOff ? 0 : Math.random() * 80 + 10,
        voltage_ry: isOff ? 0 : Math.random() * 400 + 100,
        voltage_yb: isOff ? 0 : Math.random() * 400 + 100,
        voltage_br: isOff ? 0 : Math.random() * 400 + 100,
        power_factor_r: isOff ? 0 : Math.random() * 0.4 + 0.6,
        power_factor_y: isOff ? 0 : Math.random() * 0.4 + 0.6,
        power_factor_b: isOff ? 0 : Math.random() * 0.4 + 0.6,
        active_energy: isOff ? 0 : Math.random() * 800 + 200
      };
      
      data.push(dataPoint);
    });
  }
  
  return data;
};

// Normalize a parameter value based on its group
const normalizeParameter = (value: number, parameterGroup: string): number => {
  const range = normalizationRanges[parameterGroup as keyof typeof normalizationRanges];
  if (!range) return 0;
  
  return Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min)));
};

// Get color based on normalized value
const getParameterColor = (normalizedValue: number): string => {
  if (normalizedValue === 0) {
    return '#0000FF'; // Blue for off/zero values
  }
  
  // Color gradient based on normalized value
  if (normalizedValue <= 0.25) {
    // Green to Yellow (0-0.25)
    const ratio = normalizedValue / 0.25;
    const red = Math.floor(255 * ratio);
    return `rgb(${red}, 255, 0)`;
  } else if (normalizedValue <= 0.5) {
    // Yellow to Orange (0.25-0.5)
    const ratio = (normalizedValue - 0.25) / 0.25;
    const green = Math.floor(255 * (1 - ratio * 0.35));
    return `rgb(255, ${green}, 0)`;
  } else if (normalizedValue <= 0.75) {
    // Orange to Red (0.5-0.75)
    const ratio = (normalizedValue - 0.5) / 0.25;
    const green = Math.floor(165 * (1 - ratio));
    return `rgb(255, ${green}, 0)`;
  } else {
    // Red (0.75-1.0)
    return '#FF0000';
  }
};

// Process API data into heatmap format
const processHeatmapData = (apiData: any[]): HeatmapData => {
  const heatmapData: HeatmapData = {};
  
  slaveFeeders.forEach(feeder => {
    heatmapData[feeder] = {};
    
    const feederData = apiData.find(item => item.slave_name === feeder);
    
    parameters.forEach(param => {
      const value = feederData ? feederData[param.key] : 0;
      const normalizedValue = normalizeParameter(value, param.group);
      
      heatmapData[feeder][param.key] = {
        value,
        normalizedValue
      };
    });
  });
  
  return heatmapData;
};

const LiveHeatmap: React.FC = () => {
  const [heatmapData, setHeatmapData] = useState<HeatmapData>({});
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [fromTime, setFromTime] = useState<string>('');
  const [toTime, setToTime] = useState<string>('');
  const [exportError, setExportError] = useState<string>('');

  const fetchData = () => {
    try {
      const apiData = generateMockApiData();
      const processedData = processHeatmapData(apiData);
      setHeatmapData(processedData);
      setLastUpdate(new Date());
      
      console.log('Heatmap data updated for', slaveFeeders.length, 'feeders and', parameters.length, 'parameters');
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
    }
  };

  const validateTimeRange = (): boolean => {
    setExportError('');
    
    if (!fromTime || !toTime) {
      setExportError('Please provide valid From and To times');
      return false;
    }
    
    const fromDate = new Date(fromTime);
    const toDate = new Date(toTime);
    
    if (toDate <= fromDate) {
      setExportError('To Time must be after From Time');
      return false;
    }
    
    return true;
  };

  const exportToExcel = () => {
    if (!validateTimeRange()) {
      return;
    }

    try {
      // Generate mock historical data for the specified time range
      const historicalData = generateMockHistoricalData(fromTime, toTime);
      const dataToExport: any[] = [];
      
      historicalData.forEach(record => {
        const row: any = {
          'Feeder Name': record.slave_name,
          'Timestamp': record.timestamp,
        };
        
        parameters.forEach(param => {
          const value = record[param.key];
          const normalizedValue = normalizeParameter(value, param.group);
          row[param.label] = value?.toFixed(2) || '0';
          row[`${param.label} (Normalized)`] = normalizedValue?.toFixed(3) || '0';
        });
        
        dataToExport.push(row);
      });

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Heatmap Data');
      
      const filename = `heatmap_data_${fromTime.replace(/[:\-T]/g, '_')}_to_${toTime.replace(/[:\-T]/g, '_')}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      setExportError('');
    } catch (error) {
      setExportError('Error exporting data. Please try again.');
      console.error('Export error:', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    interval = setInterval(() => {
        fetchData();
      }, 10000); // 10 seconds
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  return (
    <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-cyan-400" />
            <span>Live Activity Heatmap - 27x10 Grid</span>
            <div className="flex items-center space-x-2 ml-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-400">Live</span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdate && (
              <span className="text-sm text-gray-400">
                Last update: {lastUpdate.toLocaleTimeString()}
              </span>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {Object.keys(heatmapData).length > 0 ? (
          <div className="space-y-4">
            {/* 27x10 Grid Heatmap - Optimized for single view */}
            <div className="w-full">
              <div className="w-full overflow-auto">
                <div className="inline-block min-w-full">
                  <table className="border-collapse border border-gray-600 w-full" style={{ fontSize: '9px' }}>
                    <thead>
                      <tr>
                        <th className="border border-gray-600 p-1 bg-gray-700 text-cyan-300 font-semibold" style={{ minWidth: '120px', width: '120px' }}>
                          Feeder / Parameter
                        </th>
                        {parameters.map(param => (
                          <th 
                            key={param.key} 
                            className="border border-gray-600 p-1 bg-gray-700 text-cyan-300 font-semibold text-center"
                            style={{ 
                              writingMode: 'vertical-rl',
                              textOrientation: 'mixed',
                              minWidth: '50px',
                              width: '50px',
                              height: '80px'
                            }}
                          >
                            <div className="transform rotate-180" style={{ whiteSpace: 'nowrap' }}>
                              {param.label.replace(' (A)', '').replace(' (V)', '').replace(' (kWh)', '')}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slaveFeeders.map(feeder => (
                        <tr key={feeder}>
                          <td className="border border-gray-600 p-1 bg-gray-700 text-gray-300 font-medium text-left" style={{ fontSize: '8px', width: '120px' }}>
                            {feeder.length > 20 ? feeder.substring(0, 20) + '...' : feeder}
                          </td>
                          {parameters.map(param => {
                            const cellData = heatmapData[feeder]?.[param.key];
                            const backgroundColor = cellData 
                              ? getParameterColor(cellData.normalizedValue)
                              : '#374151';
                            const textColor = cellData?.normalizedValue === 0 || (cellData?.normalizedValue || 0) > 0.5 
                              ? '#FFFFFF' 
                              : '#000000';
                            
                            return (
                              <td
                                key={`${feeder}-${param.key}`}
                                className="border border-gray-600 p-1 text-center relative group cursor-pointer transition-all hover:scale-105"
                                style={{ 
                                  backgroundColor,
                                  color: textColor,
                                  width: '50px',
                                  height: '22px',
                                  fontSize: '8px'
                                }}
                              >
                                <div className="text-xs font-mono leading-tight">
                                  {cellData ? cellData.value.toFixed(0) : 'N/A'}
                                </div>
                                
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                                  <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-lg border border-gray-600">
                                    <div className="font-semibold">{feeder}</div>
                                    <div>{param.label}</div>
                                    <div>Value: {cellData?.value?.toFixed(2) || 'N/A'}</div>
                                    <div>Normalized: {cellData?.normalizedValue?.toFixed(3) || 'N/A'}</div>
                                    <div>Last Update: {lastUpdate?.toLocaleTimeString()}</div>
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
              </div>
            </div>

            {/* Legend - Compact */}
            <div className="w-full flex justify-center">
              <div className="flex items-center justify-center space-x-4 p-3 bg-gray-900/50 rounded-lg">
                <span className="text-sm text-gray-300 font-semibold">Value Legend:</span>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3" style={{ backgroundColor: '#0000FF' }}></div>
                  <span className="text-xs text-gray-400">Off</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3" style={{ backgroundColor: '#00FF00' }}></div>
                  <span className="text-xs text-gray-400">Low</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3" style={{ backgroundColor: '#FFFF00' }}></div>
                  <span className="text-xs text-gray-400">Med</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3" style={{ backgroundColor: '#FFA500' }}></div>
                  <span className="text-xs text-gray-400">High</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3" style={{ backgroundColor: '#FF0000' }}></div>
                  <span className="text-xs text-gray-400">Crit</span>
                </div>
              </div>
            </div>

            {/* Export Section - Compact */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-3xl">
                <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-600 mx-auto">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-3 flex items-center justify-center">
                    <Download className="h-5 w-5 mr-2" />
                    Export Data to Excel
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-xl mx-auto">
                      <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-300">From Time:</label>
                        <Input
                          type="datetime-local"
                          value={fromTime}
                          onChange={(e) => setFromTime(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white text-sm"
                        />
                      </div>
                      <div className="flex flex-col space-y-1">
                        <label className="text-sm text-gray-300">To Time:</label>
                        <Input
                          type="datetime-local"
                          value={toTime}
                          onChange={(e) => setToTime(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white text-sm"
                        />
                      </div>
                    </div>
                    
                    {exportError && (
                      <div className="flex items-center justify-center space-x-2 text-red-400 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{exportError}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-center">
                      <Button
                        onClick={exportToExcel}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={!fromTime || !toTime}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export to Excel
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Update Info - Compact */}
            <div className="text-center text-xs text-gray-400">
              <p>
                Updates every 10 seconds • 27 feeders × 10 parameters • 
                Group normalization: Currents (0-100), Voltages (0-500), Power Factors (0-1), Energy (0-1000)
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
              Fetching real-time parameter data for all 27 feeders
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveHeatmap;
