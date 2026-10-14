import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, Moon, Sun, User, LogIn, LogOut, ChevronDown, Palette, Lock } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, clearAuth } from '../services/api';
import UserProfileModal from './UserProfileModal';

export default function Header({ darkMode, setDarkMode, onAuthChange }) {
  const usuario = getCurrentUser();
  const navigate = useNavigate();

  const [menuAberto, setMenuAberto] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalAba, setModalAba] = useState('perfil'); // 'perfil' ou 'dados'
  const dropdownRef = useRef(null);

  // Fecha o dropdown se clicar fora dele
  useEffect(() => {
    function handleClickFora(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuAberto(false);
      }
    }
    document.addEventListener('mousedown', handleClickFora);
    return () => document.removeEventListener('mousedown', handleClickFora);
  }, []);

  function handleLogout() {
    clearAuth();
    setMenuAberto(false);
    if (onAuthChange) onAuthChange();
    navigate('/');
  }

  function abrirModal(aba) {
    setModalAba(aba);
    setModalAberto(true);
    setMenuAberto(false);
  }

  return (
    <>
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
              <div className="user-profile-menu" ref={dropdownRef}>
                {/* Botão do Usuário ao lado do Sair: Clicável para abrir opções */}
                <button
                  type="button"
                  className={`user-info-chip-btn ${menuAberto ? 'active' : ''}`}
                  onClick={() => setMenuAberto(!menuAberto)}
                  title="Abrir opções de Perfil e Dados do Leitor"
                  aria-expanded={menuAberto}
                >
                  <div className="avatar-mini">
                    {usuario.fotoUrl ? (
                      <img src={usuario.fotoUrl} alt={usuario.nome} className="avatar-mini-img" />
                    ) : (
                      usuario.nome ? usuario.nome[0].toUpperCase() : 'U'
                    )}
                  </div>
                  <div className="user-details">
                    <span className="user-name">{usuario.nome}</span>
                    <span className="user-role">{usuario.role === 'ADMIN' ? 'Admin' : 'Leitor'}</span>
                  </div>
                  <ChevronDown size={14} className={`chip-chevron ${menuAberto ? 'open' : ''}`} />
                </button>

                {/* Dropdown de opções rápidas */}
                {menuAberto && (
                  <div className="user-dropdown-menu">
                    <div className="dropdown-user-header">
                      <strong>{usuario.nome}</strong>
                      <small>{usuario.email}</small>
                    </div>
                    <div className="dropdown-divider" />
                    
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => abrirModal('perfil')}
                    >
                      <Palette size={16} className="dropdown-item-icon" />
                      <div>
                        <span>Editar Perfil</span>
                        <small className="dropdown-item-desc">Foto, bio e cores</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => abrirModal('dados')}
                    >
                      <User size={16} className="dropdown-item-icon" />
                      <div>
                        <span>Dados do Leitor</span>
                        <small className="dropdown-item-desc">Nome, e-mail e nível</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => abrirModal('seguranca')}
                    >
                      <Lock size={16} className="dropdown-item-icon" />
                      <div>
                        <span>Segurança</span>
                        <small className="dropdown-item-desc">Trocar senha e conta</small>
                      </div>
                    </button>

                    <div className="dropdown-divider" />

                    <button
                      type="button"
                      className="dropdown-item dropdown-item-danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} className="dropdown-item-icon" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                )}
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

      {/* Modal Unificado de Perfil e Dados do Leitor */}
      {modalAberto && usuario && (
        <UserProfileModal
          usuario={usuario}
          abaInicial={modalAba}
          onClose={() => setModalAberto(false)}
          onUsuarioAtualizado={() => {
            if (onAuthChange) onAuthChange();
          }}
        />
      )}
    </>
  );
}
