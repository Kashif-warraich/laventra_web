interface StatusBadgeProps {
  status: string
  className?: string
}

const colorMap: Record<string, string> = {
  active:     'bg-teal/20 text-teal',
  online:     'bg-teal/20 text-teal',
  operational:'bg-teal/20 text-teal',
  success:    'bg-teal/20 text-teal',
  completed:  'bg-teal/20 text-teal',
  ready:      'bg-teal/20 text-teal',
  inactive:   'bg-red/20 text-red',
  offline:    'bg-red/20 text-red',
  error:      'bg-red/20 text-red',
  failed:     'bg-red/20 text-red',
  generating: 'bg-amber/20 text-amber',
  pending:    'bg-amber/20 text-amber',
  in_progress:'bg-blue/20 text-bluel',
}

export default function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const colors = colorMap[status?.toLowerCase()] ?? 'bg-tm/30 text-ts'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colors} ${className}`}>
      {status?.replace(/_/g, ' ') ?? 'unknown'}
    </span>
  )
}
