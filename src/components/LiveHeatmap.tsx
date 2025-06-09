import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Play, Pause, Download, AlertCircle, Wifi, WifiOff } from 'lucide-react';
import * as XLSX from 'xlsx';
import { fetchLatestEnergyData, fetchHistoricalEnergyData, NetworkError, EnergyDataPoint } from '../services/api';

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
const processHeatmapData = (apiData: EnergyDataPoint[]): HeatmapData => {
  const heatmapData: HeatmapData = {};
  
  slaveFeeders.forEach(feeder => {
    heatmapData[feeder] = {};
    
    const feederData = apiData.find(item => item.slave_name === feeder);
    
    parameters.forEach(param => {
      const value = feederData ? feederData[param.key as keyof EnergyDataPoint] as number : 0;
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
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [fromTime, setFromTime] = useState<string>('');
  const [toTime, setToTime] = useState<string>('');
  const [exportError, setExportError] = useState<string>('');
  const [networkError, setNetworkError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    setNetworkError('');
    
    try {
      console.log('Fetching latest energy data from API...');
      const apiData = await fetchLatestEnergyData();
      console.log('Received data for', apiData.length, 'feeders');
      
      const processedData = processHeatmapData(apiData);
      setHeatmapData(processedData);
      setLastUpdate(new Date());
      setIsConnected(true);
      
      console.log('Heatmap data updated for', slaveFeeders.length, 'feeders and', parameters.length, 'parameters');
    } catch (error) {
      console.error('Error fetching heatmap data:', error);
      
      if (error instanceof NetworkError) {
        setNetworkError(error.message);
        setIsConnected(false);
        setIsLiveActive(false); // Stop live updates on network error
      } else {
        setNetworkError('Failed to fetch data from server. Please try again.');
        setIsConnected(false);
      }
    } finally {
      setIsLoading(false);
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

  const exportToExcel = async () => {
    if (!validateTimeRange()) {
      return;
    }

    setExportError('');
    setIsLoading(true);

    try {
      console.log('Fetching historical data for export...');
      const historicalData = await fetchHistoricalEnergyData(fromTime, toTime);
      console.log('Received', historicalData.length, 'historical records');
      
      const dataToExport: any[] = [];
      
      historicalData.forEach(record => {
        const row: any = {
          'Feeder Name': record.slave_name,
          'Timestamp': record.timestamp,
        };
        
        parameters.forEach(param => {
          const value = record[param.key as keyof EnergyDataPoint] as number;
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
      console.error('Export error:', error);
      
      if (error instanceof NetworkError) {
        setExportError(error.message);
      } else {
        setExportError('Error exporting data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isLiveActive && isConnected) {
      interval = setInterval(() => {
        fetchData();
      }, 10000); // 10 seconds
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLiveActive, isConnected]);

  return (
    <Card className="bg-gray-800/50 border-cyan-500/20 backdrop-blur-sm w-full mx-auto">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="h-6 w-6 text-cyan-400" />
            <span>Live Activity Heatmap - 27x10 Grid</span>
            {isLiveActive && isConnected && (
              <div className="flex items-center space-x-2 ml-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">Live</span>
              </div>
            )}
            {!isConnected && (
              <div className="flex items-center space-x-2 ml-4">
                <WifiOff className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-400">Disconnected</span>
              </div>
            )}
            {isConnected && !isLiveActive && (
              <div className="flex items-center space-x-2 ml-4">
                <Wifi className="h-4 w-4 text-cyan-500" />
                <span className="text-sm text-cyan-400">Connected</span>
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
              disabled={!isConnected}
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
        {networkError && (
          <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg">
            <div className="flex items-center space-x-2 text-red-400">
              <AlertCircle className="h-5 w-5" />
              <span className="font-semibold">Network Error</span>
            </div>
            <p className="text-red-300 mt-2">{networkError}</p>
            <Button
              onClick={fetchData}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white"
              disabled={isLoading}
            >
              {isLoading ? 'Retrying...' : 'Retry Connection'}
            </Button>
          </div>
        )}

        {Object.keys(heatmapData).length > 0 ? (
          <div className="space-y-4">
            {/* 27x10 Grid Heatmap - Enhanced Centering */}
            <div className="w-full flex justify-center items-center">
              <div className="w-full max-w-none flex justify-center">
                <div className="inline-block">
                  <table className="border-collapse border border-gray-600 mx-auto" style={{ fontSize: '11px' }}>
                    <thead>
                      <tr>
                        <th className="border border-gray-600 p-2 bg-gray-700 text-cyan-300 font-semibold min-w-[200px]">
                          Feeder / Parameter
                        </th>
                        {parameters.map(param => (
                          <th 
                            key={param.key} 
                            className="border border-gray-600 p-1 bg-gray-700 text-cyan-300 font-semibold text-center"
                            style={{ 
                              writingMode: 'vertical-rl',
                              textOrientation: 'mixed',
                              minWidth: '80px',
                              maxWidth: '90px',
                              height: '120px'
                            }}
                          >
                            <div className="transform rotate-180" style={{ whiteSpace: 'nowrap' }}>
                              {param.label}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {slaveFeeders.map(feeder => (
                        <tr key={feeder}>
                          <td className="border border-gray-600 p-2 bg-gray-700 text-gray-300 font-medium text-left">
                            {feeder}
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
                                  minWidth: '80px',
                                  maxWidth: '90px',
                                  height: '35px'
                                }}
                              >
                                <div className="text-xs font-mono leading-tight">
                                  {cellData ? cellData.value.toFixed(1) : 'N/A'}
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

            {/* Legend - Enhanced Centering */}
            <div className="w-full flex justify-center">
              <div className="flex items-center justify-center space-x-6 p-4 bg-gray-900/50 rounded-lg">
                <span className="text-sm text-gray-300 font-semibold">Normalized Value Legend:</span>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#0000FF' }}></div>
                  <span className="text-xs text-gray-400">Off/Zero</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#00FF00' }}></div>
                  <span className="text-xs text-gray-400">Low (0-0.25)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#FFFF00' }}></div>
                  <span className="text-xs text-gray-400">Medium (0.25-0.5)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#FFA500' }}></div>
                  <span className="text-xs text-gray-400">High (0.5-0.75)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4" style={{ backgroundColor: '#FF0000' }}></div>
                  <span className="text-xs text-gray-400">Critical (0.75-1.0)</span>
                </div>
              </div>
            </div>

            {/* Export Section - Enhanced Centering */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-4xl">
                <div className="p-4 bg-gray-900/50 rounded-lg border border-gray-600 mx-auto">
                  <h3 className="text-lg font-semibold text-cyan-300 mb-4 flex items-center justify-center">
                    <Download className="h-5 w-5 mr-2" />
                    Export Data to Excel
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                      <div className="flex flex-col space-y-2">
                        <label className="text-sm text-gray-300">From Time:</label>
                        <Input
                          type="datetime-local"
                          value={fromTime}
                          onChange={(e) => setFromTime(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                          disabled={!isConnected}
                        />
                      </div>
                      <div className="flex flex-col space-y-2">
                        <label className="text-sm text-gray-300">To Time:</label>
                        <Input
                          type="datetime-local"
                          value={toTime}
                          onChange={(e) => setToTime(e.target.value)}
                          className="bg-gray-800 border-gray-600 text-white"
                          disabled={!isConnected}
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
                        disabled={!fromTime || !toTime || !isConnected || isLoading}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        {isLoading ? 'Exporting...' : 'Export to Excel'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Update Info - Centered */}
            <div className="text-center text-sm text-gray-400">
              <p>
                Updates every 10 seconds • 
                Showing 27 feeders (rows) × 10 parameters (columns) • 
                Group-specific normalization: Currents (0-100), Voltages (0-500), Power Factors (0-1), Active Energy (0-1000)
              </p>
              <p className="mt-1">
                Blue = Zero/Off | Green→Yellow→Orange→Red = Increasing normalized values (0→1)
              </p>
              {!isConnected && (
                <p className="mt-1 text-red-400">
                  ⚠️ Network connection required for real-time data
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            {isLoading ? (
              <>
                <Activity className="h-16 w-16 text-cyan-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Loading Heatmap Data...
                </h3>
                <p className="text-gray-400">
                  Fetching real-time parameter data from database
                </p>
              </>
            ) : (
              <>
                <WifiOff className="h-16 w-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Data Available
                </h3>
                <p className="text-gray-400 mb-4">
                  Unable to fetch data from the database
                </p>
                <Button
                  onClick={fetchData}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Connecting...' : 'Retry Connection'}
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LiveHeatmap;
