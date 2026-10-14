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
  Send,
  Loader2,
  Lock,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import { apiRequest, setAuth, clearAuth } from '../services/api';

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
  const [abaAtiva, setAbaAtiva] = useState(abaInicial); // 'perfil', 'dados', 'seguranca'

  // Campos de Dados do Leitor
  const [nome, setNome] = useState(usuario?.nome || '');
  const [notificarEmail, setNotificarEmail] = useState(usuario?.notificarEmail ?? true);

  // Campos de Perfil / Visual
  const [bio, setBio] = useState(usuario?.bio || 'Amante da leitura transformando estantes paradas em pontes de conhecimento.');
  const [fotoUrl, setFotoUrl] = useState(usuario?.fotoUrl || '');
  const [corBanner, setCorBanner] = useState(usuario?.corBanner || CORES_BANNER[0].valor);

  // Campos de Alteração de Senha
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  const [alterandoSenha, setAlterandoSenha] = useState(false);

  // Estados de Exclusão de Conta
  const [modalConfirmarExclusao, setModalConfirmarExclusao] = useState(false);
  const [senhaExclusao, setSenhaExclusao] = useState('');
  const [excluindoConta, setExcluindoConta] = useState(false);
  const [erroExclusao, setErroExclusao] = useState('');

  // Estados Globais de Feedback
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [testandoNotif, setTestandoNotif] = useState(false);
  const fileInputRef = useRef(null);

  if (!usuario) return null;

  // Testar disparo de notificação por e-mail
  async function handleTestarNotificacao() {
    setTestandoNotif(true);
    setErro('');
    setSucesso('');
    try {
      await apiRequest('/usuarios/perfil', {
        method: 'PATCH',
        body: JSON.stringify({ notificarEmail }),
      });

      await apiRequest('/notificacoes/testar', {
        method: 'POST',
        body: JSON.stringify({
          titulo: 'O Pequeno Príncipe',
          autor: 'Antoine de Saint-Exupéry',
        }),
      });

      setSucesso(`E-mail de teste enviado com sucesso para ${usuario.email}! Confira o terminal do servidor e sua caixa de entrada.`);
    } catch (err) {
      setErro('Erro ao testar envio: ' + (err.message || 'Verifique o backend'));
    } finally {
      setTestandoNotif(false);
    }
  }

  // Processa o arquivo selecionado no computador e comprime em Base64
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

  // Salvar dados do perfil ou dados do leitor
  async function handleSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');
    setSucesso('');

    try {
      const payload = {
        nome: nome.trim(),
        bio,
        fotoUrl: fotoUrl.trim() || null,
        corBanner,
        notificarEmail,
      };

      const resposta = await apiRequest('/usuarios/perfil', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

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

  // Alterar senha
  async function handleAlterarSenha(e) {
    if (e) e.preventDefault();
    setErro('');
    setSucesso('');

    if (!senhaAtual) {
      setErro('Por favor, digite sua senha atual.');
      return;
    }
    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (novaSenha !== confirmarNovaSenha) {
      setErro('A confirmação da nova senha não confere.');
      return;
    }

    setAlterandoSenha(true);
    try {
      await apiRequest('/usuarios/senha', {
        method: 'PATCH',
        body: JSON.stringify({ senhaAtual, novaSenha }),
      });

      setSucesso('Senha alterada com sucesso! Use sua nova senha no próximo login.');
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarNovaSenha('');
    } catch (err) {
      setErro(err.message || 'Erro ao alterar senha. Verifique a senha atual informada.');
    } finally {
      setAlterandoSenha(false);
    }
  }

  // Excluir conta permanentemente
  async function handleExcluirConta(e) {
    if (e) e.preventDefault();
    setExcluindoConta(true);
    setErroExclusao('');

    if (!senhaExclusao.trim()) {
      setErroExclusao('Por favor, digite sua senha para confirmar a exclusão.');
      setExcluindoConta(false);
      return;
    }

    try {
      await apiRequest('/usuarios/conta', {
        method: 'DELETE',
        body: JSON.stringify({ senha: senhaExclusao }),
      });

      // Limpa dados de autenticação e cache local
      clearAuth();

      // Redireciona com feedback
      window.location.href = '/login?msg=conta_excluida';
    } catch (err) {
      setErroExclusao(err.message || 'Senha incorreta. Não foi possível apagar a conta.');
      setExcluindoConta(false);
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
              <p className="modal-subtitle">Gerencie suas informações de leitor, segurança e preferências</p>
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
            onClick={() => { setAbaAtiva('perfil'); setErro(''); setSucesso(''); }}
          >
            <Palette size={16} />
            <span>Editar Perfil</span>
          </button>
          <button
            type="button"
            className={`profile-modal-tab-btn ${abaAtiva === 'dados' ? 'active' : ''}`}
            onClick={() => { setAbaAtiva('dados'); setErro(''); setSucesso(''); }}
          >
            <User size={16} />
            <span>Dados do Leitor</span>
          </button>
          <button
            type="button"
            className={`profile-modal-tab-btn ${abaAtiva === 'seguranca' ? 'active' : ''}`}
            onClick={() => { setAbaAtiva('seguranca'); setErro(''); setSucesso(''); }}
          >
            <Lock size={16} />
            <span>Segurança</span>
          </button>
        </div>

        {erro && (
          <div className="modal-error-alert">
            <AlertCircle size={18} />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="modal-success-alert">
            <Check size={18} />
            <span>{sucesso}</span>
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

              {/* Foto de Perfil */}
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
                      title="Remover foto"
                    >
                      <Trash2 size={16} />
                      <span>Remover</span>
                    </button>
                  )}
                </div>

                <div className="url-fallback-row">
                  <span className="or-divider-text">ou cole o link direto da imagem:</span>
                  <input
                    type="url"
                    className="modal-input input-url-photo"
                    placeholder="https://exemplo.com/minha-foto.jpg"
                    value={fotoUrl.startsWith('data:') ? '' : fotoUrl}
                    onChange={(e) => setFotoUrl(e.target.value)}
                  />
                </div>
              </div>

              {/* Bio do Leitor */}
              <div className="form-group">
                <div className="label-with-counter">
                  <label className="modal-label" htmlFor="bio-input">
                    <Edit3 size={15} /> Sua Bio / Frase Inspiradora:
                  </label>
                  <span className="char-counter">{bio.length}/300</span>
                </div>
                <textarea
                  id="bio-input"
                  className="modal-textarea"
                  rows={3}
                  maxLength={300}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Conte um pouco sobre sua paixão por livros e leitura..."
                />
              </div>
            </div>
          )}

          {/* ABA 2: DADOS DO LEITOR (Nome, E-mail e Alertas) */}
          {abaAtiva === 'dados' && (
            <div className="modal-tab-content">
              <div className="form-group-grid">
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

              {/* Seção Limpa de Notificações de Livros Favoritos */}
              <div className="notif-pref-card compact">
                <div className="notif-pref-header-compact">
                  <BellRing size={16} className="icon-bell-notif" />
                  <span>Avisos da Lista de Desejos</span>
                </div>

                <label className={`notif-toggle-row ${notificarEmail ? 'active' : ''}`}>
                  <input
                    type="checkbox"
                    checked={notificarEmail}
                    onChange={(e) => setNotificarEmail(e.target.checked)}
                    className="notif-checkbox-input"
                  />
                  <div className="notif-toggle-info">
                    <span className="notif-toggle-title">Notificações por e-mail ativas</span>
                    <span className="notif-toggle-desc">
                      Receba um aviso em <strong>{usuario.email}</strong> assim que um exemplar da sua lista for doado.
                    </span>
                  </div>
                </label>

                {/* Botão de Teste Rápido de Disparo por E-mail */}
                {notificarEmail && (
                  <div className="test-notif-container">
                    <button
                      type="button"
                      className="btn-test-notif"
                      onClick={handleTestarNotificacao}
                      disabled={testandoNotif}
                      title="Enviar e-mail simulado agora para testar seu canal"
                    >
                      {testandoNotif ? <Loader2 size={13} className="spinner" /> : <Send size={13} />}
                      <span>{testandoNotif ? 'Enviando teste...' : 'Testar envio de alerta por e-mail'}</span>
                    </button>
                    <span className="test-notif-hint">Simula a chegada de um livro desejado</span>
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

          {/* ABA 3: SEGURANÇA (Trocar Senha & Excluir Conta) */}
          {abaAtiva === 'seguranca' && (
            <div className="modal-tab-content">
              {/* Bloco 1: Alteração de Senha */}
              <div className="security-section-card">
                <div className="security-card-header">
                  <KeyRound size={16} className="icon-security-key" />
                  <h4>Alterar Senha de Acesso</h4>
                </div>
                <p className="security-subtext">
                  Digite sua senha atual e escolha uma nova senha com no mínimo 6 dígitos.
                </p>

                <div className="form-group">
                  <label className="modal-label" htmlFor="senha-atual-input">
                    Senha Atual:
                  </label>
                  <input
                    id="senha-atual-input"
                    type="password"
                    className="modal-input"
                    value={senhaAtual}
                    onChange={(e) => setSenhaAtual(e.target.value)}
                    placeholder="Digite sua senha atual"
                    autoComplete="current-password"
                  />
                </div>

                <div className="form-group-grid">
                  <div className="form-group">
                    <label className="modal-label" htmlFor="nova-senha-input">
                      Nova Senha:
                    </label>
                    <input
                      id="nova-senha-input"
                      type="password"
                      className="modal-input"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="form-group">
                    <label className="modal-label" htmlFor="confirmar-senha-input">
                      Confirmar Nova Senha:
                    </label>
                    <input
                      id="confirmar-senha-input"
                      type="password"
                      className="modal-input"
                      value={confirmarNovaSenha}
                      onChange={(e) => setConfirmarNovaSenha(e.target.value)}
                      placeholder="Repita a nova senha"
                      autoComplete="new-password"
                    />
                  </div>
                </div>

                <div className="security-action-footer">
                  <button
                    type="button"
                    className="btn-update-password"
                    onClick={handleAlterarSenha}
                    disabled={alterandoSenha || !senhaAtual || !novaSenha || !confirmarNovaSenha}
                  >
                    {alterandoSenha ? <Loader2 size={14} className="spinner" /> : <Lock size={14} />}
                    <span>{alterandoSenha ? 'Alterando senha...' : 'Atualizar Minha Senha'}</span>
                  </button>
                </div>
              </div>

              {/* Bloco 2: Zona de Perigo (Exclusão da Conta) */}
              <div className="danger-zone-card">
                <div className="danger-zone-header">
                  <AlertTriangle size={17} className="icon-danger-warning" />
                  <div>
                    <h4>Zona de Perigo</h4>
                    <p className="danger-zone-desc">
                      Excluir permanentemente sua conta de leitor e todos os seus dados.
                    </p>
                  </div>
                </div>

                <div className="danger-zone-action">
                  <p className="danger-zone-warning-text">
                    Ao excluir sua conta, todos os seus livros cadastrados, lista de desejos e histórico serão excluídos imediatamente e não poderão ser recuperados.
                  </p>
                  <button
                    type="button"
                    className="btn-trigger-delete-account"
                    onClick={() => {
                      setModalConfirmarExclusao(true);
                      setSenhaExclusao('');
                      setErroExclusao('');
                    }}
                  >
                    <Trash2 size={15} />
                    <span>Excluir Minha Conta</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Ações do Rodapé do Modal (Para abas de perfil e dados) */}
          {abaAtiva !== 'seguranca' && (
            <div className="modal-actions-row">
              <button type="button" className="btn-modal-cancel" onClick={onClose} disabled={salvando}>
                Cancelar
              </button>
              <button type="submit" className="btn-modal-save" disabled={salvando}>
                <Check size={18} />
                <span>{salvando ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          )}
        </form>

        {/* MODAL / CAIXA DE CONFIRMAÇÃO DE EXCLUSÃO DE CONTA (COM CHECAGEM POR SENHA) */}
        {modalConfirmarExclusao && (
          <div className="delete-confirm-overlay" onClick={() => !excluindoConta && setModalConfirmarExclusao(false)}>
            <div className="delete-confirm-card" onClick={(e) => e.stopPropagation()}>
              <div className="delete-confirm-icon-circle">
                <AlertTriangle size={28} />
              </div>

              <h3>Tem certeza absoluta que deseja excluir sua conta?</h3>
              <p className="delete-confirm-text">
                Esta ação é <strong>irreversível</strong>. Sua conta <strong>{usuario.email}</strong>, livros cadastrados e lista de desejos serão removidos para sempre.
              </p>

              {erroExclusao && (
                <div className="modal-error-alert compact-error">
                  <AlertCircle size={15} />
                  <span>{erroExclusao}</span>
                </div>
              )}

              <form onSubmit={handleExcluirConta} className="delete-confirm-form">
                <div className="form-group">
                  <label className="modal-label" htmlFor="senha-exclusao">
                    Para sua segurança, confirme digitando sua senha:
                  </label>
                  <input
                    id="senha-exclusao"
                    type="password"
                    className="modal-input input-danger-focus"
                    placeholder="Digite sua senha de acesso"
                    value={senhaExclusao}
                    onChange={(e) => setSenhaExclusao(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="delete-confirm-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => {
                      setModalConfirmarExclusao(false);
                      setSenhaExclusao('');
                      setErroExclusao('');
                    }}
                    disabled={excluindoConta}
                  >
                    Voltar / Cancelar
                  </button>

                  <button
                    type="submit"
                    className="btn-confirm-delete-forever"
                    disabled={excluindoConta || !senhaExclusao.trim()}
                  >
                    {excluindoConta ? <Loader2 size={15} className="spinner" /> : <Trash2 size={15} />}
                    <span>{excluindoConta ? 'Excluindo conta...' : 'Sim, excluir minha conta definitivamente'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
