const STYLES = {
  active:   'bg-green-50 text-green-700 ring-green-200',
  inactive: 'bg-gray-100 text-gray-500 ring-gray-200',
  pending:  'bg-yellow-50 text-yellow-700 ring-yellow-200',
  expired:  'bg-red-50 text-red-600 ring-red-200',
};

export default function StatusBadge({ status }) {
  const cls = STYLES[status] || STYLES.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {status ? status.charAt(0).toUpperCase() + status.slice(1) : '—'}
    </span>
  );
}
