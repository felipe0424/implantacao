import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (!dbUrl) return res.status(500).json({ error: 'DATABASE_URL não configurada' });
  const sql = neon(dbUrl);

  // GET - listar bloqueios
  if (req.method === 'GET') {
    try {
      const rows = await sql`SELECT * FROM blocked_slots ORDER BY date, time`;
      const blocked = rows.map(r => ({
        id: r.id,
        tech: r.tech,
        date: r.date,
        time: r.time
      }));
      return res.status(200).json(blocked);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // POST - bloquear horário
  if (req.method === 'POST') {
    try {
      const { tech, date, time } = req.body;
      await sql`
        INSERT INTO blocked_slots (tech, date, time)
        VALUES (${tech}, ${date}, ${time})
        ON CONFLICT (tech, date, time) DO NOTHING
      `;
      return res.status(201).json({ message: 'Horário bloqueado' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  // DELETE - desbloquear horário
  if (req.method === 'DELETE') {
    try {
      const { tech, date, time } = req.body;
      await sql`DELETE FROM blocked_slots WHERE tech = ${tech} AND date = ${date} AND time = ${time}`;
      return res.status(200).json({ message: 'Horário desbloqueado' });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
