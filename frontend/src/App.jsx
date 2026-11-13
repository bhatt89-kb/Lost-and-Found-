import React, { useState } from 'react';
import Feed from './pages/Feed';
import MyActivity from './pages/MyActivity';
import AdminPage from './pages/AdminPage';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

const toastStyle = {
  background: '#ffffff',
  color: '#1c1c1c',
  border: '1.5px solid #dedede',
  borderRadius: 14,
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  fontFamily: "'Inter', system-ui, sans-serif",
  fontSize: '14px',
  fontWeight: 500,
};

function App() {
  const [view, setView] = useState('feed'); // 'feed' | 'mine' | 'admin'
  const goFeed = () => setView('feed');

  return (
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ style: toastStyle }} />
      {view === 'mine' && <MyActivity onBack={goFeed} />}
      {view === 'admin' && <AdminPage onBack={goFeed} />}
      {view === 'feed' && (
        <Feed onOpenMine={() => setView('mine')} onOpenAdmin={() => setView('admin')} />
      )}
    </AuthProvider>
  );
}

export default App;