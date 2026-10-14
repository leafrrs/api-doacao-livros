import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiRequest, setAuth } from '../services/api';
import FeedbackMessage from '../components/FeedbackMessage';
import { LogIn, BookOpen, Lock, Mail, ArrowRight } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
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
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, senha }),
      });

      setAuth(data.token, data.usuario);
      if (onLoginSuccess) onLoginSuccess();
      navigate('/');
    } catch (err) {
      setFeedback({ tipo: 'erro', mensagem: err.message || 'Falha ao autenticar.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-brand-header">
          <BookOpen size={40} className="auth-logo-icon" />
          <h2>Acesse sua Conta</h2>
          <p>Conecte-se para retirar ou doar livros no Reconecta</p>
        </div>

        <FeedbackMessage
          tipo={feedback.tipo}
          mensagem={feedback.mensagem}
          onClose={() => setFeedback({ tipo: '', mensagem: '' })}
        />

        <form onSubmit={handleSubmit} className="auth-form">
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
            <label htmlFor="senha">Senha</label>
            <div className="input-with-icon">
              <Lock size={18} />
              <input
                id="senha"
                type="password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary-auth" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar na Plataforma'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-footer-prompt">
          <span>Ainda não tem conta?</span>
          <Link to="/cadastro" className="auth-link">Cadastre-se gratuitamente</Link>
        </div>
      </div>
    </div>
  );
}
