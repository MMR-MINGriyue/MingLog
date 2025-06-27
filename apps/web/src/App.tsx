import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@minglog/ui';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SimpleHome } from './pages/SimpleHome';
import { PagesPage } from './pages/PagesPage';
import { JournalsPage } from './pages/JournalsPage';
import { SearchPage } from './pages/SearchPage';
import { GraphPage } from './pages/GraphPage';
import { TestPage } from './pages/TestPage';
import { SimpleTest } from './pages/SimpleTest';
import '@minglog/ui/styles';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<SimpleHome />} />
              <Route path="home" element={<HomePage />} />
              <Route path="pages" element={<PagesPage />} />
              <Route path="journals" element={<JournalsPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="test" element={<TestPage />} />
              <Route path="simple" element={<SimpleTest />} />
              <Route path="graph" element={<GraphPage />} />
              <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
            </Route>
          </Routes>
        </Router>
      </ToastProvider>
    </QueryClientProvider>
  );
}

export default App;
