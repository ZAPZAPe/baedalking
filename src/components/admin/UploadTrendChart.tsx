'use client';

import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

interface UploadTrendChartProps {
  data: {
    date: string;
    count: number;
  }[];
}

export default function UploadTrendChart({ data }: UploadTrendChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // 이전 차트 제거
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // 새 차트 생성
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(item => item.date),
        datasets: [
          {
            label: '실적 업로드 수',
            data: data.map(item => item.count),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          },
          x: {
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
            ticks: {
              color: 'rgba(255, 255, 255, 0.7)',
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="h-64">
      <canvas ref={chartRef} />
    </div>
  );
} 