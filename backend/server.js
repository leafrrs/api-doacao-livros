const cors = require("cors");
const express = require("express");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET =
  process.env.JWT_SECRET || "chave_padrao_desenvolvimento_trocar_em_prod";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

const prisma = new PrismaClient();
const app = express();

app.use(cors());

app.use(express.json());

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

// Rota PATCH para atualizar personalização do perfil (Bio, Foto e Cor do Banner)
app.patch("/usuarios/perfil", autenticarToken, async (req, res) => {
  try {
    const { nome, bio, fotoUrl, corBanner } = req.body;
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

// ==========================
//    INICIANDO O SERVIDOR
// ==========================
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000! 🚀");
});
