import React from 'react';
import { Book, Heart, Sparkles, Clock, Calendar } from 'lucide-react';
import { getCurrentUser } from '../services/api';

export default function ExternalBookCard({ livro, isFavorito, onToggleFavorito }) {
  const usuario = getCurrentUser();

  const capaUrl = livro.capa_id || livro.capaId
    ? `https://covers.openlibrary.org/b/id/${livro.capa_id || livro.capaId}-M.jpg`
    : null;

  const ano = livro.ano_publicacao || livro.anoPublicacao;

  return (
    <article className="book-card book-card-external">
      <div className="book-cover-container">
        {capaUrl ? (
          <img src={capaUrl} alt={`Capa de ${livro.titulo}`} className="book-cover-img" />
        ) : (
          <div className="book-cover-placeholder">
            <Book size={48} className="placeholder-icon" />
            <span className="placeholder-text">{livro.titulo}</span>
          </div>
        )}

        {/* Badge indicando que ainda não está na estante */}
        <span className="badge-condicao badge-aguardando">
          <Clock size={12} />
          <span>Aguardando Doação</span>
        </span>

        {/* Botão de Coração para Favoritar */}
        {usuario && (
          <button
            type="button"
            className={`btn-card-fav ${isFavorito ? 'favorited' : ''}`}
            onClick={() => onToggleFavorito(livro)}
            title={isFavorito ? 'Remover dos favoritos' : 'Adicionar à Lista de Desejos (Avisar quando entrar na estante)'}
          >
            <Heart size={18} fill={isFavorito ? '#ef4444' : 'none'} color={isFavorito ? '#ef4444' : '#fff'} />
          </button>
        )}
      </div>

      <div className="book-info">
        <h4 className="book-title" title={livro.titulo}>{livro.titulo}</h4>
        <p className="book-author">{livro.autor}</p>

        {ano && (
          <div className="book-meta">
            <span className="meta-item">
              <Calendar size={13} />
              <span>{ano}</span>
            </span>
          </div>
        )}

        <div className="external-book-callout">
          <Sparkles size={13} />
          <span>Fora da estante no momento</span>
        </div>

        {/* Botão de Ação: Avisar quando entrar na Estante */}
        <div className="book-actions">
          <button
            type="button"
            className={`btn-wishlist-action ${isFavorito ? 'is-favorited' : ''}`}
            onClick={() => onToggleFavorito(livro)}
          >
            <Heart size={16} fill={isFavorito ? '#ef4444' : 'none'} color={isFavorito ? '#ef4444' : 'currentColor'} />
            <span>{isFavorito ? 'Avisos Ativos (Na Lista)' : 'Avisar quando doar'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
