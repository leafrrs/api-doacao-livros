import React, { useState, useEffect, useMemo } from 'react';
import UserSidebarCard from '../components/UserSidebarCard';
import BookCard from '../components/BookCard';
import ExternalBookCard from '../components/ExternalBookCard';
import SearchBar from '../components/SearchBar';
import FeedbackMessage from '../components/FeedbackMessage';
import EditBookModal from '../components/EditBookModal';
import { apiRequest, getCurrentUser } from '../services/api';
import { Library, Loader2, Plus, BellRing, Sparkles, Globe, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Home() {
  const [livros, setLivros] = useState([]);
  const [livrosUsuario, setLivrosUsuario] = useState([]);
  const [loading, setLoading] = useState(true);
  const [termoBusca, setTermoBusca] = useState('');
  const [abaLateral, setAbaLateral] = useState('pegos'); // 'pegos', 'doados', 'favoritos'
  const [livroParaEditar, setLivroParaEditar] = useState(null);

  // Busca no acervo externo (Open Library) para livros que ainda não estão na estante
  const [livrosExternos, setLivrosExternos] = useState([]);
  const [buscandoExterno, setBuscandoExterno] = useState(false);
  
  // Alerta de Livro Desejado que entrou na Estante (Some após 5 segundos)
  const [alertaDesejoVisivel, setAlertaDesejoVisivel] = useState(false);
  const [alertaDesejoDispensado, setAlertaDesejoDispensado] = useState(false);

  const usuario = getCurrentUser();

  // Limpa chave legada não isolada do navegador
  useEffect(() => {
    localStorage.removeItem('reconecta_favoritos');
  }, []);

  // Favoritos isolados por usuário (chave única com ID)
  const [favoritos, setFavoritos] = useState(() => {
    if (!usuario?.id) return [];
    const saved = localStorage.getItem(`reconecta_favoritos_${usuario.id}`);
    try {
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });

  // Salva favoritos apenas para o usuário atual
  useEffect(() => {
    if (usuario?.id) {
      localStorage.setItem(`reconecta_favoritos_${usuario.id}`, JSON.stringify(favoritos));
    }
  }, [favoritos, usuario?.id]);

  // Atualiza favoritos quando o usuário mudar
  useEffect(() => {
    if (!usuario?.id) {
      setFavoritos([]);
    } else {
      const saved = localStorage.getItem(`reconecta_favoritos_${usuario.id}`);
      try {
        setFavoritos(saved ? JSON.parse(saved) : []);
      } catch {
        setFavoritos([]);
      }
    }
  }, [usuario?.id]);

  // Carregar dados da API
  async function carregarDados() {
    setLoading(true);
    try {
      // 1. Estante Geral (sempre visível no meio)
      const dataEstante = await apiRequest('/livros');
      setLivros(dataEstante);

      // 2. Se logado, busca os livros do próprio usuário e lista de desejos sincronizada
      if (usuario) {
        const dataMeus = await apiRequest('/livros/meus').catch(() => []);
        setLivrosUsuario(dataMeus);

        const dataFavoritos = await apiRequest('/favoritos').catch(() => []);
        if (Array.isArray(dataFavoritos)) {
          setFavoritos(dataFavoritos);
          if (usuario.id) {
            localStorage.setItem(`reconecta_favoritos_${usuario.id}`, JSON.stringify(dataFavoritos));
          }
        }
      } else {
        setLivrosUsuario([]);
        setFavoritos([]);
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

  // Busca reativa externa na Open Library quando o usuário digita na barra
  useEffect(() => {
    const termo = termoBusca.trim();
    if (termo.length < 3) {
      setLivrosExternos([]);
      setBuscandoExterno(false);
      return;
    }

    const timer = setTimeout(async () => {
      setBuscandoExterno(true);
      try {
        const data = await apiRequest(`/livros/buscar?titulo=${encodeURIComponent(termo)}`);
        
        // Exclui livros que já estão disponíveis na estante local
        const titulosLocais = livros.map(l => l.titulo.toLowerCase().trim());
        const filtrados = (data || []).filter(ext => {
          const tExt = (ext.titulo || '').toLowerCase().trim();
          return !titulosLocais.some(tLoc => tLoc === tExt || tLoc.includes(tExt) || tExt.includes(tLoc));
        });

        setLivrosExternos(filtrados);
      } catch (err) {
        setLivrosExternos([]);
      } finally {
        setBuscandoExterno(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [termoBusca, livros]);

  // DETECÇÃO: Livros favoritados pelo leitor que estão disponíveis na Estante Geral
  const livrosFavoritosDisponiveis = useMemo(() => {
    if (!usuario) return [];
    return livros.filter(livroEstante =>
      livroEstante.disponivel &&
      favoritos.some(
        fav => fav.titulo && fav.titulo.toLowerCase().trim() === livroEstante.titulo.toLowerCase().trim()
      )
    );
  }, [usuario, livros, favoritos]);

  // Temporizador: Dispara o alerta e faz desaparecer após 5 segundos
  useEffect(() => {
    if (livrosFavoritosDisponiveis.length > 0 && !alertaDesejoDispensado) {
      setAlertaDesejoVisivel(true);
      const timer = setTimeout(() => {
        setAlertaDesejoVisivel(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [livrosFavoritosDisponiveis.length, alertaDesejoDispensado]);

  // Adicionar / Remover dos Favoritos (Funciona tanto para livros locais quanto da Open Library)
  function handleToggleFavorito(livro) {
    if (!usuario) {
      setFeedback({ tipo: 'info', mensagem: 'Faça login para salvar livros na sua Lista de Desejos e receber alertas.' });
      return;
    }

    const tituloNormalizado = (livro.titulo || '').toLowerCase().trim();
    const jaFavorito = favoritos.some(
      f => (f.id && livro.id && f.id === livro.id) || (f.titulo && f.titulo.toLowerCase().trim() === tituloNormalizado)
    );

    if (jaFavorito) {
      setFavoritos(prev => prev.filter(
        f => (f.id && livro.id ? f.id !== livro.id : f.titulo.toLowerCase().trim() !== tituloNormalizado)
      ));
      setFeedback({ tipo: 'info', mensagem: `"${livro.titulo}" removido dos seus favoritos.` });

      // Sincroniza remoção no backend
      apiRequest(`/favoritos/${encodeURIComponent(livro.id || livro.titulo)}`, {
        method: 'DELETE',
      }).catch(err => console.warn('Erro ao remover favorito no servidor:', err));
    } else {
      const novoFavorito = {
        id: livro.id || `ext-${livro.isbn || Date.now()}`,
        titulo: livro.titulo,
        autor: livro.autor,
        anoPublicacao: livro.anoPublicacao || livro.ano_publicacao,
        capaId: livro.capaId || livro.capa_id,
        isExterno: !livro.id,
      };

      setFavoritos(prev => [...prev, novoFavorito]);

      // Sincroniza adição no backend para que o usuário receba notificações quando o livro for doado
      apiRequest('/favoritos', {
        method: 'POST',
        body: JSON.stringify({
          titulo: livro.titulo,
          autor: livro.autor,
          isbn: livro.isbn || null,
          capaId: livro.capaId || livro.capa_id || null,
        }),
      }).catch(err => console.warn('Erro ao salvar favorito no servidor:', err));

      const avisoEmail = usuario.notificarEmail ? ` Você receberá um aviso por e-mail (${usuario.email}) assim que este exemplar entrar na Estante Geral.` : '';
      setFeedback({
        tipo: 'sucesso',
        mensagem: `"${livro.titulo}" adicionado à sua Lista de Desejos!${avisoEmail}`,
      });
    }
  }

  function handleRemoverFavorito(livroIdOuTitulo) {
    setFavoritos(prev => prev.filter(
      f => f.id !== livroIdOuTitulo && f.titulo !== livroIdOuTitulo
    ));
    // Sincroniza remoção no backend
    apiRequest(`/favoritos/${encodeURIComponent(livroIdOuTitulo)}`, {
      method: 'DELETE',
    }).catch(err => console.warn('Erro ao remover favorito no servidor:', err));
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
      setFavoritos(prev => prev.filter(
        f => f.id !== livro.id && f.titulo.toLowerCase().trim() !== livro.titulo.toLowerCase().trim()
      ));

      setFeedback({
        tipo: 'sucesso',
        mensagem: `"${livro.titulo}" resgatado com sucesso! Já está na sua lista de livros em posse e foi retirado dos seus favoritos.`,
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

  // Ação: Redoar Livro (Abre o modal de atualização antes de disponibilizar na Estante Geral)
  function handleRedoarLivro(livro) {
    setLivroParaEditar({ ...livro, isRedoando: true });
  }

  // Livros das abas do card lateral do usuário
  const livrosPegos = livrosUsuario.filter(l => !l.disponivel);
  const livrosDoados = livrosUsuario.filter(l => l.disponivel);

  // Filtragem da Estante Geral local por termo de busca
  let livrosEstanteGeral = livros;
  if (termoBusca.trim()) {
    const termo = termoBusca.toLowerCase().trim();
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

      {/* BANNER DE ALERTA: LIVRO DA LISTA DE DESEJOS DISPONÍVEL NA ESTANTE (Some em 5 segundos) */}
      {alertaDesejoVisivel && livrosFavoritosDisponiveis.length > 0 && (
        <div className="wishlist-alert-banner">
          <div className="wishlist-alert-left">
            <div className="wishlist-alert-icon-circle">
              <BellRing size={24} className="bell-ring-pulse" />
            </div>
            <div className="wishlist-alert-details">
              <div className="wishlist-alert-badge">
                <Sparkles size={13} />
                <span>Alerta da Sua Lista de Desejos</span>
              </div>
              <h4>🎉 Boa notícia, {usuario?.nome || 'Leitor'}! Seu livro favorito chegou!</h4>
              <p className="wishlist-alert-book-title">
                O exemplar <strong>"{livrosFavoritosDisponiveis[0].titulo}"</strong> ({livrosFavoritosDisponiveis[0].autor}) está disponível para resgate na Estante Geral de Doações!
              </p>
              <div className="wishlist-alert-channels">
                {usuario?.notificarEmail && (
                  <span className="channel-chip email">✉️ Alerta enviado para: {usuario.email}</span>
                )}
              </div>
            </div>
          </div>
          <div className="wishlist-alert-actions">
            <button
              className="btn-alert-resgatar"
              onClick={() => handlePegarLivro(livrosFavoritosDisponiveis[0])}
            >
              Pegar Livro Agora 📖
            </button>
            <button
              type="button"
              className="btn-close-wishlist-alert"
              onClick={() => {
                setAlertaDesejoVisivel(false);
                setAlertaDesejoDispensado(true);
              }}
              title="Dispensar aviso"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      <div className="layout-columns-container">
        {/* Coluna da Esquerda: Card do Usuário / Painel de Perfil */}
        <section className="left-column">
          <UserSidebarCard
            usuario={usuario}
            abaLateral={abaLateral}
            setAbaLateral={setAbaLateral}
            livrosPegos={livrosPegos}
            livrosDoados={livrosDoados}
            favoritos={favoritos}
            livrosDisponiveis={livros}
            onRemoverFavorito={handleRemoverFavorito}
            onRedoarLivro={handleRedoarLivro}
            onExcluirLivro={handleExcluirLivro}
            onPegarLivro={handlePegarLivro}
          />
        </section>

        {/* Coluna da Direita: Estante Geral e Busca Global */}
        <section className="right-column">
          <div className="catalog-header-bar">
            <div className="catalog-title-area">
              <h2>Estante Geral de Doações</h2>
              <p className="catalog-subtitle">
                Livros disponíveis para circulação na comunidade. Escolha o seu e comece a ler!
              </p>
            </div>

            <div className="catalog-actions-top">
              <SearchBar termo={termoBusca} setTermo={setTermoBusca} />

              {usuario && (
                <Link to="/doar" className="btn-doar-topo-estante" title="Cadastrar Livro para Doação">
                  <Plus size={18} />
                  <span>Doar Livro</span>
                </Link>
              )}
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <Loader2 className="spinner" size={36} />
              <p>Carregando acervo literário...</p>
            </div>
          ) : livrosEstanteGeral.length === 0 ? (
            <div className="empty-state">
              <Library size={48} className="empty-icon" />
              <h3>Nenhum livro disponível na estante com esse nome</h3>
              <p>
                {termoBusca.trim()
                  ? 'Veja abaixo os livros encontrados no acervo global para favoritar e ser avisado assim que alguém doar!'
                  : 'Que tal ser o primeiro a colocar um exemplar para circular?'}
              </p>
              {usuario && !termoBusca.trim() && (
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
                  onEditar={(l) => setLivroParaEditar(l)}
                  loading={loading}
                />
              ))}
            </div>
          )}

          {/* SEÇÃO DA OPEN LIBRARY: LIVROS DO ACERVO GLOBAL (FORA DA ESTANTE) */}
          {termoBusca.trim().length >= 3 && (
            <div className="external-search-wrapper">
              <div className="external-catalog-header">
                <div className="external-title-group">
                  <div className="external-badge-pill">
                    <Globe size={13} />
                    <span>Acervo Global Open Library</span>
                  </div>
                  <h3>Não está na estante? Favorite para ser avisado!</h3>
                  <p>
                    Encontrou o título que procurava? Clique em <strong>"Avisar quando doar"</strong>. Assim que alguém disponibilizar o exemplar no Reconecta, você receberá a notificação!
                  </p>
                </div>
              </div>

              {buscandoExterno ? (
                <div className="external-loading-box">
                  <Loader2 size={24} className="spinner" />
                  <span>Consultando catálogo global de edições em português...</span>
                </div>
              ) : livrosExternos.length === 0 ? (
                <div className="external-empty-box">
                  <p>Nenhuma outra edição encontrada no acervo externo para "{termoBusca}".</p>
                </div>
              ) : (
                <div className="books-grid external-grid">
                  {livrosExternos.map((livroExt) => {
                    const isFav = favoritos.some(
                      f => f.titulo && f.titulo.toLowerCase().trim() === (livroExt.titulo || '').toLowerCase().trim()
                    );
                    return (
                      <ExternalBookCard
                        key={livroExt.isbn || livroExt.titulo}
                        livro={livroExt}
                        isFavorito={isFav}
                        onToggleFavorito={handleToggleFavorito}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Modal para Editar Condição e Relato do Livro (ou Redoar) */}
      {livroParaEditar && (
        <EditBookModal
          livro={livroParaEditar}
          isRedoando={!!livroParaEditar.isRedoando}
          onClose={() => setLivroParaEditar(null)}
          onLivroAtualizado={(livroAtualizado, foiRedoado) => {
            setFeedback({
              tipo: 'sucesso',
              mensagem: foiRedoado
                ? `"${livroAtualizado.titulo}" foi colocado para circulação na Estante Geral novamente com seu relato atualizado!`
                : 'Exemplar atualizado com sucesso!',
            });
            carregarDados();
          }}
        />
      )}
    </main>
  );
}
