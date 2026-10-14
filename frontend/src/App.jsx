import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import RegisterUser from './pages/RegisterUser';
import RegisterBook from './pages/RegisterBook';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  const [authKey, setAuthKey] = useState(0);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <BrowserRouter>
      <div className={`app-root ${darkMode ? 'theme-dark' : 'theme-light'}`}>
        <Header
          key={authKey}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          onAuthChange={() => setAuthKey(prev => prev + 1)}
        />

        <div className="app-main-content">
          <Routes>
            <Route path="/" element={<Home key={authKey} />} />
            <Route path="/login" element={<Login onLoginSuccess={() => setAuthKey(prev => prev + 1)} />} />
            <Route path="/cadastro" element={<RegisterUser />} />
            <Route path="/doar" element={<RegisterBook />} />
          </Routes>
        </div>

        <Footer />
      </div>
    </BrowserRouter>
  );
}
