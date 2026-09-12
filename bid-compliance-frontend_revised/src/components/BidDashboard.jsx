import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Flag,
  ChevronRight,
  ChevronLeft,
  FileText,
  ShieldCheck,
  Settings2,
  ArrowLeft,
} from 'lucide-react';
import ScoreGauge from './ScoreGauge';
import { generateMockResult } from '../lib/mockResult';

const VERDICT_STYLES = {
  COMPLIANT: { tint: 'bg-pass-tint', text: 'text-pass', line: 'border-pass-line', Icon: CheckCircle2 },
  NON_COMPLIANT: { tint: 'bg-fail-tint', text: 'text-fail', line: 'border-fail-line', Icon: XCircle },
  INCONCLUSIVE: { tint: 'bg-review-tint', text: 'text-review', line: 'border-review-line', Icon: AlertTriangle },
};

const RISK_STYLES = {
  Low: 'bg-pass-tint text-pass border-pass-line',
  Medium: 'bg-review-tint text-review border-review-line',
  High: 'bg-fail-tint text-fail border-fail-line',
};

function VerdictBadge({ verdict, size = 'sm' }) {
  const s = VERDICT_STYLES[verdict] || VERDICT_STYLES.INCONCLUSIVE;
  const Icon = s.Icon;
  const padding = size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-sm';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-medium ${padding} ${s.tint} ${s.text} ${s.line}`}>
      <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      {verdict.replace('_', '-')}
    </span>
  );
}

export default function BidDashboard({ bidders, activeBidderId, onSelectBidder, onBack }) {
  const activeBidder = bidders.find((b) => b.id === activeBidderId) || bidders[0];
  const data = useMemo(() => generateMockResult(activeBidder), [activeBidder]);

  const [selectedItemId, setSelectedItemId] = useState(data.line_items[0]?.requirement_id);
  const selectedItem = data.line_items.find((item) => item.requirement_id === selectedItemId) || data.line_items[0];

  const [mobilePane, setMobilePane] = useState('list'); // 'summary' | 'list' | 'detail'

  const categories = { documents: { total: 0, passed: 0 }, eligibility: { total: 0, passed: 0 }, technical: { total: 0, passed: 0 } };
  data.line_items.forEach((item) => {
    const cat = categories[item.category] ? item.category : 'eligibility';
    categories[cat].total++;
    if (item.verdict === 'COMPLIANT') categories[cat].passed++;
  });

  const pendingActions = data.line_items.filter((item) => item.requires_human_review || item.verdict === 'INCONCLUSIVE');

  const selectItem = (id) => {
    setSelectedItemId(id);
    setMobilePane('detail');
  };

  return (
    <div className="flex flex-col h-screen bg-canvas text-sm text-ink font-sans overflow-hidden">
      {/* Tricolour identity strip, matching the upload screen */}
      <div className="h-1.5 flex shrink-0">
        <div className="flex-1 bg-saffron" />
        <div className="flex-1 bg-white border-y border-line" />
        <div className="flex-1 bg-india-green" />
      </div>
      {/* Header */}
      <div className="bg-surface border-b border-line px-4 py-3 shrink-0 shadow-sm z-10 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="p-2 rounded-md text-ink-muted hover:text-ink hover:bg-surface-sunken transition-colors shrink-0"
              aria-label="Start a new review"
              title="नई जांच शुरू करें · Start a new review"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-ink font-mono leading-tight">{data.bid_id}</h1>
              {bidders.length > 1 ? (
                <div className="flex flex-wrap gap-1.5 mt-1" role="tablist" aria-label="Select bidder">
                  {bidders.map((b) => (
                    <button
                      key={b.id}
                      role="tab"
                      aria-selected={b.id === activeBidder.id}
                      onClick={() => onSelectBidder(b.id)}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors
                        ${
                          b.id === activeBidder.id
                            ? 'bg-brand text-white border-brand'
                            : 'bg-surface text-ink-muted border-line hover:border-brand hover:text-brand'
                        }`}
                    >
                      {b.derivedName}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-ink-muted font-medium">{data.bidder_name}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ScoreGauge score={data.compliance_score} riskLevel={data.risk_level} />
            <div className="flex flex-col gap-1">
              <span className={`px-2.5 py-1 rounded-md border font-medium text-xs flex items-center gap-1.5 w-fit ${RISK_STYLES[data.risk_level]}`}>
                <ShieldCheck className="w-3.5 h-3.5" />
                {data.risk_level} risk · जोखिम
              </span>
              <span className="text-xs text-ink-faint">{data.summary.total} आवश्यकताएँ जाँची गईं · requirements checked</span>
            </div>
          </div>
        </div>

        {data.mandatory_hard_fail && (
          <div className="bg-fail-tint border-l-4 border-fail p-3 text-sm flex items-start gap-2 rounded-r-md">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-fail" />
            <p className="text-ink">
              <strong className="font-semibold">Mandatory requirements failed: </strong>
              {data.failed_mandatory_requirements.join(', ')}. {data.recommendation}
            </p>
          </div>
        )}
        {!data.mandatory_hard_fail && (
          <p className="text-xs text-ink-muted">{data.recommendation}</p>
        )}

        {/* Mobile pane switcher */}
        <div className="flex md:hidden gap-1 bg-surface-sunken rounded-md p-1 w-fit">
          {[
            ['summary', 'सारांश · Summary'],
            ['list', 'आवश्यकताएँ · Items'],
            ['detail', 'साक्ष्य · Evidence'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setMobilePane(key)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                mobilePane === key ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3-pane layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* PANE 1: Summaries & queue */}
        <div className={`w-full md:w-[27%] md:min-w-[300px] md:border-r border-line flex-col bg-canvas overflow-y-auto ${mobilePane === 'summary' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-5 flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-pass-tint border border-pass-line rounded p-3 flex flex-col items-center">
                <span className="text-xl font-semibold text-pass">{data.summary.compliant}</span>
                <span className="text-[11px] font-medium text-pass">Compliant</span>
              </div>
              <div className="bg-fail-tint border border-fail-line rounded p-3 flex flex-col items-center">
                <span className="text-xl font-semibold text-fail">{data.summary.non_compliant}</span>
                <span className="text-[11px] font-medium text-fail">Failed</span>
              </div>
              <div className="bg-review-tint border border-review-line rounded p-3 flex flex-col items-center">
                <span className="text-xl font-semibold text-review">{data.summary.inconclusive}</span>
                <span className="text-[11px] font-medium text-review text-center leading-tight">Needs review</span>
              </div>
            </div>

            <div className="bg-surface border border-line rounded-md shadow-sm overflow-hidden">
              <div className="px-3 py-2 border-b border-line">
                <h3 className="font-medium text-ink text-xs">Verification summary</h3>
              </div>
              <div className="flex flex-col text-sm">
                <div className="px-3 py-2.5 border-b border-line flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-muted"><FileText className="w-4 h-4" /> Documents</span>
                  <span className="font-mono text-xs font-medium">{categories.documents.passed}/{categories.documents.total}</span>
                </div>
                <div className="px-3 py-2.5 border-b border-line flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-muted"><ShieldCheck className="w-4 h-4" /> Eligibility</span>
                  <span className="font-mono text-xs font-medium">{categories.eligibility.passed}/{categories.eligibility.total}</span>
                </div>
                <div className="px-3 py-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-ink-muted"><Settings2 className="w-4 h-4" /> Technical specs</span>
                  <span className="font-mono text-xs font-medium">{categories.technical.passed}/{categories.technical.total}</span>
                </div>
              </div>
            </div>

            <div className="bg-surface border border-line rounded-md shadow-sm overflow-hidden flex flex-col">
              <div className="bg-review-tint px-3 py-2 border-b border-review-line flex justify-between items-center">
                <h3 className="font-medium text-review text-xs flex items-center gap-2">
                  <Flag className="w-3.5 h-3.5" /> कार्य सूची · Action queue
                </h3>
                <span className="text-[11px] font-semibold text-review bg-surface px-1.5 py-0.5 rounded">{pendingActions.length} लंबित · pending</span>
              </div>
              <div className="flex flex-col overflow-y-auto max-h-[320px]">
                {pendingActions.map((action) => (
                  <button
                    key={action.requirement_id}
                    onClick={() => selectItem(action.requirement_id)}
                    className="px-3 py-3 border-b border-line hover:bg-surface-sunken cursor-pointer flex flex-col gap-1 text-left transition-colors"
                  >
                    <span className="font-mono text-xs font-semibold text-ink">Verify: {action.requirement_id}</span>
                    <span className="text-xs text-ink-muted leading-snug line-clamp-2">
                      {action.review_reason || action.reason || 'Manual confirmation required.'}
                    </span>
                  </button>
                ))}
                {pendingActions.length === 0 && (
                  <div className="p-4 text-center text-ink-faint text-xs">Nothing pending — every item resolved automatically.</div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* PANE 2: Requirement list */}
        <div className={`w-full md:w-[35%] md:min-w-[340px] md:border-r border-line flex-col bg-surface ${mobilePane === 'list' ? 'flex' : 'hidden md:flex'}`}>
          <div className="p-4 border-b border-line bg-canvas flex justify-between items-center shrink-0">
            <h2 className="font-medium text-ink">मूल्यांकित आवश्यकताएँ · Evaluated requirements</h2>
            <span className="text-xs text-ink-faint">{data.summary.total} items</span>
          </div>

          <div className="overflow-y-auto flex-1">
            {data.line_items.map((item) => {
              const isSelected = item.requirement_id === selectedItem?.requirement_id;
              return (
                <button
                  key={item.requirement_id}
                  onClick={() => selectItem(item.requirement_id)}
                  className={`w-full text-left px-4 py-3.5 border-b border-line cursor-pointer transition-colors flex items-center justify-between gap-2 group
                    ${isSelected ? 'bg-brand-tint border-l-4 border-l-brand' : 'hover:bg-surface-sunken border-l-4 border-l-transparent'}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <VerdictBadge verdict={item.verdict} />
                    <span className={`font-mono text-xs truncate ${isSelected ? 'text-ink font-medium' : 'text-ink-muted'}`}>
                      {item.requirement_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.requires_human_review && <Flag className="w-3.5 h-3.5 text-review" />}
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-brand' : 'text-ink-faint group-hover:text-ink-muted'}`} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* PANE 3: Evidence inspector */}
        <div className={`w-full md:w-[38%] md:min-w-[400px] flex-col bg-canvas overflow-y-auto ${mobilePane === 'detail' ? 'flex' : 'hidden md:flex'}`}>
          <button
            onClick={() => setMobilePane('list')}
            className="md:hidden flex items-center gap-1.5 px-4 py-3 text-sm text-brand font-medium border-b border-line"
          >
            <ChevronLeft className="w-4 h-4" /> Back to requirements
          </button>

          {!selectedItem ? (
            <div className="flex-1 flex items-center justify-center text-ink-faint">
              <p>Select a requirement to view details</p>
            </div>
          ) : (
            <div className="p-6 flex flex-col gap-6">
              <div className="flex justify-between items-start gap-4 border-b border-line pb-4">
                <div>
                  <h2 className="text-lg font-semibold font-mono text-ink mb-2">{selectedItem.requirement_id}</h2>
                  {selectedItem.label && <p className="text-sm text-ink-muted mb-2">{selectedItem.label}</p>}
                  <VerdictBadge verdict={selectedItem.verdict} size="lg" />
                </div>
                {selectedItem.requires_human_review && (
                  <span className="flex items-center gap-1.5 bg-review-tint text-review border border-review-line px-2.5 py-1.5 rounded-md text-xs font-medium shrink-0">
                    <Flag className="w-3.5 h-3.5" /> Needs review
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {selectedItem.reason && (
                  <div className="bg-surface border border-line rounded-md p-4">
                    <h3 className="text-xs font-medium text-ink-faint mb-2">Automated reasoning</h3>
                    <p className="text-ink">{selectedItem.reason}</p>
                  </div>
                )}

                {selectedItem.review_reason && (
                  <div className="bg-review-tint border border-review-line rounded-md p-4">
                    <h3 className="text-xs font-medium text-review mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5" /> Why this needs a human look
                    </h3>
                    <p className="text-ink">{selectedItem.review_reason}</p>
                  </div>
                )}
              </div>

              {selectedItem.evidence && (
                <div className="mt-2">
                  <h3 className="text-xs font-medium text-ink-faint mb-3">Extracted evidence</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-line rounded-md overflow-hidden flex flex-col bg-surface">
                      <div className="bg-brand-tint border-b border-line px-3 py-2 flex justify-between items-center">
                        <span className="font-medium text-brand text-[11px]">Tender document</span>
                        {selectedItem.evidence.tender?.page && (
                          <span className="text-brand text-[10px] font-medium bg-surface px-1.5 py-0.5 rounded">Page {selectedItem.evidence.tender.page}</span>
                        )}
                      </div>
                      <div className="p-3.5 text-ink font-mono text-xs whitespace-pre-wrap leading-relaxed break-words h-full">
                        {selectedItem.evidence.tender?.text || <span className="text-ink-faint italic">No tender text extracted</span>}
                      </div>
                    </div>

                    <div className="border border-line rounded-md overflow-hidden flex flex-col bg-surface">
                      <div className="bg-surface-sunken border-b border-line px-3 py-2 flex justify-between items-center">
                        <span className="font-medium text-ink text-[11px]">Bidder document</span>
                        {selectedItem.evidence.bidder?.page && (
                          <span className="text-ink-muted text-[10px] font-medium bg-surface px-1.5 py-0.5 rounded">Page {selectedItem.evidence.bidder.page}</span>
                        )}
                      </div>
                      <div className="p-3.5 text-ink font-mono text-xs whitespace-pre-wrap leading-relaxed break-words h-full">
                        {selectedItem.evidence.bidder?.text || <span className="text-ink-faint italic">No bidder text extracted</span>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
