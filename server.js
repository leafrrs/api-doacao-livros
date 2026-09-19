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
    const { titulo, autor, descricao, usuarioId } = req.body;

    const novoLivro = await prisma.livro.create({
      data: {
        titulo,
        autor,
        descricao,
        usuarioId, // ID do usuário dono do livro (no nosso teste, o João é o id 1)
      },
    });

    res.status(201).json(novoLivro);
  } catch (error) {
    res.status(400).json({ erro: "Não foi possível cadastrar o livro." });
  }
});

// 3. Rota para listar todos os livros (Estante Geral)
app.get("/livros/buscar", async (req, res) => {
  try {
    // 1. Pegamos o título que o usuário digitou na URL (ex: ?titulo=senhor dos aneis)
    const tituloBuscado = req.query.titulo;
    if (!tituloBuscado) {
      return res
        .status(400)
        .json({ erro: "Por favor, informe um título para buscar." });
    }
    // 2. Fazemos a requisição para a API externa com o nosso "crachá"
    const urlDaApiExterna = `https://openlibrary.org/search.json?title=${tituloBuscado}&limit=5`;

    const respostaOpenLibrary = await fetch(urlDaApiExterna, {
      headers: {
        "User-Agent": "ProjetoAcademicoRecode/1.0", // Identificação amigável
      },
    });

    // 3. Transformamos a resposta deles em JSON
    const dados = await respostaOpenLibrary.json();
    // 4. "Limpamos" os dados (Pegamos apenas o array 'docs' e extraímos o que importa)
    const livrosEncontrados = dados.docs.map((livro) => {
      return {
        titulo: livro.title,
        autor: livro.author_name ? livro.author_name[0] : "Autor desconhecido",
        ano_publicacao: livro.first_publish_year,
        isbn: livro.isbn ? livro.isbn[0] : null,
        capa_id: livro.cover_i ? livro.cover_i : null,
      };
    });
    // 5. Devolvemos para o nosso cliente os dados limpinhos
    res.json(livrosEncontrados);
  } catch (error) {
    console.error("Erro ao buscar na Open Library:", error);
    res
      .status(500)
      .json({ erro: "Erro ao consultar a base de livros externa." });
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
