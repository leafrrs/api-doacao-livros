import React, { useState } from 'react';
import { X, Check, User, Palette, Camera, Edit3, Shield, Mail, Sparkles, AlertCircle } from 'lucide-react';
import { apiRequest, setAuth } from '../services/api';

const CORES_BANNER = [
  { nome: 'Azul Reconecta', valor: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' },
  { nome: 'Verde Natureza', valor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
  { nome: 'Roxo Criativo', valor: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)' },
  { nome: 'Laranja Caloroso', valor: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' },
  { nome: 'Rosa Suave', valor: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)' },
  { nome: 'Escuro Minimalista', valor: 'linear-gradient(135deg, #334155 0%, #0f172a 100%)' },
];

export default function UserProfileModal({
  usuario,
  abaInicial = 'perfil',
  onClose,
  onUsuarioAtualizado,
}) {
  const [abaAtiva, setAbaAtiva] = useState(abaInicial); // 'perfil' ou 'dados'
  
  // Campos de Dados do Leitor
  const [nome, setNome] = useState(usuario?.nome || '');
  
  // Campos de Perfil / Visual
  const [bio, setBio] = useState(usuario?.bio || 'Amante da leitura transformando estantes paradas em pontes de conhecimento.');
  const [fotoUrl, setFotoUrl] = useState(usuario?.fotoUrl || '');
  const [corBanner, setCorBanner] = useState(usuario?.corBanner || CORES_BANNER[0].valor);
  
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  if (!usuario) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      const payload = {
        nome: nome.trim(),
        bio,
        fotoUrl: fotoUrl.trim() || null,
        corBanner,
      };

      const resposta = await apiRequest('/usuarios/perfil', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      // Atualiza token e storage com os dados novos
      const token = localStorage.getItem('token');
      setAuth(token, resposta.usuario);

      if (onUsuarioAtualizado) onUsuarioAtualizado(resposta.usuario);
      onClose();
    } catch (err) {
      setErro(err.message || 'Erro ao atualizar informações.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card user-profile-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Cabeçalho do Modal */}
        <div className="modal-header">
          <div className="modal-title-group">
            <User size={22} className="modal-icon-title" />
            <div>
              <h3>Conta & Perfil</h3>
              <p className="modal-subtitle">Gerencie suas informações de leitor e personalize seu visual</p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Abas Superiores do Modal */}
        <div className="profile-modal-tabs">
          <button
            type="button"
            className={`profile-modal-tab-btn ${abaAtiva === 'perfil' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('perfil')}
          >
            <Palette size={16} />
            <span>Editar Perfil</span>
          </button>
          <button
            type="button"
            className={`profile-modal-tab-btn ${abaAtiva === 'dados' ? 'active' : ''}`}
            onClick={() => setAbaAtiva('dados')}
          >
            <User size={16} />
            <span>Dados do Leitor</span>
          </button>
        </div>

        {erro && (
          <div className="modal-error-alert">
            <AlertCircle size={18} />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* ABA 1: EDITAR PERFIL (Personalização visual) */}
          {abaAtiva === 'perfil' && (
            <div className="modal-tab-content">
              {/* Preview do Banner com Avatar */}
              <div className="profile-preview-box">
                <div className="preview-banner" style={{ background: corBanner }}>
                  <div className="preview-avatar">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt="Preview"
                        className="preview-avatar-img"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      nome ? nome[0].toUpperCase() : 'U'
                    )}
                  </div>
                </div>
                <div className="preview-details">
                  <strong>{nome || 'Seu Nome'}</strong>
                  <span>{usuario.role === 'ADMIN' ? '🛡️ Administrador' : '📖 Leitor Consciente'}</span>
                </div>
              </div>

              {/* Seletor de cores do Banner */}
              <div className="form-group">
                <label className="modal-label">
                  <Palette size={15} /> Cor do Banner Superior:
                </label>
                <div className="color-palette-options">
                  {CORES_BANNER.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`color-bubble ${corBanner === c.valor ? 'selected' : ''}`}
                      style={{ background: c.valor }}
                      onClick={() => setCorBanner(c.valor)}
                      title={c.nome}
                    />
                  ))}
                </div>
              </div>

              {/* URL da Foto de Perfil */}
              <div className="form-group">
                <label className="modal-label" htmlFor="foto-url-input">
                  <Camera size={15} /> URL da Foto de Perfil (Opcional):
                </label>
                <input
                  id="foto-url-input"
                  type="url"
                  className="modal-input"
                  value={fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  placeholder="https://exemplo.com/sua-foto.jpg"
                />
                <span className="input-help-text">Cole o link de uma imagem para ser exibida no seu avatar</span>
              </div>

              {/* Bio de Leitor */}
              <div className="form-group">
                <label className="modal-label" htmlFor="bio-textarea">
                  <Edit3 size={15} /> Bio de Leitor:
                </label>
                <textarea
                  id="bio-textarea"
                  className="modal-textarea"
                  rows={3}
                  maxLength={300}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Compartilhe seus autores e gostos literários favoritos..."
                />
                <span className="char-count-modal">{bio.length}/300 caracteres</span>
              </div>
            </div>
          )}

          {/* ABA 2: DADOS DO LEITOR (Informações da Conta) */}
          {abaAtiva === 'dados' && (
            <div className="modal-tab-content">
              {/* Nome */}
              <div className="form-group">
                <label className="modal-label" htmlFor="nome-input">
                  <User size={15} /> Nome Completo / Como quer ser chamado:
                </label>
                <input
                  id="nome-input"
                  type="text"
                  className="modal-input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  placeholder="Seu nome completo"
                />
              </div>

              {/* E-mail */}
              <div className="form-group">
                <label className="modal-label" htmlFor="email-input">
                  <Mail size={15} /> E-mail Cadastrado:
                </label>
                <input
                  id="email-input"
                  type="email"
                  className="modal-input input-readonly"
                  value={usuario.email}
                  disabled
                  title="O e-mail é a chave de login da sua conta"
                />
                <span className="input-help-text">O e-mail é a chave de login e acesso ao Reconecta</span>
              </div>

              {/* Nível / Papel no Reconecta */}
              <div className="form-group">
                <label className="modal-label">
                  <Shield size={15} /> Nível de Acesso no Reconecta:
                </label>
                <div className="role-display-box">
                  <Sparkles size={18} className="role-display-icon" />
                  <div>
                    <strong>{usuario.role === 'ADMIN' ? 'Administrador' : 'Leitor Consciente'}</strong>
                    <p>
                      {usuario.role === 'ADMIN'
                        ? 'Você tem permissões para gerenciar doações e moderar todo o acervo da plataforma.'
                        : 'Engajado com o ODS 4 (Educação de Qualidade) mantendo os livros em contínua circulação.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ações do Rodapé do Modal */}
          <div className="modal-actions-row">
            <button type="button" className="btn-modal-cancel" onClick={onClose} disabled={salvando}>
              Cancelar
            </button>
            <button type="submit" className="btn-modal-save" disabled={salvando}>
              <Check size={18} />
              <span>{salvando ? 'Salvando...' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
