import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest } from '../services/api';
import FeedbackMessage from '../components/FeedbackMessage';
import { UserPlus, User, Lock, Mail, ArrowRight } from 'lucide-react';

export default function RegisterUser() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState({ tipo: '', mensagem: '' });
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setFeedback({ tipo: '', mensagem: '' });

    try {
      await apiRequest('/usuarios', {
        method: 'POST',
        body: JSON.stringify({ nome, email, senha }),
      });

      setFeedback({ tipo: 'sucesso', mensagem: 'Conta criada com sucesso! Redirecionando para login...' });
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setFeedback({ tipo: 'erro', mensagem: err.message || 'Erro ao criar conta.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-brand-header">
          <UserPlus size={40} className="auth-logo-icon" />
          <h2>Junte-se ao Reconecta</h2>
          <p>Crie sua conta para participar da corrente da leitura</p>
        </div>

        <FeedbackMessage
          tipo={feedback.tipo}
          mensagem={feedback.mensagem}
          onClose={() => setFeedback({ tipo: '', mensagem: '' })}
        />

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="nome">Nome Completo</label>
            <div className="input-with-icon">
              <User size={18} />
              <input
                id="nome"
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Maria da Silva"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="senha">Senha (Mínimo 6 caracteres)</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                id="senha"
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary-auth" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Criar Minha Conta'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer-prompt">
          <span>Já possui uma conta?</span>
          <Link to="/login" className="auth-link">Fazer Login</Link>
        </div>
      </div>
    </div>
  );
}
