
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity } from 'lucide-react';
import { slaveFeeders, parameters } from '../constants/feeders';

interface ComparisonControlPanelProps {
  selectedFeeders: string[];
  selectedParameters: string[];
  onFeederToggle: (feeder: string) => void;
  onParameterToggle: (parameter: string) => void;
}

const ComparisonControlPanel = ({
  selectedFeeders,
  selectedParameters,
  onFeederToggle,
  onParameterToggle
}: ComparisonControlPanelProps) => {
  return (
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
                      onCheckedChange={() => onFeederToggle(feeder)}
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
                      onCheckedChange={() => onParameterToggle(param.value)}
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
  );
};

export default ComparisonControlPanel;
