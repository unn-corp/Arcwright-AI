import { BrowserRouter, Routes, Route, useLocation } from 'react-router';
import Nav from './components/Nav';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import TeamsPage from './pages/TeamsPage';
import AgentsPage from './pages/AgentsPage';
import SkillsPage from './pages/SkillsPage';
import WorkflowsPage from './pages/WorkflowsPage';
import TmuxPage from './pages/TmuxPage';
import IDEsPage from './pages/IDEsPage';
import NotFoundPage from './pages/NotFoundPage';

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-enter">
      <Routes location={location}>
        <Route path="/" element={<HomePage />} />
        <Route path="/teams" element={<TeamsPage />} />
        <Route path="/agents" element={<AgentsPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/workflows" element={<WorkflowsPage />} />
        <Route path="/ides" element={<IDEsPage />} />
        <Route path="/herdr" element={<TmuxPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

function Layout() {
  return (
    <div className="min-h-screen bg-bg text-foreground">
      {/* Skip link for accessibility */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-cta focus:text-bg focus:px-4 focus:py-2 focus:rounded focus:font-sans focus:text-sm focus:font-semibold"
      >
        Skip to main content
      </a>

      <Nav />

      <main id="main" className="scroll-mt-28 lg:scroll-mt-16">
        <AnimatedRoutes />
      </main>

      <Footer />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
