import React from 'react';
import { Search, Sparkles } from 'lucide-react';

export default function SearchBar({ termo, setTermo, onBuscar }) {
  function handleSubmit(e) {
    e.preventDefault();
    if (onBuscar) onBuscar();
  }

  return (
    <form className="search-bar-form" onSubmit={handleSubmit}>
      <div className="search-input-wrapper">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          placeholder="Pesquisar por título, autor ou palavra-chave..."
          className="search-input"
        />
        {termo && (
          <button
            type="button"
            className="search-clear-btn"
            onClick={() => setTermo('')}
          >
            ×
          </button>
        )}
      </div>
      <button type="submit" className="search-submit-btn">
        <span>Buscar</span>
      </button>
    </form>
  );
}
