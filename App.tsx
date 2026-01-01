import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import { LanguageProvider } from './contexts/LanguageContext';
import { LandingPage } from './src/pages/LandingPage';
import { Dashboard } from './src/pages/Dashboard';
import { LegalPage } from './src/pages/Legal';
import {
  SocialMediaWrapper,
  AdCreativeWrapper,
  LandingPageToolWrapper,
  AdminWrapper
} from './src/pages/ToolWrappers';

const App: React.FC = () => {
  return (
    <Router>
      <LanguageProvider>
        <Routes>
          {/* Main Landing Page at Root Domain */}
          <Route path="/" element={<LandingPage />} />

          {/* Main Application Interface with Nested Routes */}
          <Route path="/app" element={<Dashboard />}>
            <Route index element={<Navigate to="social-media" replace />} />
            <Route path="social-media" element={<SocialMediaWrapper />} />
            <Route path="ad-creative" element={<AdCreativeWrapper />} />
            <Route path="landing-page" element={<LandingPageToolWrapper />} />
            <Route path="admin" element={<AdminWrapper />} />
          </Route>

          {/* Authentication Routes - redirect to app which handles auth */}
          <Route path="/login" element={<Navigate to="/app" replace />} />
          <Route path="/signup" element={<Navigate to="/app" replace />} />

          {/* Legal Pages with Multilingual Support */}
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />

          {/* Fallback for 404 - Redirect to Home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LanguageProvider>
    </Router>
  );
};

export default App;