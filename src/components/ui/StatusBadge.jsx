import './StatusBadge.css';

export default function StatusBadge({ status, label }) {
  // status: 'verified', 'suspicious', 'counterfeit', 'neutral'
  const badgeClass = `status-badge badge-${status}`;
  
  return (
    <span className={badgeClass}>
      {label || status.toUpperCase()}
    </span>
  );
}
