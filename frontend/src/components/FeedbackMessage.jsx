import React, { useEffect } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export default function FeedbackMessage({ tipo = 'info', mensagem, onClose }) {
  // Desaparece automaticamente após 5 segundos
  useEffect(() => {
    if (!mensagem) return;

    const timer = setTimeout(() => {
      if (onClose) onClose();
    }, 5000);

    return () => clearTimeout(timer);
  }, [mensagem, onClose]);

  if (!mensagem) return null;

  const icones = {
    sucesso: <CheckCircle size={20} className="icon-sucesso" />,
    erro: <AlertCircle size={20} className="icon-erro" />,
    info: <Info size={20} className="icon-info" />,
  };

  return (
    <div className={`feedback-banner feedback-${tipo}`}>
      <div className="feedback-content">
        {icones[tipo] || icones.info}
        <span className="feedback-text">{mensagem}</span>
      </div>
      {onClose && (
        <button onClick={onClose} className="feedback-close-btn" aria-label="Fechar mensagem">
          <X size={18} />
        </button>
      )}
    </div>
  );
}
