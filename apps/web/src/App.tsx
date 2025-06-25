import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
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
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="pages" element={<div>All Pages (Coming Soon)</div>} />
            <Route path="journals" element={<div>Journals (Coming Soon)</div>} />
            <Route path="graph" element={<div>Graph View (Coming Soon)</div>} />
            <Route path="settings" element={<div>Settings (Coming Soon)</div>} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
