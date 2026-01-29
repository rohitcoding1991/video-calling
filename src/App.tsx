import { SocketProvider, useSocket } from './context/socket-context';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import JoinPage from './pages/join-page';
import HomePage from './pages/home-page';

function AppContent() {
  const { isConnected, currentUser } = useSocket();

  if (!isConnected || !currentUser) {
    return <JoinPage />;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SocketProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
        <Toaster richColors position="top-center" />
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;