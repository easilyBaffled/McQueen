import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import './PlayoffAnnouncementModal.css';

// Mock portfolio showing user holdings for buyback players (for demonstration)
const MOCK_BUYBACK_HOLDINGS = {
  'diggs-s': { shares: 5, avgCost: 85 },
  'stroud': { shares: 8, avgCost: 130 },
  'lamb': { shares: 3, avgCost: 112 },
  'hill': { shares: 6, avgCost: 118 }
};

// Dilution percentage for playoff players
const DILUTION_PERCENT = 15;

export default function PlayoffAnnouncementModal() {
  const { scenario, currentData, applyPlayoffDilution, playoffDilutionApplied } = useGame();
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState(0);

  // Get players from current scenario data
  const players = currentData?.players || [];
  
  // Separate buyback players from playoff players
  const buybackPlayers = players.filter(p => p.isBuyback);
  const playoffPlayers = players.filter(p => !p.isBuyback);

  // Calculate buyback amounts for mock portfolio
  const buybackDetails = buybackPlayers.map(player => {
    const holding = MOCK_BUYBACK_HOLDINGS[player.id];
    const currentPrice = player.priceHistory?.[player.priceHistory.length - 1]?.price || player.basePrice;
    
    return {
      id: player.id,
      name: player.name,
      team: player.team,
      position: player.position,
      buybackPrice: currentPrice,
      shares: holding?.shares || 0,
      avgCost: holding?.avgCost || 0,
      proceeds: holding ? currentPrice * holding.shares : 0,
      loss: holding ? (holding.avgCost - currentPrice) * holding.shares : 0
    };
  });

  const totalBuybackProceeds = buybackDetails.reduce((sum, p) => sum + p.proceeds, 0);
  const totalBuybackLoss = buybackDetails.reduce((sum, p) => sum + p.loss, 0);

  // Calculate dilution impact for playoff players
  const dilutionDetails = playoffPlayers.slice(0, 8).map(player => {
    const currentPrice = player.priceHistory?.[player.priceHistory.length - 1]?.price || player.basePrice;
    const dilutedPrice = currentPrice * (1 - DILUTION_PERCENT / 100);
    
    return {
      id: player.id,
      name: player.name,
      team: player.team,
      position: player.position,
      currentPrice,
      dilutedPrice,
      priceChange: dilutedPrice - currentPrice,
      percentChange: -DILUTION_PERCENT
    };
  });

  // Show modal when switching to playoffs scenario
  useEffect(() => {
    if (scenario === 'playoffs' && !playoffDilutionApplied) {
      setIsVisible(true);
      setStep(0);
    } else {
      setIsVisible(false);
    }
  }, [scenario, playoffDilutionApplied]);

  const handleNext = () => {
    if (step === 0) {
      setStep(1);
    } else {
      // Apply dilution and close modal
      applyPlayoffDilution(DILUTION_PERCENT);
      setIsVisible(false);
    }
  };

  const handleClose = () => {
    // Apply dilution even if user closes early
    if (!playoffDilutionApplied) {
      applyPlayoffDilution(DILUTION_PERCENT);
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="playoff-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="playoff-modal"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          <div className="playoff-modal-header">
            <div className="step-indicators">
              <span className={`step-dot ${step === 0 ? 'active' : ''} ${step > 0 ? 'completed' : ''}`} />
              <span className={`step-dot ${step === 1 ? 'active' : ''}`} />
            </div>
            <button className="close-btn" onClick={handleClose}>×</button>
          </div>

          <AnimatePresence mode="wait">
            {step === 0 ? (
              <motion.div
                key="buyback"
                className="playoff-modal-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="modal-icon">💰</div>
                <h2 className="modal-title">Season-End Buyback</h2>
                <p className="modal-subtitle">Eliminated Players Being Bought Back</p>
                <p className="modal-description">
                  The following players' teams have been eliminated from playoff contention. 
                  McQueen Market is offering a mandatory buyback at the current market price.
                </p>

                <div className="player-list buyback-list">
                  <div className="list-header">
                    <span>Player</span>
                    <span>Your Shares</span>
                    <span>Buyback Price</span>
                    <span>Proceeds</span>
                  </div>
                  {buybackDetails.map(player => (
                    <div key={player.id} className="player-row">
                      <div className="player-info">
                        <span className="player-name">{player.name}</span>
                        <span className="player-meta">{player.team} · {player.position}</span>
                      </div>
                      <span className="shares">{player.shares > 0 ? player.shares : '—'}</span>
                      <span className="price">${player.buybackPrice.toFixed(2)}</span>
                      <span className={`proceeds ${player.proceeds > 0 ? 'positive' : ''}`}>
                        {player.proceeds > 0 ? `+$${player.proceeds.toFixed(2)}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>

                {totalBuybackProceeds > 0 && (
                  <div className="buyback-summary">
                    <div className="summary-row">
                      <span>Total Buyback Proceeds</span>
                      <span className="total-positive">+${totalBuybackProceeds.toFixed(2)}</span>
                    </div>
                    <div className="summary-row loss">
                      <span>Total Loss from Original Cost</span>
                      <span className="total-negative">-${totalBuybackLoss.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="dilution"
                className="playoff-modal-content"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="modal-icon">📈</div>
                <h2 className="modal-title">Playoff Stock Issuance</h2>
                <p className="modal-subtitle">Additional Shares Released</p>
                <p className="modal-description">
                  To increase market liquidity during the playoffs, McQueen Market is issuing 
                  <strong> {DILUTION_PERCENT}% additional shares</strong> for all remaining playoff players. 
                  This dilution will affect current share values.
                </p>

                <div className="player-list dilution-list">
                  <div className="list-header">
                    <span>Player</span>
                    <span>Current</span>
                    <span>After Issuance</span>
                    <span>Change</span>
                  </div>
                  {dilutionDetails.map(player => (
                    <div key={player.id} className="player-row">
                      <div className="player-info">
                        <span className="player-name">{player.name}</span>
                        <span className="player-meta">{player.team} · {player.position}</span>
                      </div>
                      <span className="price">${player.currentPrice.toFixed(2)}</span>
                      <span className="price diluted">${player.dilutedPrice.toFixed(2)}</span>
                      <span className="change negative">
                        {player.percentChange.toFixed(1)}%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="dilution-note">
                  <span className="note-icon">ℹ️</span>
                  <span>
                    This affects all {playoffPlayers.length} playoff-bound players. 
                    New shares will be available for purchase on the market.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="playoff-modal-footer">
            <button className="action-btn" onClick={handleNext}>
              {step === 0 ? 'Continue' : 'Got It'}
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
              </svg>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


