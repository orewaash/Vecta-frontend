// TODO: delete this file once /api/analyze returns real per-bidder results.
// UploadDashboard currently simulates the analysis step; this generator turns
// that simulation into a plausible, internally-consistent result per bidder
// so the review screen isn't showing identical numbers for every bidder.

const BASE_REQUIREMENTS = [
  { id: 'REQ-001', category: 'eligibility', label: 'Minimum average annual turnover' },
  { id: 'REQ-002', category: 'eligibility', label: 'OEM average annual turnover' },
  { id: 'REQ-003', category: 'documents', label: 'OEM Authorization Certificate' },
  { id: 'REQ-004', category: 'documents', label: 'Bidder Turnover Document' },
  { id: 'REQ-005', category: 'eligibility', label: 'Past performance certificate' },
  { id: 'TS-Dedicated_3D/4D', category: 'technical', label: 'Dedicated 3D/4D imaging' },
  { id: 'TS-Gel_Warmer', category: 'technical', label: 'Integrated gel warmer' },
  { id: 'TS-Depth,_cm', category: 'technical', label: 'Scan depth (cm)' },
  { id: 'TS-Transducer_Ports', category: 'technical', label: 'Transducer ports' },
  { id: 'TS-Touch_Screen', category: 'technical', label: 'Touchscreen control panel' },
  { id: 'TS-Battery_Backup', category: 'technical', label: 'Battery backup' },
  { id: 'TS-Monitor_Size', category: 'technical', label: 'Monitor size' },
  { id: 'TS-Weight', category: 'technical', label: 'Unit weight' },
  { id: 'TS-DICOM', category: 'technical', label: 'DICOM 3.0 compliance' },
  { id: 'TS-Elastography', category: 'technical', label: 'Elastography module' },
  { id: 'POLICY-001', category: 'policy', label: 'Minimum local content' },
  { id: 'POLICY-002', category: 'policy', label: 'Valid Udyam registration' },
];

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const REASON_BANK = {
  COMPLIANT: (label) => `Bidder's submission meets the stated requirement for ${label.toLowerCase()}.`,
  NON_COMPLIANT: (label) => `Bidder's submission does not meet the stated requirement for ${label.toLowerCase()}.`,
};

const REVIEW_BANK = [
  'No quantified figure found in the submitted document — confirm manually.',
  'Extraction found insufficient evidence to confirm or deny compliance.',
  "Bidder's stated value uses ambiguous or non-standard units.",
  'Conflicting values found across two sections of the same document.',
];

export function generateMockResult(bidder) {
  const seed = hashSeed(bidder.derivedName || bidder.id || 'bidder');
  const rand = mulberry32(seed);

  const lineItems = BASE_REQUIREMENTS.map((req) => {
    const roll = rand();
    let verdict = 'COMPLIANT';
    if (roll < 0.16) verdict = 'NON_COMPLIANT';
    else if (roll < 0.34) verdict = 'INCONCLUSIVE';

    const item = {
      requirement_id: req.id,
      category: req.category,
      label: req.label,
      verdict,
    };

    if (verdict === 'INCONCLUSIVE') {
      item.review_reason = REVIEW_BANK[Math.floor(rand() * REVIEW_BANK.length)];
      item.requires_human_review = true;
    } else {
      item.reason = REASON_BANK[verdict](req.label);
      if (verdict === 'NON_COMPLIANT' && rand() < 0.5) {
        item.requires_human_review = true;
        item.review_reason = 'Automated verdict — confirm before rejecting on this basis.';
      }
    }

    if (req.id === 'REQ-001') {
      item.evidence = {
        tender: { page: 1, text: 'Minimum Average Annual Turnover of the bidder over the last 3 financial years shall not be less than Rs. 35,00,000.' },
        bidder: { page: 1, text: `Average Annual Turnover (FY22–24) as certified by chartered accountant: Rs. ${(30 + Math.floor(rand() * 25))},00,000.` },
      };
    }

    return item;
  });

  const compliant = lineItems.filter((i) => i.verdict === 'COMPLIANT').length;
  const nonCompliant = lineItems.filter((i) => i.verdict === 'NON_COMPLIANT').length;
  const inconclusive = lineItems.filter((i) => i.verdict === 'INCONCLUSIVE').length;
  const total = lineItems.length;
  const complianceScore = Math.round((compliant / total) * 1000) / 10;

  const failedMandatory = lineItems
    .filter((i) => i.verdict === 'NON_COMPLIANT' && (i.category === 'documents' || i.category === 'policy'))
    .map((i) => i.requirement_id);

  const mandatoryHardFail = failedMandatory.length > 0;
  const riskLevel = mandatoryHardFail || complianceScore < 50 ? 'High' : complianceScore < 80 ? 'Medium' : 'Low';

  return {
    bid_id: `GEM/2026/B/${(7800000 + (seed % 90000)).toString()}`,
    bidder_name: bidder.derivedName,
    summary: { compliant, non_compliant: nonCompliant, inconclusive, total },
    compliance_score: complianceScore,
    risk_level: riskLevel,
    mandatory_hard_fail: mandatoryHardFail,
    failed_mandatory_requirements: failedMandatory,
    recommendation: mandatoryHardFail
      ? `Non-compliant — ${nonCompliant} requirement(s) failed. Recommend rejection pending review.`
      : inconclusive > 0
        ? `Provisionally compliant — ${inconclusive} item(s) need officer confirmation before award.`
        : 'Compliant — no mandatory requirements failed.',
    line_items: lineItems,
  };
}
