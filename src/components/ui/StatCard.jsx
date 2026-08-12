export default function StatCard({ label, value, icon: Icon, color = 'text-secondary', hint }) {
  return (
    <div className="card">
      {Icon && <Icon size={20} className={`${color} mb-3`} />}
      <p className="text-2xl font-bold text-secondary leading-tight">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{label}</p>
      {hint && <p className="text-[10px] text-gray-300 mt-0.5">{hint}</p>}
    </div>
  )
}
