import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import Card from './Card.jsx';

export default function DailyTrend({ data }) {
  const hasData = data && data.length > 0;
  const chartData = (data || []).map((d) => ({
    ...d,
    day: d.date?.slice(8, 10),
  }));

  return (
    <Card>
      <h2>Daily trend</h2>
      {!hasData ? (
        <p className="empty-note">Nothing to chart yet this month.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#14746F" />
                <stop offset="100%" stopColor="#B4763A" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--ink-soft)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fontFamily: 'var(--font-mono)', fill: 'var(--ink-soft)' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(2)}`}
              labelFormatter={(l) => `Day ${l}`}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--ink)' }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="url(#trendLine)"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#14746F', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
