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
    // Pegamos os dados que o usuário enviou na requisição
    const { nome, email, senha } = req.body;

    // Pedimos ao Prisma para salvar no banco de dados
    const novoUsuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha,
      },
    });

    // Retornamos o usuário criado com o status 201 (Created)
    res.status(201).json(novoUsuario);
  } catch (error) {
    res.status(400).json({
      erro: "Não foi possível criar o usuário. O email já existe ou faltam dados.",
    });
  }
});

// ==========================
//      ROTAS DE LIVROS
// ==========================

// 2. Rota para cadastrar um livro para doação
app.post("/livros", async (req, res) => {
  try {
    // Agora desestruturamos também os campos opcionais
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
    const novoLivro = await prisma.livro.create({
      data: {
        titulo,
        autor,
        descricao,
        usuarioId,
        // Passamos os novos campos para o Prisma salvar no banco
        isbn,
        anoPublicacao,
        editora,
        capaId,
      },
    });
    res.status(201).json(novoLivro);
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível cadastrar o livro." });
  }
});
// 3. Rota para listar todos os livros do banco local (Estante Geral)
app.get("/livros", async (req, res) => {
  try {
    const livros = await prisma.livro.findMany({
      include: { dono: true },
    });
    res.json(livros);
  } catch (error) {
    res.status(500).json({ erro: "Erro ao buscar os livros locais." });
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

// 4. Rota para deletar um livro (A rota que você sugeriu!)
app.delete("/livros/:id", async (req, res) => {
  try {
    const idDoLivro = parseInt(req.params.id); // Pega o número que vem na URL

    await prisma.livro.delete({
      where: { id: idDoLivro },
    });

    res.json({ mensagem: "Livro removido com sucesso!" });
  } catch (error) {
    res.status(400).json({ erro: "Livro não encontrado." });
  }
});

// ==========================
//    INICIANDO O SERVIDOR
// ==========================
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000! 🚀");
});
