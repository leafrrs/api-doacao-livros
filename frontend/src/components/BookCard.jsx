import React from 'react';
import { Book, Trash2, HeartHandshake, User, Calendar, Edit3 } from 'lucide-react';
import { getCurrentUser } from '../services/api';

export default function BookCard({ livro, onPegar, onExcluir, onEditar, loading }) {
  const usuarioLogado = getCurrentUser();

  const capaUrl = livro.capaId
    ? `https://covers.openlibrary.org/b/id/${livro.capaId}-M.jpg`
    : null;

  const coresCondicao = {
    NOVO: 'badge-novo',
    SEMINOVO: 'badge-seminovo',
    BOM_ESTADO: 'badge-bom',
    MARCAS_DE_USO: 'badge-usado',
    DESGASTADO: 'badge-desgastado',
  };

  const ehDono = usuarioLogado && livro.usuarioId === usuarioLogado.id;
  const ehAdmin = usuarioLogado && usuarioLogado.role === 'ADMIN';

  return (
    <article className="book-card">
      <div className="book-cover-container">
        {capaUrl ? (
          <img src={capaUrl} alt={`Capa de ${livro.titulo}`} className="book-cover-img" />
        ) : (
          <div className="book-cover-placeholder">
            <Book size={48} className="placeholder-icon" />
            <span className="placeholder-text">{livro.titulo}</span>
          </div>
        )}

        <span className={`badge-condicao ${coresCondicao[livro.condicao] || 'badge-bom'}`}>
          {livro.condicao ? livro.condicao.replace('_', ' ') : 'BOM ESTADO'}
        </span>
      </div>

      <div className="book-info">
        <h4 className="book-title" title={livro.titulo}>{livro.titulo}</h4>
        <p className="book-author">{livro.autor}</p>

        {livro.relatoLeitura && (
          <blockquote className="book-quote" title={livro.relatoLeitura}>
            "{livro.relatoLeitura}"
          </blockquote>
        )}

        <div className="book-meta">
          <span className="meta-item">
            <User size={14} />
            <span>{livro.usuario ? livro.usuario.nome : 'Doador Reconecta'}</span>
          </span>
          {livro.anoPublicacao && (
            <span className="meta-item">
              <Calendar size={14} />
              <span>{livro.anoPublicacao}</span>
            </span>
          )}
        </div>

        {/* Ações do Card */}
        <div className="book-actions">
          {livro.disponivel ? (
            usuarioLogado && !ehDono ? (
              <button
                className="btn-action-pegar"
                onClick={() => onPegar(livro)}
                disabled={loading}
              >
                <HeartHandshake size={16} />
                <span>Pegar Livro</span>
              </button>
            ) : ehDono ? (
              <span className="badge-seu-livro">Seu livro para doação</span>
            ) : (
              <span className="badge-aviso-login">Faça login para pegar</span>
            )
          ) : (
            <span className="badge-indisponivel">Em leitura / Resgatado</span>
          )}

          {/* Ações para o Dono do Livro ou Administrador */}
          {(ehDono || ehAdmin) && (
            <div className="owner-buttons-group">
              {onEditar && (
                <button
                  className="btn-action-edit"
                  onClick={() => onEditar(livro)}
                  disabled={loading}
                  title="Editar condição e relato de leitura"
                >
                  <Edit3 size={16} />
                </button>
              )}
              <button
                className="btn-action-delete"
                onClick={() => onExcluir(livro.id)}
                disabled={loading}
                title="Excluir exemplar"
              >
                <Trash2 size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
