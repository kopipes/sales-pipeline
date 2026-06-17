import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react';
import { dealsApi } from '../../api/deals';
import { formatRupiah, formatDate } from '../../utils/format';
import type { Deal, FunnelStage } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import clsx from 'clsx';

interface Props {
  deal: Deal;
  stages: FunnelStage[];
  onBack: () => void;
  onDelete: () => void;
}

const STAGE_STYLE: Record<string, string> = {
  Lead: 'bg-slate-100 text-slate-700',
  Qualified: 'bg-blue-100 text-blue-700',
  Discovery: 'bg-teal-100 text-teal-700',
  Proposal: 'bg-yellow-100 text-yellow-700',
  Negotiation: 'bg-orange-100 text-orange-700',
  Won: 'bg-emerald-100 text-emerald-700',
  Lost: 'bg-red-100 text-red-700',
};

export default function DealDetail({ deal, stages, onBack, onDelete }: Props) {
  const { isAdmin, isManager, isCorporate } = useAuth();
  const qc = useQueryClient();
  const [note, setNote] = useState('');
  const [stageError, setStageError] = useState('');

  const canApprove = isAdmin || isManager || isCorporate;

  const changeStageMutation = useMutation({
    mutationFn: ({ stageId, note }: { stageId: string; note?: string }) =>
      dealsApi.changeStage(deal.id, stageId, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deals'] });
      onBack();
    },
    onError: (e: any) =>
      setStageError(e?.response?.data?.message ?? 'Gagal mengubah stage'),
  });

  const isAtRisk =
    deal.expectedClosingDate && new Date(deal.expectedClosingDate) < new Date() && !deal.stage?.isWon && !deal.stage?.isLost;

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 transition-colors">
        <ArrowLeft size={15} /> Kembali ke Pipeline
      </button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{deal.dealName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={clsx('badge', STAGE_STYLE[deal.stage?.name] ?? 'bg-gray-100 text-gray-600')}>
              {deal.stage?.name}
            </span>
            <span className="text-sm text-gray-400">{deal.dealType?.name}</span>
            {isAtRisk && (
              <span className="badge bg-red-100 text-red-700">At Risk</span>
            )}
          </div>
        </div>
        <button
          className="btn-danger"
          onClick={() => { if (confirm('Hapus deal ini?')) onDelete(); }}
          aria-label="Hapus deal"
        >
          <Trash2 size={14} /> Hapus
        </button>
      </div>

      {/* Main info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4 space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Detail</h3>
          <Row label="Company" value={deal.company?.name} />
          <Row label="Divisi" value={`${deal.division?.name} (${deal.division?.code})`} />
          <Row label="Owner" value={deal.salesRep?.fullName} />
          <Row label="Est. Value" value={formatRupiah(deal.estimatedValue)} />
          <Row label="Weighted Value" value={formatRupiah(deal.weightedValue)} />
          <Row label="Probabilitas" value={`${deal.probabilityPct}%`} />
          <Row label="Expected Close" value={formatDate(deal.expectedClosingDate)} />
          {deal.actualClosingDate && <Row label="Actual Close" value={formatDate(deal.actualClosingDate)} />}
        </div>

        {(deal.ipAssetName || deal.royaltyPct || deal.minimumGuarantee) && (
          <div className="card p-4 space-y-3">
            <h3 className="text-xs font-semibold text-blue-500 uppercase tracking-wide">IP Licensing</h3>
            {deal.ipAssetName && <Row label="IP Asset" value={deal.ipAssetName} />}
            {deal.royaltyPct != null && <Row label="Royalty" value={`${deal.royaltyPct}%`} />}
            {deal.minimumGuarantee != null && <Row label="Min. Guarantee" value={formatRupiah(deal.minimumGuarantee)} />}
          </div>
        )}

        {deal.remarks && (
          <div className="card p-4 sm:col-span-2">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Remarks</h3>
            <p className="text-sm text-gray-700">{deal.remarks}</p>
          </div>
        )}
      </div>

      {/* Stage change — only show active deals */}
      {!deal.stage?.isWon && !deal.stage?.isLost && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Ubah Stage</h3>
          <div className="flex flex-wrap gap-2">
            {stages.filter((s) => s.id !== deal.stageId).map((s) => {
              const isTerminal = s.isWon || s.isLost;
              const needsApproval = isTerminal && !canApprove;
              return (
                <button
                  key={s.id}
                  disabled={needsApproval || changeStageMutation.isPending}
                  title={needsApproval ? 'Butuh approval Manager/Admin' : ''}
                  onClick={() => changeStageMutation.mutate({ stageId: s.id, note: note || undefined })}
                  className={clsx(
                    'btn text-sm',
                    s.isWon ? 'btn-primary' : s.isLost ? 'btn-danger' : 'btn-secondary',
                    needsApproval && 'opacity-40 cursor-not-allowed',
                  )}
                >
                  {s.isWon && <CheckCircle size={13} />}
                  {s.isLost && <XCircle size={13} />}
                  {!isTerminal && <Clock size={13} />}
                  {s.name}
                </button>
              );
            })}
          </div>
          <div className="mt-3">
            <label className="label">Catatan perubahan stage (opsional)</label>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Alasan / catatan..." />
          </div>
          {stageError && <p className="text-sm text-red-600 mt-2">{stageError}</p>}
          {changeStageMutation.isPending && <div className="flex items-center gap-2 mt-2 text-sm text-gray-500"><Spinner size="sm" /> Memproses...</div>}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-start gap-2">
      <span className="text-xs text-gray-500 flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-800 font-medium text-right">{value}</span>
    </div>
  );
}
