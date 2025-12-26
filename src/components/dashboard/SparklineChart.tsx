import { useMemo } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface SparklineChartProps {
  data: number[];
  isPositive: boolean;
  width?: number;
  height?: number;
}

export function SparklineChart({ data, isPositive, width = 80, height = 30 }: SparklineChartProps) {
  const chartData = useMemo(() => {
    return data.map((value, index) => ({ value, index }));
  }, [data]);

  const color = isPositive ? 'hsl(162, 83%, 43%)' : 'hsl(0, 72%, 51%)';

  if (!data.length) {
    return <div style={{ width, height }} className="bg-secondary/30 rounded animate-pulse" />;
  }

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <YAxis hide domain={['dataMin', 'dataMax']} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
