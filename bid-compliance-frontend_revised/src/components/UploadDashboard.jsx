import React, { useState, useRef, useCallback } from 'react';
import { UploadCloud, FileText, X, CheckCircle2, Loader2, AlertCircle, ArrowRight, Pencil } from 'lucide-react';
import TopBar from './TopBar';
import Footer from './Footer';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const deriveBidderName = (filename) =>
  filename.replace(/\.pdf$/i, '').replace(/^bidder_/i, '').replace(/_/g, ' ').toUpperCase();

function StepNumber({ n, done }) {
  return (
    <span
      className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm shrink-0
        ${done ? 'bg-india-green text-white' : 'bg-brand text-white'}`}
    >
      {done ? <CheckCircle2 className="w-4 h-4" /> : n}
    </span>
  );
}

function Dropzone({ active, onDragOver, onDrop, onClick, children }) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      className={`rounded-lg border-2 border-dashed transition-colors cursor-pointer p-8
        ${active ? 'border-brand bg-brand-tint' : 'border-line-strong hover:border-brand hover:bg-brand-tint/40'}`}
    >
      {children}
    </div>
  );
}

export default function UploadDashboard({ onComplete }) {
  const [tenderFile, setTenderFile] = useState(null);
  const [tenderError, setTenderError] = useState('');
  const [tenderDragActive, setTenderDragActive] = useState(false);
  const tenderInputRef = useRef(null);

  const [bidderFiles, setBidderFiles] = useState([]);
  const [bidderError, setBidderError] = useState('');
  const [bidderDragActive, setBidderDragActive] = useState(false);
  const bidderInputRef = useRef(null);

  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStatus, setSimulationStatus] = useState({});

  const acceptTenderFile = (f) => {
    if (!f) return;
    if (f.type !== 'application/pdf') {
      setTenderError('केवल PDF फ़ाइल स्वीकार की जाती है। Only PDF files are accepted.');
      return;
    }
    setTenderError('');
    setTenderFile(f);
  };

  const handleTenderDrop = (e) => {
    e.preventDefault();
    setTenderDragActive(false);
    acceptTenderFile(e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0]);
    if (e.target && e.target.value) e.target.value = '';
  };

  const handleBidderDrop = useCallback(
    (e) => {
      e.preventDefault();
      setBidderDragActive(false);
      setBidderError('');
      const files = Array.from(e.dataTransfer ? e.dataTransfer.files : e.target.files);

      let newBidders = [];
      let errorMsg = '';

      files.forEach((file) => {
        if (file.type !== 'application/pdf') {
          errorMsg = 'कुछ फ़ाइलें छोड़ दी गईं — केवल PDF स्वीकार्य है। Some files were skipped — only PDFs are accepted.';
          return;
        }
        if (bidderFiles.some((b) => b.file.name === file.name)) {
          errorMsg = 'डुप्लीकेट फ़ाइल छोड़ी गई। A duplicate file was skipped.';
          return;
        }
        newBidders.push({
          id: Math.random().toString(36).slice(2, 11),
          file,
          derivedName: deriveBidderName(file.name),
        });
      });

      if (errorMsg) setBidderError(errorMsg);
      if (newBidders.length > 0) setBidderFiles((prev) => [...prev, ...newBidders]);
      if (e.target && e.target.value) e.target.value = '';
    },
    [bidderFiles],
  );

  const handleRemoveBidder = (id) => setBidderFiles((prev) => prev.filter((b) => b.id !== id));
  const handleNameChange = (id, newName) =>
    setBidderFiles((prev) => prev.map((b) => (b.id === id ? { ...b, derivedName: newName } : b)));

  const handleRunAnalysis = () => {
    setIsSimulating(true);
    const initialStatus = {};
    bidderFiles.forEach((b) => (initialStatus[b.id] = 'pending'));
    setSimulationStatus(initialStatus);

    let currentIdx = 0;
    const runNext = () => {
      if (currentIdx >= bidderFiles.length) {
        setTimeout(() => {
          // TODO: swap this simulated pipeline for a real fetch() to the analysis backend.
          onComplete(bidderFiles);
        }, 700);
        return;
      }
      const currentBidder = bidderFiles[currentIdx];
      setSimulationStatus((prev) => ({ ...prev, [currentBidder.id]: 'running' }));
      setTimeout(() => {
        setSimulationStatus((prev) => ({ ...prev, [currentBidder.id]: 'done' }));
        currentIdx++;
        runNext();
      }, 1200);
    };
    runNext();
  };

  const canRun = tenderFile && bidderFiles.length > 0;

  return (
    <div className="min-h-screen bg-canvas font-sans text-ink flex flex-col">
      <TopBar subtitle="नई निविदा जांच शुरू करें · Start a new tender check" />

      <div className="flex-1 flex justify-center">
        <div className="max-w-2xl w-full flex flex-col gap-6 p-5 sm:p-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-ink">
              बोलीदाताओं की फ़ाइलें अपलोड करें
            </h1>
            <p className="text-ink-muted mt-1">
              Upload the bidders' files here. The system checks each one against the tender document and
              flags anything that needs your attention.
            </p>
          </div>

          {/* STEP 1 */}
          <section className="bg-surface border border-line rounded-lg shadow-sm p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <StepNumber n={1} done={!!tenderFile} />
              <div>
                <h2 className="text-base font-semibold text-ink">निविदा दस्तावेज़ अपलोड करें</h2>
                <p className="text-sm text-ink-muted">Upload the tender document (ATC / NIT) — the requirements bids are checked against.</p>
              </div>
            </div>

            {!tenderFile ? (
              <Dropzone
                active={tenderDragActive}
                onDragOver={(e) => {
                  e.preventDefault();
                  setTenderDragActive(true);
                }}
                onDrop={handleTenderDrop}
                onClick={() => tenderInputRef.current.click()}
              >
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <UploadCloud className="w-10 h-10 text-brand" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      tenderInputRef.current.click();
                    }}
                    className="px-5 py-2.5 rounded-md bg-brand hover:bg-brand-dark text-white font-medium text-sm"
                  >
                    फ़ाइल चुनें · Choose file
                  </button>
                  <p className="text-xs text-ink-faint">या यहाँ खींचें और छोड़ें · or drag and drop &nbsp;·&nbsp; PDF only, up to 50MB</p>
                </div>
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  ref={tenderInputRef}
                  onChange={handleTenderDrop}
                />
              </Dropzone>
            ) : (
              <div className="flex items-center justify-between gap-4 p-4 bg-brand-tint border border-brand/20 rounded-md">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-surface rounded text-brand shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-ink text-sm truncate">{tenderFile.name}</p>
                    <p className="text-xs text-ink-muted">{formatSize(tenderFile.size)}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setTenderFile(null);
                    setTenderError('');
                  }}
                  className="shrink-0 text-sm font-medium text-brand hover:text-brand-dark bg-surface px-3 py-1.5 rounded border border-brand/20 shadow-sm transition-colors"
                >
                  बदलें · Replace
                </button>
              </div>
            )}
            {tenderError && (
              <p className="text-sm text-fail flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {tenderError}
              </p>
            )}
          </section>

          {/* STEP 2 */}
          <section className="bg-surface border border-line rounded-lg shadow-sm p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <StepNumber n={2} done={bidderFiles.length > 0} />
                <div>
                  <h2 className="text-base font-semibold text-ink">बोलीदाता फ़ाइलें अपलोड करें</h2>
                  <p className="text-sm text-ink-muted">Upload every bidder's submission — select multiple files at once, or add them one by one.</p>
                </div>
              </div>
            </div>

            <Dropzone
              active={bidderDragActive}
              onDragOver={(e) => {
                e.preventDefault();
                setBidderDragActive(true);
              }}
              onDrop={handleBidderDrop}
              onClick={() => bidderFiles.length === 0 && bidderInputRef.current.click()}
            >
              {bidderFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 text-center">
                  <UploadCloud className="w-10 h-10 text-brand" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      bidderInputRef.current.click();
                    }}
                    className="px-5 py-2.5 rounded-md bg-brand hover:bg-brand-dark text-white font-medium text-sm"
                  >
                    फ़ाइलें चुनें · Choose files
                  </button>
                  <p className="text-xs text-ink-faint">या यहाँ खींचें और छोड़ें · or drag and drop, multiple at once &nbsp;·&nbsp; PDF only</p>
                </div>
              ) : (
                <div className="w-full flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                  {bidderFiles.map((bidder) => (
                    <div
                      key={bidder.id}
                      className="flex items-center justify-between gap-3 p-3 bg-surface border border-line rounded-md shadow-sm"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <FileText className="w-5 h-5 text-ink-faint shrink-0" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <label className="flex items-center gap-2 group">
                            <input
                              type="text"
                              value={bidder.derivedName}
                              onChange={(e) => handleNameChange(bidder.id, e.target.value)}
                              className="font-medium text-sm text-ink bg-transparent border-b border-transparent focus:border-brand focus:outline-none transition-colors w-full max-w-[16rem]"
                              title="Edit bidder name"
                              aria-label="Bidder name"
                            />
                            <Pencil className="w-3 h-3 text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </label>
                          <p className="text-xs text-ink-faint font-mono truncate">
                            {bidder.file.name} · {formatSize(bidder.file.size)}
                          </p>
                        </div>
                      </div>

                      {isSimulating ? (
                        <div className="w-24 flex justify-end shrink-0">
                          {simulationStatus[bidder.id] === 'pending' && (
                            <span className="text-xs font-medium text-ink-faint">प्रतीक्षा…</span>
                          )}
                          {simulationStatus[bidder.id] === 'running' && (
                            <span className="text-xs font-medium text-brand flex items-center gap-1.5">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> जांच जारी
                            </span>
                          )}
                          {simulationStatus[bidder.id] === 'done' && (
                            <span className="text-xs font-medium text-pass flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" /> पूर्ण
                            </span>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleRemoveBidder(bidder.id)}
                          aria-label={`Remove ${bidder.derivedName}`}
                          className="text-ink-faint hover:text-fail transition-colors p-1 shrink-0"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={() => bidderInputRef.current.click()}
                    className="mt-1 self-start text-sm font-medium text-brand hover:text-brand-dark flex items-center gap-1.5"
                  >
                    <UploadCloud className="w-4 h-4" /> और फ़ाइलें जोड़ें · Add more files
                  </button>
                </div>
              )}
              <input
                type="file"
                multiple
                accept="application/pdf"
                className="hidden"
                ref={bidderInputRef}
                onChange={handleBidderDrop}
              />
            </Dropzone>
            {bidderError && (
              <p className="text-sm text-fail flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {bidderError}
              </p>
            )}
          </section>

          {/* STEP 3 */}
          <section className="flex flex-col items-center gap-2 py-2">
            <button
              onClick={handleRunAnalysis}
              disabled={!canRun || isSimulating}
              className={`w-full sm:w-auto px-8 py-4 rounded-md font-semibold text-base flex items-center justify-center gap-2 transition-colors shadow-sm
                ${
                  !canRun || isSimulating
                    ? 'bg-surface-sunken text-ink-faint cursor-not-allowed'
                    : 'bg-india-green hover:brightness-95 text-white'
                }`}
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> जांच की जा रही है… Checking submissions…
                </>
              ) : (
                <>
                  जांच शुरू करें · Check {bidderFiles.length > 0 ? `${bidderFiles.length} ` : ''}bid
                  {bidderFiles.length === 1 ? '' : 's'}
                  {canRun && <ArrowRight className="w-4 h-4" />}
                </>
              )}
            </button>
            {!canRun && (
              <p className="text-xs text-ink-faint">पहले दोनों चरण पूरे करें · Complete both steps above to continue.</p>
            )}
          </section>
        </div>
      </div>

      <Footer />
    </div>
  );
}
