export default function StatCard({ label, value, icon: Icon, color = 'text-ink', hint }) {
  return (
    <div className="card">
      {Icon && <Icon size={20} className={`${color} mb-3`} />}
      <p className="text-2xl font-bold text-ink leading-tight">{value}</p>
      <p className="text-xs text-muted mt-1">{label}</p>
      {hint && <p className="text-[10px] text-muted mt-0.5">{hint}</p>}
    </div>
  )
}
