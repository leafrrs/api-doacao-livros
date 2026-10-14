import React, { useState } from 'react';
import { X, Check, Book, AlertCircle, Gift } from 'lucide-react';
import { apiRequest } from '../services/api';

const CONDICOES_OPCOES = [
  { valor: 'NOVO', label: 'NOVO (Sem marcas de uso)' },
  { valor: 'SEMINOVO', label: 'SEMINOVO (Excelente estado)' },
  { valor: 'BOM_ESTADO', label: 'BOM ESTADO (Pequenas marcas)' },
  { valor: 'MARCAS_DE_USO', label: 'MARCAS DE USO (Grifos ou orelhas)' },
  { valor: 'DESGASTADO', label: 'DESGASTADO (Capa ou páginas avariadas)' },
];

export default function EditBookModal({ livro, isRedoando = false, onClose, onLivroAtualizado }) {
  const [condicao, setCondicao] = useState(livro.condicao || 'BOM_ESTADO');
  const [relatoLeitura, setRelatoLeitura] = useState(livro.relatoLeitura || '');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  if (!livro) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    setErro('');

    try {
      // Se for a ação de redoar, já atualiza as condições e coloca disponivel: true!
      const payload = {
        condicao,
        relatoLeitura,
        ...(isRedoando ? { disponivel: true } : {}),
      };

      const resposta = await apiRequest(`/livros/${livro.id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (onLivroAtualizado) onLivroAtualizado(resposta.livro, isRedoando);
      onClose();
    } catch (err) {
      setErro(err.message || 'Erro ao processar o exemplar.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            {isRedoando ? (
              <Gift size={22} className="modal-icon-title icon-redoar" />
            ) : (
              <Book size={22} className="modal-icon-title" />
            )}
            <div>
              <h3>{isRedoando ? 'Passar o Livro para a Frente!' : 'Atualizar Exemplar Físico'}</h3>
              <p className="modal-subtitle">
                {isRedoando
                  ? 'Conte como o livro ficou após a sua leitura e deixe seu recado para o próximo leitor'
                  : 'Edite o estado de conservação e seu relato pessoal'}
              </p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {erro && (
          <div className="modal-error-alert">
            <AlertCircle size={16} />
            <span>{erro}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-book-preview">
            <strong className="preview-title">{livro.titulo}</strong>
            <span className="preview-author">{livro.autor}</span>
          </div>

          <div className="form-group">
            <label htmlFor="condicao-select">Como está a condição física agora? *</label>
            <select
              id="condicao-select"
              value={condicao}
              onChange={(e) => setCondicao(e.target.value)}
              className="modal-select"
            >
              {CONDICOES_OPCOES.map((opt) => (
                <option key={opt.valor} value={opt.valor}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="relato-textarea">Seu Relato / O que achou da Leitura?</label>
            <textarea
              id="relato-textarea"
              rows={4}
              maxLength={2000}
              value={relatoLeitura}
              onChange={(e) => setRelatoLeitura(e.target.value)}
              placeholder="Deixe uma mensagem ou conselho para o próximo leitor deste livro..."
              className="modal-textarea"
            />
            <small className="char-count">{relatoLeitura.length}/2000 caracteres</small>
          </div>

          <div className="modal-actions-row">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className={isRedoando ? 'btn-modal-save btn-modal-redoar' : 'btn-modal-save'}
              disabled={salvando}
            >
              {isRedoando ? <Gift size={18} /> : <Check size={18} />}
              <span>{salvando ? 'Publicando...' : (isRedoando ? 'Confirmar e Disponibilizar na Estante' : 'Salvar Alterações')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
