
import React, { useState, useEffect } from 'react';
import LiveHeatmap from '../components/LiveHeatmap';
import Navbar from '../components/Navbar';
import ComparisonControlPanel from '../components/ComparisonControlPanel';
import ComparisonChart from '../components/ComparisonChart';
import { fetchLatestData } from '../services/api';
import { generateChartData } from '../utils/chartDataGenerator';

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

  return (
    <div style={{ fontFamily: 'Roboto, sans-serif' }}>
      <Navbar />

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
            <ComparisonControlPanel
              selectedFeeders={selectedFeeders}
              selectedParameters={selectedParameters}
              onFeederToggle={handleFeederToggle}
              onParameterToggle={handleParameterToggle}
            />

            {/* Chart Display */}
            <ComparisonChart
              selectedFeeders={selectedFeeders}
              selectedParameters={selectedParameters}
              chartData={chartData}
              networkError={networkError}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
