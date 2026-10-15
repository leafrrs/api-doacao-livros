import React from 'react';
import { User, BookMarked, Gift, Heart, LogIn, BellRing, Trash2, CheckCircle2, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserSidebarCard({
  usuario,
  abaLateral,
  setAbaLateral,
  livrosPegos = [],
  livrosDoados = [],
  favoritos = [],
  livrosDisponiveis = [],
  onRemoverFavorito,
  onRedoarLivro,
  onExcluirLivro,
  onPegarLivro,
}) {
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
        style={{ background: usuario.corBanner || 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)' }}
      />

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
            <span
              className={`notif-badge ${!usuario.notificarEmail ? 'notif-badge-disabled' : ''}`}
              title={
                usuario.notificarEmail
                  ? `Avisos ativados por E-mail (${usuario.email})`
                  : 'Avisos por e-mail desativados. Configure em Dados do Leitor.'
              }
            >
              <BellRing size={12} />
              {usuario.notificarEmail ? ' Alerta E-mail Ativo' : ' Alertas Inativos'}
            </span>
          )}
        </div>

        {listaAtual.length === 0 ? (
          <p className="sidebar-empty-msg">Nenhum livro nesta lista ainda.</p>
        ) : (
          <ul className="sidebar-items-list">
            {listaAtual.map((item) => {
              // Verifica se este livro favorito está disponível na estante geral no momento (por título)
              const livroNaEstante = abaLateral === 'favoritos' && livrosDisponiveis.find(
                l => l.disponivel && (
                  l.titulo && item.titulo &&
                  l.titulo.toLowerCase().trim() === item.titulo.toLowerCase().trim()
                )
              );

              return (
                <li key={item.id || item.titulo} className={`sidebar-book-item ${livroNaEstante ? 'item-chegou-estante' : ''}`}>
                  <div className="sidebar-book-text">
                    <strong className="sidebar-book-title" title={item.titulo}>{item.titulo}</strong>
                    <span className="sidebar-book-author">{item.autor}</span>

                    {/* Tag verde indicando que o exemplar acabou de chegar na Estante Geral */}
                    {livroNaEstante && (
                      <span className="badge-livro-chegou">
                        <CheckCircle2 size={11} /> Chegou na Estante!
                      </span>
                    )}
                  </div>

                  <div className="sidebar-item-actions">
                    {/* Se o livro favorito já está na estante, botão direto para resgatar! */}
                    {livroNaEstante && onPegarLivro && (
                      <button
                        className="btn-sidebar-pegar-fav"
                        onClick={() => onPegarLivro(livroNaEstante)}
                        title="Resgatar exemplar agora!"
                      >
                        <BookOpen size={13} />
                        <span>Pegar</span>
                      </button>
                    )}

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
                        onClick={() => onRemoverFavorito(item.id || item.titulo)}
                        title="Remover dos favoritos"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
