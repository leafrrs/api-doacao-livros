const cors = require("cors");
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  notificarInteressadosNoLivro,
  enviarNotificacaoEmail,
} = require("./services/notificacaoService");

const JWT_SECRET =
  process.env.JWT_SECRET || "chave_padrao_desenvolvimento_trocar_em_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

const prisma = new PrismaClient();
const app = express();

app.use(cors());

app.use(express.json({ limit: '10mb' }));

function validarEmail(email) {
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regexEmail.test(email);
}

function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];

  // O padrão do cabeçalho é: "Bearer <token>"
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ erro: "Token de acesso não fornecido." });
  }
  jwt.verify(token, JWT_SECRET, (err, usuarioDecodificado) => {
    if (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({ erro: "Token de acesso expirado." });
      }
      return res
        .status(403)
        .json({ erro: "Token inválido ou não autorizado." });
    }
    // Anexa as informações do usuário logado na requisição (req.usuario)
    req.usuario = usuarioDecodificado;
    next();
  });
}
// Middleware opcional para checar permissão (ex: apenas ADMIN)
function autorizarPapel(papeisPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !papeisPermitidos.includes(req.usuario.role)) {
      return res
        .status(403)
        .json({ erro: "Acesso negado: permissão insuficiente." });
    }
    next();
  };
}

const CONDICOES_VALIDAS = [
  "NOVO",
  "SEMINOVO",
  "BOM_ESTADO",
  "MARCAS_DE_USO",
  "DESGASTADO",
];
// ==========================================
//          ROTAS DE AUTENTICAÇÃO
// ==========================================
// Rota de Login: emite o token JWT
app.post("/auth/login", async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) {
      return res.status(400).json({ erro: "Email e senha são obrigatórios." });
    }
    // Busca o usuário pelo e-mail
    const usuario = await prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    // Se o usuário não existir, usamos uma mensagem genérica por segurança
    if (!usuario) {
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }
    // Compara a senha informada com o hash salvo no banco
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(401).json({ erro: "Credenciais inválidas." });
    }
    // Gera o token JWT com payload contendo id, email e role
    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        role: usuario.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN },
    );
    // Retorna o token e os dados públicos do usuário
    res.json({
      mensagem: "Login realizado com sucesso!",
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        role: usuario.role,
      },
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res
      .status(500)
      .json({ erro: "Erro interno no servidor ao tentar realizar login." });
  }
});
// Rota de Usuário Autenticado: retorna dados de quem está logado
app.get("/auth/me", autenticarToken, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        bio: true,
        fotoUrl: true,
        corBanner: true,
        notificarEmail: true,
        notificarWhatsapp: true,
        whatsapp: true,
      },
    });
    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }
    res.json(usuario);
  } catch (error) {
    console.error("Erro ao buscar dados do usuário autenticado:", error);
    res.status(500).json({ erro: "Erro interno ao buscar perfil." });
  }
});

// Rota PATCH para atualizar personalização do perfil e dados do leitor
app.patch("/usuarios/perfil", autenticarToken, async (req, res) => {
  try {
    const { nome, bio, fotoUrl, corBanner, notificarEmail, notificarWhatsapp, whatsapp } = req.body;
    const dadosAtualizar = {};

    if (nome !== undefined) {
      const nomeLimpo = String(nome).trim();
      if (!nomeLimpo) {
        return res.status(400).json({ erro: "O nome não pode ser vazio." });
      }
      dadosAtualizar.nome = nomeLimpo;
    }

    if (bio !== undefined) {
      if (bio.length > 300) {
        return res.status(400).json({ erro: "A bio deve ter no máximo 300 caracteres." });
      }
      dadosAtualizar.bio = bio;
    }

    if (fotoUrl !== undefined) {
      dadosAtualizar.fotoUrl = fotoUrl;
    }

    if (corBanner !== undefined) {
      dadosAtualizar.corBanner = corBanner;
    }

    if (notificarEmail !== undefined) {
      dadosAtualizar.notificarEmail = Boolean(notificarEmail);
    }

    if (notificarWhatsapp !== undefined) {
      dadosAtualizar.notificarWhatsapp = Boolean(notificarWhatsapp);
    }

    if (whatsapp !== undefined) {
      dadosAtualizar.whatsapp = whatsapp ? String(whatsapp).trim() : null;
    }

    const usuarioAtualizado = await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: dadosAtualizar,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        bio: true,
        fotoUrl: true,
        corBanner: true,
        notificarEmail: true,
        notificarWhatsapp: true,
        whatsapp: true,
      },
    });

    res.json({
      mensagem: "Perfil atualizado com sucesso!",
      usuario: usuarioAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error);
    res.status(500).json({ erro: "Erro interno ao atualizar o perfil." });
  }
});

// Rota PATCH para trocar a senha do leitor
app.patch("/usuarios/senha", autenticarToken, async (req, res) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ erro: "A senha atual e a nova senha são obrigatórias." });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ erro: "A nova senha deve ter no mínimo 6 caracteres." });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
    });

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    // Verifica se a senha atual está correta
    const senhaValida = await bcrypt.compare(senhaAtual, usuario.senha);
    if (!senhaValida) {
      return res.status(400).json({ erro: "A senha atual informada está incorreta." });
    }

    // Verifica se a nova senha é idêntica à anterior
    const mesmaSenha = await bcrypt.compare(novaSenha, usuario.senha);
    if (mesmaSenha) {
      return res.status(400).json({ erro: "A nova senha deve ser diferente da senha atual." });
    }

    // Criptografa a nova senha e atualiza
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    await prisma.usuario.update({
      where: { id: req.usuario.id },
      data: { senha: novaSenhaHash },
    });

    res.json({ mensagem: "Senha alterada com sucesso!" });
  } catch (error) {
    console.error("Erro ao alterar senha:", error);
    res.status(500).json({ erro: "Erro interno ao alterar senha." });
  }
});

// Rota DELETE para excluir a conta com checagem de senha
app.delete("/usuarios/conta", autenticarToken, async (req, res) => {
  try {
    const { senha } = req.body;

    if (!senha) {
      return res.status(400).json({ erro: "Por favor, digite sua senha para confirmar a exclusão da conta." });
    }

    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
    });

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    // Checagem rigorosa de segurança por senha
    const senhaValida = await bcrypt.compare(senha, usuario.senha);
    if (!senhaValida) {
      return res.status(400).json({ erro: "Senha incorreta. Não foi possível excluir sua conta." });
    }

    // Exclusão em cascata dos dados e da conta
    await prisma.$transaction([
      prisma.favorito.deleteMany({ where: { usuarioId: req.usuario.id } }),
      prisma.livro.deleteMany({ where: { usuarioId: req.usuario.id } }),
      prisma.usuario.delete({ where: { id: req.usuario.id } }),
    ]);

    console.log(`🗑️ [Conta Excluída] Usuário ${usuario.nome} (${usuario.email}) excluiu permanentemente sua conta.`);
    res.json({ mensagem: "Sua conta foi excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir conta:", error);
    res.status(500).json({ erro: "Erro interno ao excluir a conta." });
  }
});

app.post("/usuarios", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;

    if (!nome || !email || !senha) {
      return res
        .status(400)
        .json({ erro: "Nome, email e senha são obrigatórios." });
    }

    if (!validarEmail(email)) {
      return res.status(400).json({ erro: "Formato de e-mail inválido." });
    }

    if (senha.length < 6) {
      return res
        .status(400)
        .json({ erro: "A senha deve ter no mínimo 6 caracteres." });
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email: email.toLowerCase().trim(),
        senha: senhaHash,
        role: "USER",
      },

      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
      },
    });
    res.status(201).json(novoUsuario);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    // P2002 = E-mail duplicado
    if (error.code === "P2002") {
      return res.status(400).json({ erro: "Este e-mail já está em uso." });
    }
    res.status(500).json({ erro: "Erro interno ao tentar criar o usuário." });
  }
});

// ==========================
//      ROTAS DE LIVROS
// ==========================

// 2. Rota para cadastrar um livro para doação
app.post("/livros", autenticarToken, async (req, res) => {
  try {
    const {
      titulo,
      autor,
      descricao,
      isbn,
      anoPublicacao,
      editora,
      capaId,
      condicao,
      relatoLeitura,
    } = req.body;
    // Dono autêntico obtido do token
    const usuarioId = req.usuario.id;
    // Validação de campos obrigatórios
    if (!titulo || !autor) {
      return res.status(400).json({ erro: "Título e autor são obrigatórios." });
    }
    // Validação da condição física (se informada)
    const condicaoFinal = condicao ? condicao.toUpperCase() : "BOM_ESTADO";
    if (!CONDICOES_VALIDAS.includes(condicaoFinal)) {
      return res.status(400).json({
        erro: `Condição inválida. Escolha entre: ${CONDICOES_VALIDAS.join(", ")}`,
      });
    }
    // Validação do limite do relato de leitura (máx 2000 caracteres)
    if (relatoLeitura && relatoLeitura.length > 2000) {
      return res.status(400).json({
        erro: "O relato de leitura deve ter no máximo 2000 caracteres.",
      });
    }
    const novoLivro = await prisma.livro.create({
      data: {
        titulo,
        autor,
        descricao,
        isbn,
        anoPublicacao,
        editora,
        capaId,
        condicao: condicaoFinal,
        relatoLeitura,
        disponivel: true, // Nasce sempre disponível para a comunidade
        usuarioId,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });

    // Dispara notificações automáticas por e-mail e WhatsApp para leitores que favoritaram esse livro
    notificarInteressadosNoLivro(prisma, novoLivro, usuarioId).catch((err) => {
      console.error("Erro assíncrono ao disparar notificações de livro doado:", err);
    });

    res.status(201).json(novoLivro);
  } catch (error) {
    console.error("Erro ao cadastrar livro:", error);
    res.status(500).json({ erro: "Erro interno ao cadastrar o livro." });
  }
});

// Rota PATCH: Atualização parcial segura do exemplar físico
app.patch("/livros/:id", autenticarToken, async (req, res) => {
  try {
    const idDoLivro = parseInt(req.params.id);
    if (isNaN(idDoLivro)) {
      return res
        .status(400)
        .json({ erro: "O ID do livro deve ser um número válido." });
    }
    // Busca o livro no banco
    const livro = await prisma.livro.findUnique({
      where: { id: idDoLivro },
    });
    if (!livro) {
      return res.status(404).json({ erro: "Livro não encontrado." });
    }
    // ========================================================
    // CASO ESPECIAL: AÇÃO "PEGAR LIVRO" (CIRCULAÇÃO DA LEITURA)
    // ========================================================
    if (req.body.acao === "pegar") {
      if (!livro.disponivel) {
        return res
          .status(400)
          .json({ erro: "Este livro já foi retirado por outro usuário." });
      }
      // Impede o dono de pegar o próprio livro
      if (livro.usuarioId === req.usuario.id) {
        return res
          .status(400)
          .json({ erro: "Você já é o doador deste livro." });
      }
      // Transfere a posse do livro para quem está pegando e torna indisponível na estante geral
      const livroPegado = await prisma.livro.update({
        where: { id: idDoLivro },
        data: {
          disponivel: false,
          usuarioId: req.usuario.id, // Novo responsável pelo exemplar
        },
        include: {
          usuario: { select: { id: true, nome: true } },
        },
      });
      return res.json({
        mensagem:
          "Livro resgatado com sucesso! Agora ele está na sua estante pessoal.",
        livro: livroPegado,
      });
    }
    // ========================================================
    // CASO PADRÃO: EDIÇÃO DOS DADOS DO EXEMPLAR
    // ========================================================
    // Validação de permissão: Apenas o Dono ou ADMIN podem editar os dados
    const ehDono = livro.usuarioId === req.usuario.id;
    const ehAdmin = req.usuario.role === "ADMIN";
    if (!ehDono && !ehAdmin) {
      return res.status(403).json({
        erro: "Acesso negado: você não tem permissão para editar este livro.",
      });
    }
    // Bloqueio de campos protegidos (dados bibliográficos e IDs)
    const camposProibidos = [
      "titulo",
      "autor",
      "isbn",
      "editora",
      "anoPublicacao",
      "capaId",
      "id",
      "usuarioId",
    ];
    for (const campo of camposProibidos) {
      if (req.body[campo] !== undefined) {
        return res.status(400).json({
          erro: `O campo '${campo}' é protegido e não pode ser alterado via edição do exemplar.`,
        });
      }
    }
    // Montando o objeto apenas com os campos permitidos enviados
    const dadosParaAtualizar = {};
    // 1. Atualizar condição física
    if (req.body.condicao !== undefined) {
      const condicaoFormatada = req.body.condicao.toUpperCase();
      if (!CONDICOES_VALIDAS.includes(condicaoFormatada)) {
        return res.status(400).json({
          erro: `Condição inválida. Escolha entre: ${CONDICOES_VALIDAS.join(", ")}`,
        });
      }
      dadosParaAtualizar.condicao = condicaoFormatada;
    }
    // 2. Atualizar relato de leitura
    if (req.body.relatoLeitura !== undefined) {
      if (req.body.relatoLeitura && req.body.relatoLeitura.length > 2000) {
        return res.status(400).json({
          erro: "O relato de leitura deve ter no máximo 2000 caracteres.",
        });
      }
      dadosParaAtualizar.relatoLeitura = req.body.relatoLeitura;
    }
    // 3. Atualizar disponibilidade (ex: colocar para circular novamente)
    if (req.body.disponivel !== undefined) {
      if (typeof req.body.disponivel !== "boolean") {
        return res.status(400).json({
          erro: "O campo 'disponivel' deve ser verdadeiro (true) ou falso (false).",
        });
      }
      dadosParaAtualizar.disponivel = req.body.disponivel;
    }
    // 4. Descrição geral
    if (req.body.descricao !== undefined) {
      dadosParaAtualizar.descricao = req.body.descricao;
    }
    // Se o cliente enviou um JSON vazio no PATCH
    if (Object.keys(dadosParaAtualizar).length === 0) {
      return res
        .status(400)
        .json({ erro: "Nenhum campo válido foi fornecido para atualização." });
    }
    // Executa a atualização parcial no Prisma
    const livroAtualizado = await prisma.livro.update({
      where: { id: idDoLivro },
      data: dadosParaAtualizar,
      include: {
        usuario: { select: { id: true, nome: true } },
      },
    });
    // Se o livro foi tornado disponível novamente (redoado para a comunidade), avisa os interessados
    if (dadosParaAtualizar.disponivel === true) {
      notificarInteressadosNoLivro(prisma, livroAtualizado, req.usuario.id).catch((err) => {
        console.error("Erro assíncrono ao notificar redoação de livro:", err);
      });
    }

    res.json({
      mensagem: "Exemplar atualizado com sucesso!",
      livro: livroAtualizado,
    });
  } catch (error) {
    console.error("Erro ao atualizar livro:", error);
    res.status(500).json({ erro: "Erro interno ao atualizar o livro." });
  }
});

// 3. Rota para listar todos os livros do banco local (Estante Geral)
app.get("/livros", async (req, res) => {
  try {
    const livros = await prisma.livro.findMany({
      where: {
        disponivel: true, // Mostra somente os livros livres para doação!
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
    res.json(livros);
  } catch (error) {
    console.error("Erro ao buscar livros locais:", error);
    res.status(500).json({ erro: "Erro interno ao buscar os livros locais." });
  }
});

app.get("/livros/meus", autenticarToken, async (req, res) => {
  try {
    const meusLivros = await prisma.livro.findMany({
      where: {
        usuarioId: req.usuario.id,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
          },
        },
      },
    });
    res.json(meusLivros);
  } catch (error) {
    console.error("Erro ao buscar livros do usuário:", error);
    res.status(500).json({ erro: "Erro interno ao buscar seus livros." });
  }
});
// 4. Rota da FASE 1: Buscar livro por Título (Open Library)
app.get("/livros/buscar", async (req, res) => {
  try {
    const tituloBuscado = req.query.titulo;

    if (!tituloBuscado) {
      return res
        .status(400)
        .json({ erro: "Por favor, informe um título para buscar." });
    }

    // Busca focando em edições em português na Open Library
    const urlDaApiExterna = `https://openlibrary.org/search.json?q=${encodeURIComponent(tituloBuscado)}&language=por&limit=6`;
    const respostaOpenLibrary = await fetch(urlDaApiExterna, {
      headers: { "User-Agent": "ProjetoAcademicoRecode/1.0" },
    });
    // NOVO: Travamos a aplicação se a Open Library estiver fora do ar
    if (!respostaOpenLibrary.ok) {
      throw new Error(
        `Falha de comunicação com a Open Library. Status: ${respostaOpenLibrary.status}`,
      );
    }
    const dados = await respostaOpenLibrary.json();

    const livrosEncontrados = dados.docs.map((livro) => {
      return {
        titulo: livro.title,
        autor: livro.author_name ? livro.author_name[0] : "Autor desconhecido",
        ano_publicacao: livro.first_publish_year,
        isbn: livro.isbn ? livro.isbn[0] : null,
        capa_id: livro.cover_i ? livro.cover_i : null,
      };
    });

    res.json(livrosEncontrados);
  } catch (error) {
    // NOVO: Console.error para diagnóstico local sem expor dados ao usuário
    console.error("Erro na busca por título:", error);
    res
      .status(500)
      .json({ erro: "Erro ao consultar a base de livros externa." });
  }
});
// 5. Rota da FASE 2: Buscar livro por ISBN (Open Library)
app.get("/livros/buscar/isbn/:isbn", async (req, res) => {
  try {
    const isbnParam = req.params.isbn;
    const isbnLimpo = isbnParam.replace(/-/g, "").toUpperCase();
    if (!isbnLimpo) {
      return res.status(400).json({ erro: "ISBN não informado." });
    }
    const isbnRegex = /^(?:\d{13}|\d{9}[\dX])$/;
    if (!isbnRegex.test(isbnLimpo)) {
      return res.status(400).json({
        erro: "Formato de ISBN inválido. Deve conter 13 dígitos numéricos, ou 10 dígitos (onde o último pode ser 'X').",
      });
    }
    const urlDaApiExterna = `https://openlibrary.org/search.json?isbn=${isbnLimpo}`;
    const respostaOpenLibrary = await fetch(urlDaApiExterna, {
      headers: { "User-Agent": "ProjetoAcademicoRecode/1.0" },
    });
    if (!respostaOpenLibrary.ok) {
      throw new Error("Falha de comunicação com a Open Library");
    }
    const dados = await respostaOpenLibrary.json();
    if (dados.numFound === 0 || !dados.docs || dados.docs.length === 0) {
      return res
        .status(404)
        .json({ erro: "Nenhum livro encontrado com este ISBN." });
    }
    const livro = dados.docs[0];
    const livroFormatado = {
      titulo: livro.title,
      autor: livro.author_name ? livro.author_name[0] : "Autor desconhecido",
      isbn: isbnLimpo,
      ano_publicacao: livro.first_publish_year || "Ano desconhecido",
      editora: livro.publisher ? livro.publisher[0] : "Editora desconhecida",
      capa_id: livro.cover_i ? livro.cover_i : null,
    };
    res.json(livroFormatado);
  } catch (error) {
    console.error("Erro ao buscar ISBN:", error);
    res
      .status(500)
      .json({ erro: "Erro interno ao consultar a base de livros externa." });
  }
});

// 6. Rota para deletar um livro do banco local
app.delete("/livros/:id", autenticarToken, async (req, res) => {
  try {
    const idDoLivro = parseInt(req.params.id);
    if (isNaN(idDoLivro)) {
      return res
        .status(400)
        .json({ erro: "O ID do livro deve ser um número válido." });
    }
    // Busca o livro primeiro para conferir quem é o dono
    const livroExistente = await prisma.livro.findUnique({
      where: { id: idDoLivro },
    });
    if (!livroExistente) {
      return res.status(404).json({ erro: "Livro não encontrado." });
    }
    // Regra de autorização: Permite se for o DONO do livro OU se o papel for ADMIN
    const ehDono = livroExistente.usuarioId === req.usuario.id;
    const ehAdmin = req.usuario.role === "ADMIN";
    if (!ehDono && !ehAdmin) {
      return res.status(403).json({
        erro: "Acesso negado: você só pode excluir seus próprios livros.",
      });
    }
    await prisma.livro.delete({
      where: { id: idDoLivro },
    });
    res.json({ mensagem: "Livro removido com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar livro:", error);
    res.status(500).json({ erro: "Erro interno ao tentar remover o livro." });
  }
});

// ========================================================
//          ROTAS DE LISTA DE DESEJOS / FAVORITOS
// ========================================================

// 1. Listar favoritos do usuário autenticado
app.get("/favoritos", autenticarToken, async (req, res) => {
  try {
    const favoritos = await prisma.favorito.findMany({
      where: { usuarioId: req.usuario.id },
      orderBy: { criadoEm: "desc" },
    });
    res.json(favoritos);
  } catch (error) {
    console.error("Erro ao listar favoritos:", error);
    res.status(500).json({ erro: "Erro ao buscar lista de desejos." });
  }
});

// 2. Adicionar livro aos favoritos
app.post("/favoritos", autenticarToken, async (req, res) => {
  try {
    const { titulo, autor, isbn, capaId } = req.body;
    if (!titulo || !String(titulo).trim()) {
      return res.status(400).json({ erro: "O título do livro é obrigatório." });
    }

    const tituloLimpo = String(titulo).trim();

    // Upsert para garantir unicidade por usuário e título
    const favorito = await prisma.favorito.upsert({
      where: {
        usuarioId_titulo: {
          usuarioId: req.usuario.id,
          titulo: tituloLimpo,
        },
      },
      update: {
        autor: autor ? String(autor).trim() : null,
        isbn: isbn ? String(isbn).trim() : null,
        capaId: capaId ? Number(capaId) : null,
      },
      create: {
        titulo: tituloLimpo,
        autor: autor ? String(autor).trim() : null,
        isbn: isbn ? String(isbn).trim() : null,
        capaId: capaId ? Number(capaId) : null,
        usuarioId: req.usuario.id,
      },
    });

    res.status(201).json(favorito);
  } catch (error) {
    console.error("Erro ao adicionar favorito:", error);
    res.status(500).json({ erro: "Erro interno ao salvar favorito." });
  }
});

// 3. Remover livro dos favoritos (por ID ou por título)
app.delete("/favoritos/:idOuTitulo", autenticarToken, async (req, res) => {
  try {
    const { idOuTitulo } = req.params;
    const numId = parseInt(idOuTitulo);

    if (!isNaN(numId)) {
      await prisma.favorito.deleteMany({
        where: {
          id: numId,
          usuarioId: req.usuario.id,
        },
      });
    } else {
      const todos = await prisma.favorito.findMany({
        where: { usuarioId: req.usuario.id },
      });
      const alvo = todos.find(
        (f) => f.titulo.toLowerCase().trim() === decodeURIComponent(idOuTitulo).toLowerCase().trim()
      );
      if (alvo) {
        await prisma.favorito.delete({
          where: { id: alvo.id },
        });
      }
    }

    res.json({ mensagem: "Livro removido dos favoritos com sucesso." });
  } catch (error) {
    console.error("Erro ao remover favorito:", error);
    res.status(500).json({ erro: "Erro interno ao remover favorito." });
  }
});

// 4. Rota para testar disparo imediato de notificação para o usuário logado
app.post("/notificacoes/testar", autenticarToken, async (req, res) => {
  try {
    const usuario = await prisma.usuario.findUnique({
      where: { id: req.usuario.id },
    });

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const { titulo, autor } = req.body;
    const livroSimulado = {
      titulo: titulo || "O Pequeno Príncipe",
      autor: autor || "Antoine de Saint-Exupéry",
      condicao: "BOM_ESTADO",
    };

    const resultado = {
      email: null,
    };

    if (usuario.notificarEmail && usuario.email) {
      resultado.email = await enviarNotificacaoEmail({
        destinatarioEmail: usuario.email,
        destinatarioNome: usuario.nome,
        livro: livroSimulado,
        doadorNome: "Biblioteca Reconecta",
      });
    }

    res.json({
      mensagem: "Teste de notificação por e-mail executado com sucesso!",
      resultado,
    });
  } catch (error) {
    console.error("Erro no teste de notificação:", error);
    res.status(500).json({ erro: "Erro ao executar teste de notificação." });
  }
});

// ==========================
//    INICIANDO O SERVIDOR
// ==========================
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000! 🚀");
});
