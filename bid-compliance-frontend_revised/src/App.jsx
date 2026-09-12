import React, { useState } from 'react';
import UploadDashboard from './components/UploadDashboard';
import BidDashboard from './components/BidDashboard';

export default function App() {
  const [view, setView] = useState('upload'); // 'upload' | 'results'
  const [analyzedBidders, setAnalyzedBidders] = useState([]);
  const [activeBidderId, setActiveBidderId] = useState(null);

  const handleAnalysisComplete = (bidders) => {
    setAnalyzedBidders(bidders);
    setActiveBidderId(bidders[0]?.id ?? null);
    setView('results');
  };

  const handleBackToUpload = () => {
    setView('upload');
    setAnalyzedBidders([]);
    setActiveBidderId(null);
  };

  if (view === 'upload' || analyzedBidders.length === 0) {
    return <UploadDashboard onComplete={handleAnalysisComplete} />;
  }

  return (
    <BidDashboard
      bidders={analyzedBidders}
      activeBidderId={activeBidderId}
      onSelectBidder={setActiveBidderId}
      onBack={handleBackToUpload}
    />
  );
}
