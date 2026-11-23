module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      error: "Método não permitido."
    });
  }

  const apiKey = process.env.RAWG_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "Chave da RAWG não configurada."
    });
  }

  const { id } = req.query;

  if (id !== undefined && !/^\d+$/.test(String(id))) {
    return res.status(400).json({
      error: "ID inválido."
    });
  }

  const caminho = id ? `/games/${id}` : "/games";
  const url = new URL(`https://api.rawg.io/api${caminho}`);

  url.searchParams.set("key", apiKey);

  const parametrosPermitidos = [
    "page",
    "page_size",
    "search",
    "genres",
    "platforms",
    "ordering"
  ];

  if (!id) {
    parametrosPermitidos.forEach(parametro => {
      const valor = req.query[parametro];

      if (typeof valor === "string" && valor !== "") {
        url.searchParams.set(parametro, valor);
      }
    });

    const tamanho = Number(req.query.page_size) || 12;

    url.searchParams.set(
      "page_size",
      String(Math.max(1, Math.min(tamanho, 40)))
    );
  }

  try {
    const resposta = await fetch(url);

    if (!resposta.ok) {
      return res.status(resposta.status).json({
        error: "Erro ao consultar a RAWG."
      });
    }

    const dados = await resposta.json();

    delete dados.next;
    delete dados.previous;

    if (!id) {
      const pagina = Number(url.searchParams.get("page")) || 1;
      const tamanho = Number(url.searchParams.get("page_size"));

      dados.next = pagina * tamanho < dados.count;
    }

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600"
    );

    return res.status(200).json(dados);

  } catch {
    return res.status(500).json({
      error: "Não foi possível conectar à RAWG."
    });
  }
};