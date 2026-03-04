import { describe, it, expect } from 'vitest';

// TC-022: barrel re-exports all modules including new ones
describe('services barrel exports', () => {
  it('re-exports priceResolver functions', async () => {
    const mod = await import('../index');
    expect(typeof mod.getEffectivePrice).toBe('function');
    expect(typeof mod.getCurrentPriceFromHistory).toBe('function');
    expect(typeof mod.getChangePercentFromHistory).toBe('function');
    expect(typeof mod.getMoveReasonFromHistory).toBe('function');
    expect(typeof mod.getLatestContentFromHistory).toBe('function');
    expect(typeof mod.getAllContentFromHistory).toBe('function');
  });

  it('re-exports simulationEngine exports', async () => {
    const mod = await import('../index');
    expect(typeof mod.TimelineSimulationEngine).toBe('function');
    expect(typeof mod.EspnSimulationEngine).toBe('function');
    expect(typeof mod.buildUnifiedTimeline).toBe('function');
  });

  it('re-exports storageService functions', async () => {
    const mod = await import('../index');
    expect(typeof mod.read).toBe('function');
    expect(typeof mod.write).toBe('function');
    expect(typeof mod.remove).toBe('function');
  });

  it('re-exports sentimentEngine functions', async () => {
    const mod = await import('../index');
    expect(typeof mod.analyzeSentiment).toBe('function');
    expect(typeof mod.getMagnitudeLevel).toBe('function');
    expect(typeof mod.getSentimentDescription).toBe('function');
  });

  it('re-exports espnService functions and constants', async () => {
    const mod = await import('../index');
    expect(typeof mod.fetchNFLNews).toBe('function');
    expect(typeof mod.fetchTeamNews).toBe('function');
    expect(typeof mod.fetchPlayerNews).toBe('function');
    expect(typeof mod.fetchScoreboard).toBe('function');
    expect(typeof mod.clearCache).toBe('function');
    expect(typeof mod.getCacheStats).toBe('function');
    expect(mod.NFL_TEAM_IDS).toBeDefined();
    expect(Object.keys(mod.NFL_TEAM_IDS).length).toBe(32);
  });

  it('re-exports priceCalculator functions', async () => {
    const mod = await import('../index');
    expect(typeof mod.calculateNewPrice).toBe('function');
    expect(typeof mod.calculatePriceImpact).toBe('function');
    expect(typeof mod.applyPriceImpact).toBe('function');
    expect(typeof mod.calculateCumulativeImpact).toBe('function');
    expect(typeof mod.createPriceHistoryEntry).toBe('function');
  });
});
