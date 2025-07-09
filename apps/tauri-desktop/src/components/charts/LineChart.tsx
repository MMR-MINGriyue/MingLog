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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface LineChartProps {
  data: any;
  options?: any;
  className?: string;
}

const LineChart: React.FC<LineChartProps> = ({ data, options, className = '' }) => {
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
    animation: {
      duration: 300,
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return (
    <div className={`w-full h-full ${className}`} data-testid="chart-container">
      <Line data={data} options={mergedOptions} />
    </div>
  );
};

export default LineChart;
