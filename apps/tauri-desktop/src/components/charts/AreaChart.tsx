import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AreaChartProps {
  data: any;
  options?: any;
  className?: string;
}

const AreaChart: React.FC<AreaChartProps> = ({ data, options, className = '' }) => {
  // Ensure data has fill property for area chart
  const areaData = {
    ...data,
    datasets: data.datasets?.map((dataset: any) => ({
      ...dataset,
      fill: true,
      backgroundColor: dataset.backgroundColor || 'rgba(59, 130, 246, 0.1)',
    })) || [],
  };

  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={`w-full h-full ${className}`}>
      <Line data={areaData} options={mergedOptions} />
    </div>
  );
};

export default AreaChart;
