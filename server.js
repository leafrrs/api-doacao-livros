const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const app = express();

// Isso permite que a nossa API entenda dados no formato JSON
app.use(express.json());

// ==========================
//    ROTAS DE USUÁRIOS
// ==========================

// 1. Rota para cadastrar um novo usuário
app.post("/usuarios", async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    // Validação Antecipada (Fail Fast)
    if (!nome || !email || !senha) {
      return res
        .status(400)
        .json({ erro: "Nome, email e senha são obrigatórios." });
    }
    const novoUsuario = await prisma.usuario.create({
      data: { nome, email, senha },
    });
    res.status(201).json(novoUsuario);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);

    // P2002 = Erro de campo único (Unique constraint failed) - Email já existe
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
app.post("/livros", async (req, res) => {
  try {
    const {
      titulo,
      autor,
      descricao,
      usuarioId,
      isbn,
      anoPublicacao,
      editora,
      capaId,
    } = req.body;
    // Validação Antecipada (Fail Fast)
    if (!titulo || !autor || !usuarioId) {
      return res.status(400).json({
        erro: "Título, autor e ID do usuário doador são obrigatórios.",
      });
    }
    const novoLivro = await prisma.livro.create({
      data: {
        titulo,
        autor,
        descricao,
        usuarioId,
        isbn,
        anoPublicacao,
        editora,
        capaId,
      },
    });
    res.status(201).json(novoLivro);
  } catch (error) {
    console.error("Erro ao cadastrar livro:", error);

    // P2003 = Erro de chave estrangeira (Foreign key constraint failed) - Usuário não existe
    if (error.code === "P2003") {
      return res
        .status(404)
        .json({ erro: "O usuário informado não existe no sistema." });
    }
    res.status(500).json({ erro: "Erro interno ao cadastrar o livro." });
  }
});
// 3. Rota para listar todos os livros do banco local (Estante Geral)
app.get("/livros", async (req, res) => {
  try {
    const livros = await prisma.livro.findMany({
      include: {
        // Em vez de "true", usamos "select" para escolher os campos exatos
        dono: {
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
// 4. Rota da FASE 1: Buscar livro por Título (Open Library)
app.get("/livros/buscar", async (req, res) => {
  try {
    const tituloBuscado = req.query.titulo;

    if (!tituloBuscado) {
      return res
        .status(400)
        .json({ erro: "Por favor, informe um título para buscar." });
    }

    const urlDaApiExterna = `https://openlibrary.org/search.json?title=${tituloBuscado}&language=por&limit=5`;
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
app.delete("/livros/:id", async (req, res) => {
  try {
    const idDoLivro = parseInt(req.params.id);
    // NOVO: Validação se o ID é um número válido
    if (isNaN(idDoLivro)) {
      return res
        .status(400)
        .json({ erro: "O ID do livro deve ser um número válido." });
    }
    await prisma.livro.delete({
      where: { id: idDoLivro },
    });
    res.json({ mensagem: "Livro removido com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar livro:", error);

    // NOVO: Separando os erros usando o código do Prisma
    // P2025 = "Record to delete does not exist"
    if (error.code === "P2025") {
      return res
        .status(404)
        .json({ erro: "Livro não encontrado ou já deletado." });
    }
    // Se for qualquer outro erro (banco fora do ar, erro de conexão, etc)
    res.status(500).json({ erro: "Erro interno ao tentar remover o livro." });
  }
});

// ==========================
//    INICIANDO O SERVIDOR
// ==========================
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000! 🚀");
});
