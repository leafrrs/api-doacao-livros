import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import FeedbackMessage from '../components/FeedbackMessage';
import { BookPlus, Search, Sparkles, Book, ArrowLeft, Loader2, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RegisterBook() {
  const [buscaTitulo, setBuscaTitulo] = useState('');
  const [sugestoes, setSugestoes] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [mostrarDropdown, setMostrarDropdown] = useState(false);

  // Campos do formulário
  const [titulo, setTitulo] = useState('');
  const [autor, setAutor] = useState('');
  const [isbn, setIsbn] = useState('');
  const [anoPublicacao, setAnoPublicacao] = useState('');
  const [capaId, setCapaId] = useState('');
  const [condicao, setCondicao] = useState('BOM_ESTADO');
  const [relatoLeitura, setRelatoLeitura] = useState('');

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Efeito de busca em tempo real conforme digita (Debounce de 400ms)
  useEffect(() => {
    if (!buscaTitulo.trim() || buscaTitulo.trim().length < 3) {
      setSugestoes([]);
      setMostrarDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscando(true);
      try {
        const resultados = await apiRequest(`/livros/buscar?titulo=${encodeURIComponent(buscaTitulo)}`);
        setSugestoes(resultados || []);
        setMostrarDropdown(true);
      } catch (err) {
        console.error("Erro na busca de catálogo:", err);
      } finally {
        setBuscando(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [buscaTitulo]);

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMostrarDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Preencher formulário ao clicar em um livro da lista suspensa
  function selecionarLivroCatalogo(livro) {
    setTitulo(livro.titulo || '');
    setAutor(livro.autor || '');
    setIsbn(livro.isbn || '');
    setAnoPublicacao(livro.ano_publicacao || '');
    setCapaId(livro.capa_id || '');
    setBuscaTitulo(livro.titulo);
    setMostrarDropdown(false);
    setFeedback({
      tipo: 'sucesso',
      mensagem: `"${livro.titulo}" selecionado! Agora conte como está o exemplar físico.`,
    });
  }

  // Submeter cadastro da doação
  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setFeedback({ tipo: '', mensagem: '' });

    try {
      await apiRequest('/livros', {
        method: 'POST',
        body: JSON.stringify({
          titulo,
          autor,
          isbn: isbn || null,
          anoPublicacao: anoPublicacao ? parseInt(anoPublicacao) : null,
          capaId: capaId ? parseInt(capaId) : null,
          condicao,
          relatoLeitura,
        }),
      });

      setFeedback({ tipo: 'sucesso', mensagem: 'Livro disponibilizado para doação com sucesso!' });
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      setFeedback({ tipo: 'erro', mensagem: err.message || 'Erro ao cadastrar doação.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-book-page">
      <div className="register-container">
        <Link to="/" className="btn-voltar">
          <ArrowLeft size={18} />
          <span>Voltar para a Estante Geral</span>
        </Link>

        <header className="page-header header-with-icon-side">
          <BookPlus size={32} className="header-icon-side" />
          <div className="header-text-group">
            <h2>Cadastrar Livro para Doação</h2>
            <p>Dê uma nova vida ao seu livro e inspire outros leitores da comunidade.</p>
          </div>
        </header>

        <FeedbackMessage
          tipo={feedback.tipo}
          mensagem={feedback.mensagem}
          onClose={() => setFeedback({ tipo: '', mensagem: '' })}
        />

        {/* Busca com Lista Suspensa / Autocomplete em Tempo Real */}
        <div className="catalog-search-card" ref={dropdownRef}>
          <div className="card-badge-step">Passo 1 (Opcional)</div>
          <h3>Preencher automaticamente via Catálogo</h3>
          <p>Comece a digitar o título do livro para ver sugestões em tempo real:</p>

          <div className="live-search-container">
            <div className="input-search-live-wrapper">
              <Search size={18} className="search-icon-live" />
              <input
                type="text"
                value={buscaTitulo}
                onChange={(e) => setBuscaTitulo(e.target.value)}
                onFocus={() => { if (sugestoes.length > 0) setMostrarDropdown(true); }}
                placeholder="Digite o título (ex: Harry Potter, Dom Casmurro, O Alquimista...)"
                className="input-live-search"
              />
              {buscando && <Loader2 size={18} className="spinner-search-live" />}
            </div>

            {/* Lista Dropdown conforme digita */}
            {mostrarDropdown && sugestoes.length > 0 && (
              <ul className="live-search-dropdown">
                {sugestoes.map((item, idx) => (
                  <li
                    key={idx}
                    className="live-search-item"
                    onClick={() => selecionarLivroCatalogo(item)}
                  >
                    <div className="live-item-thumb">
                      {item.capa_id ? (
                        <img
                          src={`https://covers.openlibrary.org/b/id/${item.capa_id}-S.jpg`}
                          alt=""
                        />
                      ) : (
                        <Book size={18} />
                      )}
                    </div>
                    <div className="live-item-details">
                      <span className="live-item-title">{item.titulo}</span>
                      <span className="live-item-author">
                        {item.autor} {item.ano_publicacao ? `• ${item.ano_publicacao}` : ''}
                      </span>
                    </div>
                    <Sparkles size={16} className="live-item-sparkle" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Formulário do Exemplar Físico */}
        <form onSubmit={handleSubmit} className="book-form-card">
          <div className="card-badge-step">Passo 2</div>
          <h3>Dados do seu Exemplar</h3>

          <div className="form-row">
            <div className="form-group flex-2">
              <label>Título do Livro *</label>
              <input
                type="text"
                required
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Título da obra"
              />
            </div>
            <div className="form-group flex-1">
              <label>Autor *</label>
              <input
                type="text"
                required
                value={autor}
                onChange={(e) => setAutor(e.target.value)}
                placeholder="Autor da obra"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Condição Física do Exemplar *</label>
              <select
                value={condicao}
                onChange={(e) => setCondicao(e.target.value)}
              >
                <option value="NOVO">NOVO (Sem uso)</option>
                <option value="SEMINOVO">SEMINOVO (Excelente estado)</option>
                <option value="BOM_ESTADO">BOM ESTADO (Pequenas marcas)</option>
                <option value="MARCAS_DE_USO">MARCAS DE USO (Grifos ou orelhas)</option>
                <option value="DESGASTADO">DESGASTADO (Capa ou folhas avariadas)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Ano de Publicação</label>
              <input
                type="number"
                value={anoPublicacao}
                onChange={(e) => setAnoPublicacao(e.target.value)}
                placeholder="Ex: 2018"
              />
            </div>

            <div className="form-group">
              <label>ISBN</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="Ex: 9788595084742"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Relato Pessoal da sua Leitura (Máx 2.000 caracteres)</label>
            <textarea
              rows={4}
              maxLength={2000}
              value={relatoLeitura}
              onChange={(e) => setRelatoLeitura(e.target.value)}
              placeholder="O que este livro significou para você? Deixe um recado para o próximo leitor..."
            />
            <small className="char-count">{relatoLeitura.length}/2000 caracteres</small>
          </div>

          <button type="submit" className="btn-submit-donation" disabled={loading}>
            {loading ? 'Disponibilizando...' : 'Publicar na Estante de Doação'}
          </button>
        </form>
      </div>
    </div>
  );
}
