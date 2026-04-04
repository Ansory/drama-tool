import React, { useState } from 'react';
import Settings from '../../Settings';
import UpdateNotification from '../../UpdateNotification';

const App = () => {
  const [activePage, setActivePage] = useState('home');

  return (
    <div className="app">
      {/* Notifikasi update — selalu tampil di atas jika ada update */}
      <UpdateNotification />

      {/* Navigasi sidebar */}
      <div className="sidebar">
        <div className="sidebar-logo">
          <h1>🎬 DramaTool</h1>
        </div>
        <nav className="sidebar-nav">
          <button
            className={activePage === 'home' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActivePage('home')}
          >
            🏠 Beranda
          </button>
          <button
            className={activePage === 'settings' ? 'nav-item active' : 'nav-item'}
            onClick={() => setActivePage('settings')}
          >
            ⚙️ Pengaturan
          </button>
        </nav>
      </div>

      {/* Konten utama */}
      <div className="main-content">
        {activePage === 'home' && (
          <div className="home-page">
            <h2>Selamat Datang di DramaTool</h2>
            <p>Pilih menu di sidebar untuk memulai.</p>
          </div>
        )}
        {activePage === 'settings' && <Settings />}
      </div>
    </div>
  );
};

export default App;
