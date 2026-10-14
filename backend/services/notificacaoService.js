const nodemailer = require("nodemailer");

// Configuração flexível do transportador de E-mail
let transporter = null;

async function obterTransporter() {
  if (transporter) return transporter;

  // Se houver configuração SMTP nas variáveis de ambiente, usa o servidor real
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    console.log("📧 [E-mail] Conectado ao servidor SMTP:", process.env.SMTP_HOST);
  } else {
    // Ambiente de desenvolvimento/acadêmico: cria conta de teste gratuita (Ethereal Email)
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log("📧 [E-mail] Modo simulação/teste ativo via Ethereal Email (ilimitado e gratuito).");
    } catch (err) {
      // Fallback em caso de falha de conexão: simulação no console
      transporter = {
        sendMail: async (opts) => {
          console.log(`📧 [Simulação E-mail] De: ${opts.from} | Para: ${opts.to} | Assunto: ${opts.subject}`);
          return { messageId: "simulated-" + Date.now() };
        },
      };
    }
  }

  return transporter;
}

/**
 * Envia notificação por E-mail estilizada com identidade visual do Reconecta
 */
async function enviarNotificacaoEmail({ destinatarioEmail, destinatarioNome, livro, doadorNome }) {
  try {
    const transport = await obterTransporter();
    const remetente = process.env.SMTP_FROM || '"Reconecta Livros" <notificacoes@reconecta.org.br>';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .header p { margin: 8px 0 0 0; opacity: 0.95; font-size: 14px; }
          .content { padding: 32px 24px; }
          .greeting { font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 12px; }
          .highlight-card { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 20px; margin: 20px 0; }
          .book-title { font-size: 20px; font-weight: 800; color: #166534; margin: 0 0 6px 0; }
          .book-meta { font-size: 14px; color: #15803d; margin: 4px 0; }
          .cta-button { display: inline-block; background: #10b981; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 16px; padding: 14px 28px; border-radius: 10px; margin-top: 16px; text-align: center; }
          .footer { background: #f8fafc; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📚 Reconecta</h1>
            <p>Conectando Histórias, Transformando Leitores</p>
          </div>
          <div class="content">
            <div class="greeting">Olá, ${destinatarioNome || "Leitor(a)"}! 🎉</div>
            <p>Temos uma excelente notícia: o exemplar que estava na sua <strong>Lista de Desejos</strong> acabou de chegar na <strong>Estante Geral de Doações</strong>!</p>
            
            <div class="highlight-card">
              <div class="book-title">📖 ${livro.titulo}</div>
              <div class="book-meta"><strong>Autor:</strong> ${livro.autor || "Não informado"}</div>
              <div class="book-meta"><strong>Condição física:</strong> ${livro.condicao || "Bom Estado"}</div>
              <div class="book-meta"><strong>Doador(a):</strong> ${doadorNome || "Comunidade Reconecta"}</div>
            </div>

            <p>Como os livros circulam rápido entre os leitores da comunidade, recomendamos resgatar o seu o quanto antes!</p>
            
            <div style="text-align: center; margin: 28px 0;">
              <a href="http://localhost:5173" class="cta-button">Ver Livro e Resgatar Agora ➔</a>
            </div>
          </div>
          <div class="footer">
            <p>Você recebeu esta mensagem porque salvou este título na sua Lista de Desejos no Reconecta.</p>
            <p>Reconecta • Projeto Acadêmico Recode Pro • ODS 4 Educação de Qualidade</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transport.sendMail({
      from: remetente,
      to: destinatarioEmail,
      subject: `🎉 Boa notícia! O livro "${livro.titulo}" chegou na Estante Geral do Reconecta!`,
      text: `Olá ${destinatarioNome}! O livro "${livro.titulo}" (${livro.autor}) que estava na sua Lista de Desejos acabou de ser doado e já está disponível na Estante Geral. Acesse http://localhost:5173 para resgatar!`,
      html: htmlContent,
    });

    console.log(`\n======================================================`);
    console.log(`📧 [E-MAIL DE NOTIFICAÇÃO DISPARADO COM SUCESSO]`);
    console.log(`Para: ${destinatarioNome} <${destinatarioEmail}>`);
    console.log(`Livro: "${livro.titulo}" (${livro.autor})`);
    if (nodemailer.getTestMessageUrl && info.messageId && !process.env.SMTP_HOST) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      if (previewUrl) {
        console.log(`🔗 Visualizar E-mail formatado (Ethereal): ${previewUrl}`);
      }
    }
    console.log(`======================================================\n`);

    return { sucesso: true, messageId: info.messageId, email: destinatarioEmail };
  } catch (error) {
    console.error(`❌ Erro ao enviar notificação por e-mail para ${destinatarioEmail}:`, error.message);
    return { sucesso: false, erro: error.message };
  }
}

/**
 * Notifica todos os usuários interessados por e-mail quando um livro fica disponível
 */
async function notificarInteressadosNoLivro(prisma, livro, doadorId = null) {
  if (!livro || !livro.titulo) return null;

  try {
    const tituloBusca = livro.titulo.toLowerCase().trim();

    // 1. Busca favoritos correspondentes
    const todosFavoritos = await prisma.favorito.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            notificarEmail: true,
          },
        },
      },
    });

    // 2. Filtra aqueles cujo título bate com o livro e que não seja o próprio doador
    const interessados = todosFavoritos.filter((fav) => {
      if (!fav.usuario) return false;
      if (doadorId && fav.usuario.id === doadorId) return false;

      const favTitulo = (fav.titulo || "").toLowerCase().trim();
      return favTitulo === tituloBusca || tituloBusca.includes(favTitulo) || favTitulo.includes(tituloBusca);
    });

    if (interessados.length === 0) {
      console.log(`ℹ️ [Notificações] Nenhum leitor possui "${livro.titulo}" na Lista de Desejos no momento.`);
      return { totalInteressados: 0, emailsEnviados: 0 };
    }

    // Busca nome do doador
    let doadorNome = "Um membro da comunidade";
    if (doadorId) {
      const doador = await prisma.usuario.findUnique({
        where: { id: doadorId },
        select: { nome: true },
      });
      if (doador) doadorNome = doador.nome;
    }

    const relatorio = {
      totalInteressados: interessados.length,
      emailsDisparados: 0,
      detalhes: [],
    };

    for (const item of interessados) {
      const user = item.usuario;

      // Dispara o e-mail de aviso
      if (user.notificarEmail && user.email) {
        const resEmail = await enviarNotificacaoEmail({
          destinatarioEmail: user.email,
          destinatarioNome: user.nome,
          livro,
          doadorNome,
        });

        if (resEmail.sucesso) {
          relatorio.emailsDisparados++;
          relatorio.detalhes.push({ usuarioId: user.id, email: user.email, nome: user.nome });
        }
      }
    }

    return relatorio;
  } catch (error) {
    console.error("❌ Erro no processo de notificação de interessados:", error);
    return { erro: error.message };
  }
}

module.exports = {
  notificarInteressadosNoLivro,
  enviarNotificacaoEmail,
};
