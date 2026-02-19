import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScenarioProvider } from './context/ScenarioContext';
import { SimulationProvider } from './context/SimulationContext';
import { TradingProvider } from './context/TradingContext';
import { SocialProvider } from './context/SocialContext';
import { ToastProvider } from './components/Toast';
import { OnboardingProvider } from './components/Onboarding';
import Layout from './components/Layout';
import Timeline from './pages/Timeline';
import Market from './pages/Market';
import Portfolio from './pages/Portfolio';
import Watchlist from './pages/Watchlist';
import Leaderboard from './pages/Leaderboard';
import Mission from './pages/Mission';
import PlayerDetail from './pages/PlayerDetail';
import ScenarioInspector from './pages/ScenarioInspector';
import Onboarding from './components/Onboarding';
import PlayoffAnnouncementModal from './components/PlayoffAnnouncementModal';
import './App.css';

function App() {
  return (
    <ScenarioProvider>
      <SimulationProvider>
        <TradingProvider>
          <SocialProvider>
            <ToastProvider>
              <OnboardingProvider>
                <BrowserRouter>
                  <Onboarding />
                  <PlayoffAnnouncementModal />
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Timeline />} />
                      <Route path="market" element={<Market />} />
                      <Route path="portfolio" element={<Portfolio />} />
                      <Route path="watchlist" element={<Watchlist />} />
                      <Route path="mission" element={<Mission />} />
                      <Route path="leaderboard" element={<Leaderboard />} />
                      <Route path="player/:playerId" element={<PlayerDetail />} />
                    </Route>
                    <Route path="/inspector" element={<ScenarioInspector />} />
                  </Routes>
                </BrowserRouter>
              </OnboardingProvider>
            </ToastProvider>
          </SocialProvider>
        </TradingProvider>
      </SimulationProvider>
    </ScenarioProvider>
  );
}

export default App;
