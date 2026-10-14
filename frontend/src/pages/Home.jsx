import React, { useState, useEffect } from 'react';
import UserSidebarCard from '../components/UserSidebarCard';
import BookCard from '../components/BookCard';
import SearchBar from '../components/SearchBar';
import FeedbackMessage from '../components/FeedbackMessage';
import { apiRequest, getCurrentUser } from '../services/api';
import { Library, Loader2, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [livros, setLivros] = useState([]);
  const [livrosUsuario, setLivrosUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [abaLateral, setAbaLateral] = useState('pegos'); // 'pegos', 'doados', 'favoritos'
  
  // Favoritos persistidos no localStorage
  const [favoritos, setFavoritos] = useState(() => {
    const saved = localStorage.getItem('reconecta_favoritos');
    return saved ? JSON.parse(saved) : [];
  });

  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });
  const usuario = getCurrentUser();

  // Salva favoritos sempre que mudar
  useEffect(() => {
    localStorage.setItem('reconecta_favoritos', JSON.stringify(favoritos));
  }, [favoritos]);

  // Carregar dados da API
  async function carregarDados() {
    setLoading(true);
    try {
      // 1. Estante Geral (sempre visível no meio)
      const dataEstante = await apiRequest('/livros');
      setLivros(dataEstante);

      // 2. Se logado, busca os livros do próprio usuário para alimentar as abas laterais
      if (usuario) {
        const dataMeus = await apiRequest('/livros/meus').catch(() => []);
        setLivrosUsuario(dataMeus);
      }
    } catch (err) {
      setFeedback({ tipo: 'erro', mensagem: 'Não foi possível carregar os livros. Verifique se o backend está ligado.' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  // Adicionar / Remover dos Favoritos
  function handleToggleFavorito(livro) {
    const jaFavorito = favoritos.some(f => f.id === livro.id);
    if (jaFavorito) {
      setFavoritos(prev => prev.filter(f => f.id !== livro.id));
      setFeedback({ tipo: 'info', mensagem: `"${livro.titulo}" removido dos seus favoritos.` });
    } else {
      setFavoritos(prev => [...prev, livro]);
      setFeedback({
        tipo: 'sucesso',
        mensagem: `"${livro.titulo}" adicionado aos favoritos! Você será notificado por e-mail e WhatsApp se este exemplar for atualizado.`,
      });
    }
  }

  function handleRemoverFavorito(livroId) {
    setFavoritos(prev => prev.filter(f => f.id !== livroId));
  }

  // Ação: Pegar Livro (Resgate)
  async function handlePegarLivro(livro) {
    if (!usuario) {
      setFeedback({ tipo: 'info', mensagem: 'Faça login para poder pegar livros.' });
      return;
    }

    try {
      await apiRequest(`/livros/${livro.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ acao: 'pegar' }),
      });

      // REGRA: Ao pegar o livro, remove automaticamente dos favoritos se estiver lá!
      setFavoritos(prev => prev.filter(f => f.id !== livro.id));

      setFeedback({
        tipo: 'sucesso',
        mensagem: 'Livro resgatado com sucesso! Já está na sua lista de livros em posse e foi retirado dos seus favoritos.',
      });

      carregarDados();
    } catch (err) {
      setFeedback({ tipo: 'erro', mensagem: err.message });
    }
  }

  // Ação: Excluir Livro
  async function handleExcluirLivro(livroId) {
    if (!window.confirm('Tem certeza de que deseja remover este livro da circulação?')) return;

    try {
      await apiRequest(`/livros/${livroId}`, { method: 'DELETE' });
      setFavoritos(prev => prev.filter(f => f.id !== livroId));
      setFeedback({ tipo: 'sucesso', mensagem: 'Livro removido com sucesso!' });
      carregarDados();
    } catch (err) {
      setFeedback({ tipo: 'erro', mensagem: err.message });
    }
  }

  // Livros das abas do card lateral do usuário
  const livrosPegos = livrosUsuario.filter(l => !l.disponivel);
  const livrosDoados = livrosUsuario.filter(l => l.disponivel);

  // A Estante Geral (no centro) sempre exibe TODOS os livros disponíveis para resgate
  let livrosEstanteGeral = livros;
  if (termoBusca.trim()) {
    const termo = termoBusca.toLowerCase();
    livrosEstanteGeral = livrosEstanteGeral.filter(
      l => l.titulo.toLowerCase().includes(termo) || l.autor.toLowerCase().includes(termo)
    );
  }

  return (
    <main className="reconecta-main-layout">
      <FeedbackMessage
        tipo={feedback.tipo}
        mensagem={feedback.mensagem}
        onClose={() => setFeedback({ tipo: '', mensagem: '' })}
      />

      <div className="layout-columns-container">
        {/* Coluna da Esquerda: Card com 3 seções (Pegos, Doados, Favoritos) e Lista abaixo */}
        <section className="left-column">
          <UserSidebarCard
            usuario={usuario}
            onUsuarioAtualizado={() => carregarDados()}
            abaLateral={abaLateral}
            setAbaLateral={setAbaLateral}
            livrosPegos={livrosPegos}
            livrosDoados={livrosDoados}
            favoritos={favoritos}
            onRemoverFavorito={handleRemoverFavorito}
          />
        </section>

        {/* Coluna da Direita: Estante Geral sempre visível */}
        <section className="right-column">
          <div className="catalog-header-bar">
            <div className="catalog-title-area">
              <h2>Estante Geral de Doações</h2>
              <p className="catalog-subtitle">
                Livros disponíveis para circulação na comunidade. Escolha o seu e comece a ler!
              </p>
            </div>

            <SearchBar termo={termoBusca} setTermo={setTermoBusca} />
          </div>

          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={36} />
              <p>Carregando acervo literário...</p>
            </div>
          ) : livrosEstanteGeral.length === 0 ? (
            <div className="empty-state">
              <Library size={48} className="empty-icon" />
              <h3>Nenhum livro disponível no momento</h3>
              <p>Que tal ser o primeiro a colocar um exemplar para circular?</p>
              {usuario && (
                <Link to="/doar" className="btn-primary-action">
                  <Plus size={18} />
                  <span>Cadastrar Doação Agora</span>
                </Link>
              )}
            </div>
          ) : (
            <div className="books-grid">
              {livrosEstanteGeral.map((livro) => (
                <BookCard
                  key={livro.id}
                  livro={livro}
                  onPegar={handlePegarLivro}
                  onExcluir={handleExcluirLivro}
                  onToggleFavorito={handleToggleFavorito}
                  isFavorito={favoritos.some(f => f.id === livro.id)}
                  loading={loading}
                />
              ))}
            </div>
          )}

          {/* Botão de Doar Livro perfeitamente alinhado na coluna da direita */}
          {usuario && (
            <div className="bottom-action-container">
              <Link to="/doar" className="btn-doar-alinhado" title="Cadastrar Livro para Doação">
                <Plus size={20} />
                <span>Doar Livro</span>
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
