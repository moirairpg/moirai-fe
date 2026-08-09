import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

type CreateAssetCardProps = {
  to: string;
  label: string;
};

export function CreateAssetCard({ to, label }: CreateAssetCardProps) {
  return (
    <Link
      to={to}
      className="flex h-72 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-card p-3 text-center text-muted-foreground transition-colors hover:border-primary hover:bg-accent/40 hover:text-foreground"
    >
      <Plus className="h-7 w-7" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}
