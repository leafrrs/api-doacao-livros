import React, { useState } from 'react';
import { User, BookMarked, Gift, Heart, LogIn, BellRing, Trash2, Edit3, Camera, Palette, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest, setAuth } from '../services/api';

// Cores e Gradientes pré-definidos para o Banner superior
const CORES_BANNER = [
  { nome: 'Azul Reconecta', valor: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' },
  { nome: 'Verde Natureza', valor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { nome: 'Roxo Criativo', valor: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
  { nome: 'Laranja Caloroso', valor: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
  { nome: 'Rosa Suave', valor: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' },
  { nome: 'Escuro Minimalista', valor: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)' },
];

export default function UserSidebarCard({
  usuario,
  onUsuarioAtualizado,
  abaLateral,
  setAbaLateral,
  livrosPegos = [],
  livrosDoados = [],
  favoritos = [],
  onRemoverFavorito,
  onRedoarLivro,
  onExcluirLivro,
}) {
  const [editando, setEditando] = useState(false);
  const [bioInput, setBioInput] = useState(usuario?.bio || 'Amante da leitura transformando estantes paradas em pontes de conhecimento.');
  const [fotoUrlInput, setFotoUrlInput] = useState(usuario?.fotoUrl || '');
  const [corBannerEscolhida, setCorBannerEscolhida] = useState(usuario?.corBanner || CORES_BANNER[0].valor);
  const [salvando, setSalvando] = useState(false);

  if (!usuario) {
    return (
      <aside className="profile-card not-logged">
        <div className="avatar-placeholder">
          <User size={48} />
        </div>
        <h3>Bem-vindo ao Reconecta!</h3>
        <p className="bio-text">
          Faça login para pegar livros, acompanhar seus favoritos com notificações ativas e doar para a comunidade.
        </p>
        <Link to="/login" className="btn-primary-full">
          <LogIn size={18} />
          <span>Fazer Login / Cadastrar</span>
        </Link>
      </aside>
    );
  }

  // Salvar as alterações no backend
  async function handleSalvarPerfil(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const resposta = await apiRequest('/usuarios/perfil', {
        method: 'PATCH',
        body: JSON.stringify({
          bio: bioInput,
          fotoUrl: fotoUrlInput || null,
          corBanner: corBannerEscolhida,
        }),
      });

      // Atualiza o localStorage com os novos dados do perfil
      const token = localStorage.getItem('token');
      setAuth(token, resposta.usuario);
      if (onUsuarioAtualizado) onUsuarioAtualizado(resposta.usuario);
      setEditando(false);
    } catch (err) {
      alert(err.message || 'Erro ao atualizar perfil.');
    } finally {
      setSalvando(false);
    }
  }

  // Lista selecionada para renderizar abaixo dos botões
  let listaAtual = [];
  if (abaLateral === 'pegos') listaAtual = livrosPegos;
  if (abaLateral === 'doados') listaAtual = livrosDoados;
  if (abaLateral === 'favoritos') listaAtual = favoritos;

  return (
    <aside className="profile-card">
      {/* Banner superior colorido com a cor personalizada do usuário */}
      <div
        className="profile-header-banner"
        style={{ background: usuario.corBanner || corBannerEscolhida }}
      >
        {!editando && (
          <button
            className="btn-abrir-edicao"
            onClick={() => setEditando(true)}
            title="Personalizar foto, bio e cor do banner"
          >
            <Edit3 size={15} />
            <span>Editar Perfil</span>
          </button>
        )}
      </div>

      {/* Modal / Formulário de Edição rápida do Perfil */}
      {editando ? (
        <form onSubmit={handleSalvarPerfil} className="profile-edit-box">
          <div className="profile-edit-header">
            <h4>Personalizar Perfil</h4>
            <button
              type="button"
              className="btn-cancelar-edicao"
              onClick={() => setEditando(false)}
            >
              <X size={16} />
            </button>
          </div>

          <div className="edit-field-group">
            <label>
              <Palette size={14} /> Cor do Banner Superior:
            </label>
            <div className="color-palette-options">
              {CORES_BANNER.map((c, i) => (
                <button
                  key={i}
                  type="button"
                  className={`color-bubble ${corBannerEscolhida === c.valor ? 'selected' : ''}`}
                  style={{ background: c.valor }}
                  onClick={() => setCorBannerEscolhida(c.valor)}
                  title={c.nome}
                />
              ))}
            </div>
          </div>

          <div className="edit-field-group">
            <label>
              <Camera size={14} /> URL da Foto de Perfil:
            </label>
            <input
              type="url"
              value={fotoUrlInput}
              onChange={(e) => setFotoUrlInput(e.target.value)}
              placeholder="https://exemplo.com/sua-foto.jpg"
              className="input-edit-profile"
            />
          </div>

          <div className="edit-field-group">
            <label>
              <Edit3 size={14} /> Sua Bio de Leitor:
            </label>
            <textarea
              rows={3}
              maxLength={300}
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Conte um pouco sobre suas leituras favoritas..."
              className="input-edit-profile"
            />
            <small className="char-count">{bioInput.length}/300 caracteres</small>
          </div>

          <div className="edit-buttons-row">
            <button
              type="button"
              className="btn-secondary-edit"
              onClick={() => setEditando(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-save-edit" disabled={salvando}>
              <Check size={16} />
              <span>{salvando ? 'Salvando...' : 'Salvar Perfil'}</span>
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar-circle">
              {usuario.fotoUrl ? (
                <img src={usuario.fotoUrl} alt={usuario.nome} className="profile-photo-img" />
              ) : (
                usuario.nome ? usuario.nome[0].toUpperCase() : 'U'
              )}
            </div>
          </div>

          <div className="profile-main-info">
            <h3 className="profile-name">{usuario.nome}</h3>
            <p className="profile-role-badge">
              {usuario.role === 'ADMIN' ? '🛡️ Administrador' : '📖 Leitor Consciente'}
            </p>
            <p className="profile-bio">
              {usuario.bio || 'Amante da leitura transformando estantes paradas em pontes de conhecimento.'}
            </p>
          </div>

          {/* As 3 Seções com cores vibrantes */}
          <div className="profile-stats-tabs three-columns clean-tabs">
            <button
              className={`stat-tab ${abaLateral === 'pegos' ? 'active' : ''}`}
              onClick={() => setAbaLateral('pegos')}
            >
              <BookMarked size={18} className="tab-icon" />
              <span className="stat-label">Pegos</span>
            </button>

            <button
              className={`stat-tab ${abaLateral === 'doados' ? 'active' : ''}`}
              onClick={() => setAbaLateral('doados')}
            >
              <Gift size={18} className="tab-icon" />
              <span className="stat-label">Doados</span>
            </button>

            <button
              className={`stat-tab ${abaLateral === 'favoritos' ? 'active' : ''}`}
              onClick={() => setAbaLateral('favoritos')}
            >
              <Heart size={18} className="tab-icon icon-fav-tab" />
              <span className="stat-label">Favoritos</span>
            </button>
          </div>

          {/* A Lista abaixo das seções */}
          <div className="sidebar-list-container">
            <div className="sidebar-list-header">
              <span className="sidebar-list-title">
                {abaLateral === 'pegos' && '📖 Livros em sua posse:'}
                {abaLateral === 'doados' && '🎁 Livros que você doou:'}
                {abaLateral === 'favoritos' && '❤️ Lista de Desejos:'}
              </span>
              {abaLateral === 'favoritos' && (
                <span className="notif-badge" title="Você será avisado por E-mail e WhatsApp quando o livro chegar na Estante Geral">
                  <BellRing size={12} /> Alerta Ativo
                </span>
              )}
            </div>

            {listaAtual.length === 0 ? (
              <p className="sidebar-empty-msg">Nenhum livro nesta lista ainda.</p>
            ) : (
              <ul className="sidebar-items-list">
                {listaAtual.map((item) => (
                  <li key={item.id} className="sidebar-book-item">
                    <div className="sidebar-book-text">
                      <strong className="sidebar-book-title" title={item.titulo}>{item.titulo}</strong>
                      <span className="sidebar-book-author">{item.autor}</span>
                    </div>

                    <div className="sidebar-item-actions">
                      {/* Na aba Pegos: Botão para Redoar (Colocar para circular de novo) */}
                      {abaLateral === 'pegos' && onRedoarLivro && (
                        <button
                          className="btn-sidebar-redoar"
                          onClick={() => onRedoarLivro(item)}
                          title="Colocar para doar novamente (Passar para a frente!)"
                        >
                          <Gift size={14} />
                          <span>Doar</span>
                        </button>
                      )}

                      {/* Botão de Excluir para livros sob posse ou doados */}
                      {(abaLateral === 'pegos' || abaLateral === 'doados') && onExcluirLivro && (
                        <button
                          className="btn-sidebar-delete"
                          onClick={() => onExcluirLivro(item.id)}
                          title="Excluir livro"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}

                      {/* Na aba Favoritos: Remover da lista */}
                      {abaLateral === 'favoritos' && onRemoverFavorito && (
                        <button
                          className="btn-remove-fav"
                          onClick={() => onRemoverFavorito(item.id)}
                          title="Remover dos favoritos"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
