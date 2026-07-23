import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const sql = neon(process.env.DATABASE_URL);

  // GET - listar alocações
  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT * FROM allocations ORDER BY date, time`;
      const allocations = rows.map(r => ({
        id: r.id,
        companyId: r.company_id,
        tech: r.tech,
        date: r.date,
        time: r.time,
        span: r.span
      }));
      return res.status(200).json(allocations);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - criar alocação
  if (req.method === 'POST') {
    try {
      const { companyId, tech, date, time, span } = req.body;
      const rows = await sql`
        INSERT INTO allocations (company_id, tech, date, time, span)
        VALUES (${companyId}, ${tech}, ${date}, ${time}, ${span || 1})
        RETURNING id
      `;
      return res.status(201).json({ id: rows[0].id, message: 'Alocação criada' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - remover alocação
  if (req.method === 'DELETE') {
    try {
      const { id, companyId, date, time, tech } = req.body;
      if (id) {
        await sql`DELETE FROM allocations WHERE id = ${id}`;
      } else {
        await sql`DELETE FROM allocations WHERE company_id = ${companyId} AND date = ${date} AND time = ${time} AND tech = ${tech}`;
      }
      return res.status(200).json({ message: 'Alocação removida' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
