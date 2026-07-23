import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET - listar empresas
  if (req.method === 'GET') {
    try {
      const { rows } = await sql`SELECT * FROM companies ORDER BY id`;
      const companies = rows.map(r => ({
        id: r.id,
        nome: r.nome,
        cidade: r.cidade,
        link: r.link,
        meuCarrinho: r.meu_carrinho,
        cardapio: r.cardapio,
        certificado: r.certificado,
        responsavel: r.responsavel,
        horarios: typeof r.horarios === 'string' ? JSON.parse(r.horarios) : r.horarios
      }));
      return res.status(200).json(companies);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - criar empresa
  if (req.method === 'POST') {
    try {
      const { id, nome, cidade, link, meuCarrinho, cardapio, certificado, responsavel, horarios } = req.body;
      await sql`
        INSERT INTO companies (id, nome, cidade, link, meu_carrinho, cardapio, certificado, responsavel, horarios)
        VALUES (${id}, ${nome}, ${cidade || 'PETROLINA'}, ${link || ''}, ${meuCarrinho || 'Pendente'}, ${cardapio || 'Pendente'}, ${certificado || 'Pendente'}, ${responsavel || 'Pendente'}, ${JSON.stringify(horarios || ['Pendente'])})
      `;
      return res.status(201).json({ message: 'Empresa criada' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // PUT - atualizar empresa
  if (req.method === 'PUT') {
    try {
      const { id, nome, cidade, link, meuCarrinho, cardapio, certificado, responsavel, horarios } = req.body;
      await sql`
        UPDATE companies SET
          nome = ${nome},
          cidade = ${cidade},
          link = ${link},
          meu_carrinho = ${meuCarrinho},
          cardapio = ${cardapio},
          certificado = ${certificado},
          responsavel = ${responsavel},
          horarios = ${JSON.stringify(horarios)}
        WHERE id = ${id}
      `;
      return res.status(200).json({ message: 'Empresa atualizada' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - remover empresa
  if (req.method === 'DELETE') {
    try {
      const { id } = req.body;
      await sql`DELETE FROM companies WHERE id = ${id}`;
      return res.status(200).json({ message: 'Empresa removida' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
