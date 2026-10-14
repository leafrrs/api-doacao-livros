import React from 'react';
import { BookOpen, Moon, Sun, User, LogIn, LogOut, PlusCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, clearAuth } from '../services/api';

export default function Header({ darkMode, setDarkMode, onAuthChange }) {
  const usuario = getCurrentUser();
  const navigate = useNavigate();

  function handleLogout() {
    clearAuth();
    if (onAuthChange) onAuthChange();
    navigate('/');
  }

  return (
    <header className="reconecta-header">
      <div className="header-container">
        {/* Lado Esquerdo: Logo e Nome do App */}
        <Link to="/" className="logo-brand">
          <BookOpen className="brand-icon" size={28} />
          <div className="brand-text">
            <span className="brand-title">Reconecta</span>
            <span className="brand-badge">ODS 4</span>
          </div>
        </Link>

        {/* Centro e Direita: Ações, Dark Mode e Usuário */}
        <div className="header-actions">
          {/* Alternador de Dark Mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="btn-theme-toggle"
            title={darkMode ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
            aria-label="Alternar tema"
          >
            {darkMode ? <Sun size={20} className="icon-sun" /> : <Moon size={20} className="icon-moon" />}
          </button>

          {/* Área do Usuário / Login */}
          {usuario ? (
            <div className="user-profile-menu">
              <div className="user-info-chip">
                <div className="avatar-mini">
                  {usuario.nome ? usuario.nome[0].toUpperCase() : 'U'}
                </div>
                <div className="user-details">
                  <span className="user-name">{usuario.nome}</span>
                  <span className="user-role">{usuario.role === 'ADMIN' ? 'Admin' : 'Leitor'}</span>
                </div>
              </div>
              <button onClick={handleLogout} className="btn-logout" title="Sair da conta">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn-login">
              <LogIn size={18} />
              <span>Entrar</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
