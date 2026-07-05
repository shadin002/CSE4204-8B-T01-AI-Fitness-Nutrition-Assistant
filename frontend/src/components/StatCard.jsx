export default function StatCard({ icon, label, value, helper }) {
  return (
    <div className="stat-card">
      <div className="soft-icon">{icon}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        {helper ? <small>{helper}</small> : null}
      </div>
    </div>
  );
}
