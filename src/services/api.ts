
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export interface EnergyDataPoint {
  id: number;
  timestamp: string;
  location: string;
  slave_id: number;
  slave_name: string;
  current_r: number;
  current_y: number;
  current_b: number;
  voltage_ry: number;
  voltage_yb: number;
  voltage_br: number;
  power_factor_r: number;
  power_factor_y: number;
  power_factor_b: number;
  active_energy: number;
}

export class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NetworkError';
  }
}

export const fetchLatestEnergyData = async (): Promise<EnergyDataPoint[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/energy-data/latest`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new NetworkError(`Failed to fetch data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Network unavailable. Please check your connection.');
    }
    throw error;
  }
};

export const fetchHistoricalEnergyData = async (fromTime: string, toTime: string): Promise<EnergyDataPoint[]> => {
  try {
    const params = new URLSearchParams({
      fromTime,
      toTime
    });

    const response = await fetch(`${API_BASE_URL}/energy-data/range?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new NetworkError(`Failed to fetch historical data: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new NetworkError('Network unavailable. Please check your connection.');
    }
    throw error;
  }
};
