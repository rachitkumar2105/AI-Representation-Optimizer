import DataBreakdown from "../components/DataBreakdown";
import { useDataset } from "../hooks/useDataset";

export default function DataDetails() {
  const { splits, loading } = useDataset();

  if (loading) {
    return <div className="text-sm text-slate-400">Loading dataset...</div>;
  }

  return (
    <div className="space-y-6">
      <DataBreakdown splits={splits} />
    </div>
  );
}
