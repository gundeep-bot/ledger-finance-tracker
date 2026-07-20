import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from './Card.jsx';

const PALETTE = ['#14746F', '#B4763A', '#7C8591', '#B0503B', '#5C9B95', '#C9A46A', '#8B7FB0', '#6FA07D'];

export default function CategoryPie({ data }) {
  const hasData = data && data.length > 0;

  return (
    <Card>
      <h2>By category</h2>
      {!hasData ? (
        <p className="empty-note">No spending logged this month yet.</p>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="category"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              animationDuration={900}
              animationEasing="ease-out"
            >
              {data.map((entry, i) => (
                <Cell key={entry.category} fill={PALETTE[i % PALETTE.length]} stroke="var(--surface)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => `$${Number(value).toFixed(2)}`}
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--ink)' }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--ink-soft)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
