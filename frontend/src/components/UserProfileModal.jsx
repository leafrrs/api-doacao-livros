import React, { useState, useRef } from 'react';
import {
  X,
  Check,
  User,
  Palette,
  Camera,
  Edit3,
  Shield,
  Mail,
  Sparkles,
  AlertCircle,
  Upload,
  Trash2,
  BellRing,
  Phone,
  MessageCircle,
} from 'lucide-react';
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
  const [notificarEmail, setNotificarEmail] = useState(usuario?.notificarEmail ?? true);
  const [notificarWhatsapp, setNotificarWhatsapp] = useState(usuario?.notificarWhatsapp ?? false);
  const [whatsapp, setWhatsapp] = useState(usuario?.whatsapp || '');

  // Campos de Perfil / Visual
  const [bio, setBio] = useState(usuario?.bio || 'Amante da leitura transformando estantes paradas em pontes de conhecimento.');
  const [fotoUrl, setFotoUrl] = useState(usuario?.fotoUrl || '');
  const [corBanner, setCorBanner] = useState(usuario?.corBanner || CORES_BANNER[0].valor);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const fileInputRef = useRef(null);

  if (!usuario) return null;

  // Formata o número de telefone no formato padrão brasileiro (XX) XXXXX-XXXX
  function formatarTelefone(valor) {
    const apenasDigitos = valor.replace(/\D/g, '').slice(0, 11);
    if (apenasDigitos.length <= 2) return apenasDigitos;
    if (apenasDigitos.length <= 6) return `(${apenasDigitos.slice(0, 2)}) ${apenasDigitos.slice(2)}`;
    if (apenasDigitos.length <= 10) {
      return `(${apenasDigitos.slice(0, 2)}) ${apenasDigitos.slice(2, 6)}-${apenasDigitos.slice(6)}`;
    }
    return `(${apenasDigitos.slice(0, 2)}) ${apenasDigitos.slice(2, 7)}-${apenasDigitos.slice(7)}`;
  }

  // Processa o arquivo selecionado no computador e converte em Base64 leve
  function handleArquivoFotoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErro('Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
        setFotoUrl(dataUrl);
        setErro('');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    // Validação: Se marcou whatsapp, é obrigatório digitar o número
    if (notificarWhatsapp && !whatsapp.trim()) {
      setErro('Por favor, insira o seu número de WhatsApp para poder receber as notificações.');
      setSalvando(false);
      return;
    }

    try {
      const payload = {
        nome: nome.trim(),
        bio,
        fotoUrl: fotoUrl.trim() || null,
        corBanner,
        notificarEmail,
        notificarWhatsapp,
        whatsapp: notificarWhatsapp ? whatsapp.trim() : null,
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

              {/* Foto de Perfil (Arquivo do Computador ou URL) */}
              <div className="form-group">
                <label className="modal-label">
                  <Camera size={15} /> Foto de Perfil (Opcional):
                </label>

                <div className="upload-photo-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleArquivoFotoChange}
                  />
                  <button
                    type="button"
                    className="btn-upload-file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={16} />
                    <span>Escolher Foto do Computador</span>
                  </button>

                  {fotoUrl && (
                    <button
                      type="button"
                      className="btn-remove-photo"
                      onClick={() => {
                        setFotoUrl('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      title="Remover foto atual"
                    >
                      <Trash2 size={15} />
                      <span>Remover</span>
                    </button>
                  )}
                </div>

                <div className="or-divider-text">ou cole o link de uma imagem da internet:</div>

                <input
                  id="foto-url-input"
                  type="url"
                  className="modal-input"
                  value={fotoUrl.startsWith('data:') ? '' : fotoUrl}
                  onChange={(e) => setFotoUrl(e.target.value)}
                  placeholder={fotoUrl.startsWith('data:') ? 'Foto selecionada do seu computador ✅' : 'https://exemplo.com/sua-foto.jpg'}
                />
                <span className="input-help-text">
                  {fotoUrl.startsWith('data:')
                    ? 'Foto do computador carregada! O avatar acima mostra a pré-visualização.'
                    : 'Formatos aceitos: JPG, PNG ou link direto de imagem.'}
                </span>
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

          {/* ABA 2: DADOS DO LEITOR (Informações da Conta e Preferências) */}
          {abaAtiva === 'dados' && (
            <div className="modal-tab-content modal-tab-compact">
              {/* Nome e E-mail lado a lado para economizar altura */}
              <div className="fields-two-cols">
                <div className="form-group">
                  <label className="modal-label" htmlFor="nome-input">
                    <User size={15} /> Seu Nome:
                  </label>
                  <input
                    id="nome-input"
                    type="text"
                    className="modal-input"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Seu nome"
                  />
                </div>

                <div className="form-group">
                  <label className="modal-label" htmlFor="email-input">
                    <Mail size={15} /> E-mail (Login):
                  </label>
                  <input
                    id="email-input"
                    type="email"
                    className="modal-input input-readonly"
                    value={usuario.email}
                    disabled
                    title="Chave de acesso à conta"
                  />
                </div>
              </div>

              {/* Seção Compacta de Notificações de Livros Favoritos */}
              <div className="notif-pref-card compact">
                <div className="notif-pref-header-compact">
                  <BellRing size={16} className="icon-bell-notif" />
                  <span>Avisos de Livros Favoritos (Lista de Desejos):</span>
                </div>

                <div className="notif-options-grid">
                  <label className={`notif-chip-select ${notificarEmail ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={notificarEmail}
                      onChange={(e) => setNotificarEmail(e.target.checked)}
                      className="notif-checkbox-input"
                    />
                    <Mail size={15} />
                    <span>Por E-mail</span>
                  </label>

                  <label className={`notif-chip-select ${notificarWhatsapp ? 'active' : ''}`}>
                    <input
                      type="checkbox"
                      checked={notificarWhatsapp}
                      onChange={(e) => setNotificarWhatsapp(e.target.checked)}
                      className="notif-checkbox-input"
                    />
                    <MessageCircle size={15} className="icon-whatsapp" />
                    <span>Por WhatsApp</span>
                  </label>
                </div>

                {/* Campo de WhatsApp quando a opção está ativa */}
                {notificarWhatsapp && (
                  <div className="whatsapp-compact-field">
                    <input
                      id="whatsapp-input"
                      type="tel"
                      className="modal-input input-whatsapp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(formatarTelefone(e.target.value))}
                      placeholder="WhatsApp com DDD: (11) 98765-4321"
                      maxLength={15}
                      required={notificarWhatsapp}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              {/* Nível de Acesso Compacto */}
              <div className="compact-role-box">
                <div className="compact-role-info">
                  <Shield size={16} className="role-icon" />
                  <span>Nível no Reconecta: <strong>{usuario.role === 'ADMIN' ? '🛡️ Administrador' : '📖 Leitor Consciente'}</strong></span>
                </div>
                <span className="badge-ods-pill">ODS 4</span>
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
