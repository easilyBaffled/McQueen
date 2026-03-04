import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ScenarioProvider } from './context/ScenarioContext';
import { SimulationProvider } from './context/SimulationContext';
import { EspnProvider } from './context/EspnContext';
import { TradingProvider } from './context/TradingContext';
import { SocialProvider } from './context/SocialContext';
import { ToastProvider } from './components/Toast/ToastProvider';
import { OnboardingProvider } from './components/Onboarding/OnboardingProvider';
import Layout from './components/Layout/Layout';
import Onboarding from './components/Onboarding/Onboarding';
import PlayoffAnnouncementModal from './components/PlayoffAnnouncementModal/PlayoffAnnouncementModal';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { MarketSkeleton } from './shared';
import './App.css';

const Timeline = lazy(() => import('./pages/Timeline/Timeline'));
const Market = lazy(() => import('./pages/Market/Market'));
const Portfolio = lazy(() => import('./pages/Portfolio/Portfolio'));
const Watchlist = lazy(() => import('./pages/Watchlist/Watchlist'));
const Leaderboard = lazy(() => import('./pages/Leaderboard/Leaderboard'));
const Mission = lazy(() => import('./pages/Mission/Mission'));
const PlayerDetail = lazy(() => import('./pages/PlayerDetail/PlayerDetail'));
const ScenarioInspector = lazy(
  () => import('./pages/ScenarioInspector/ScenarioInspector'),
);

function PageFallback() {
  return <MarketSkeleton count={3} />;
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageFallback />}>{children}</Suspense>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <ScenarioProvider>
      <SimulationProvider>
        <EspnProvider>
        <TradingProvider>
          <SocialProvider>
            <ToastProvider>
              <OnboardingProvider>
                <BrowserRouter>
                  <Onboarding />
                  <PlayoffAnnouncementModal />
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route
                        index
                        element={
                          <LazyPage>
                            <Timeline />
                          </LazyPage>
                        }
                      />
                      <Route
                        path="market"
                        element={
                          <LazyPage>
                            <Market />
                          </LazyPage>
                        }
                      />
                      <Route
                        path="portfolio"
                        element={
                          <LazyPage>
                            <Portfolio />
                          </LazyPage>
                        }
                      />
                      <Route
                        path="watchlist"
                        element={
                          <LazyPage>
                            <Watchlist />
                          </LazyPage>
                        }
                      />
                      <Route
                        path="mission"
                        element={
                          <LazyPage>
                            <Mission />
                          </LazyPage>
                        }
                      />
                      <Route
                        path="leaderboard"
                        element={
                          <LazyPage>
                            <Leaderboard />
                          </LazyPage>
                        }
                      />
                      <Route
                        path="player/:playerId"
                        element={
                          <LazyPage>
                            <PlayerDetail />
                          </LazyPage>
                        }
                      />
                    </Route>
                    <Route
                      path="/inspector"
                      element={
                        <LazyPage>
                          <ScenarioInspector />
                        </LazyPage>
                      }
                    />
                  </Routes>
                </BrowserRouter>
              </OnboardingProvider>
            </ToastProvider>
          </SocialProvider>
        </TradingProvider>
        </EspnProvider>
      </SimulationProvider>
    </ScenarioProvider>
  );
}

export default App;
