import { sql } from '@vercel/postgres';

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id TEXT PRIMARY KEY,
        nome TEXT NOT NULL,
        cidade TEXT DEFAULT 'PETROLINA',
        link TEXT,
        meu_carrinho TEXT DEFAULT 'Pendente',
        cardapio TEXT DEFAULT 'Pendente',
        certificado TEXT DEFAULT 'Pendente',
        responsavel TEXT DEFAULT 'Pendente',
        horarios JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS allocations (
        id SERIAL PRIMARY KEY,
        company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        tech TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        span INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS blocked_slots (
        id SERIAL PRIMARY KEY,
        tech TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tech, date, time)
      )
    `;

    // Seed default companies if empty
    const { rows } = await sql`SELECT COUNT(*) as count FROM companies`;
    if (parseInt(rows[0].count) === 0) {
      await sql`INSERT INTO companies (id, nome, cidade, link, meu_carrinho, cardapio, certificado, responsavel, horarios) VALUES
        ('74051', 'SORVETES NESTLE VILAREJO', 'PETROLINA', 'sorvetesnestle.meusoftcom.com.br', 'Não liberado', 'Recebido, Não Cadastrado', 'Não recebido', 'Cli Thais Nestlé Vilarejo', '["30/07 (16h) - Instalação + Treinamento","31/07 (16h) - Continuação de treinamento","01/08 (17h) - Virada de sistema"]'),
        ('74041', 'SORVETES NESTLE SHOPPING', 'PETROLINA', 'sorvetesnetle.meusoftcom.com.br', 'Pendente', '✅', '✅', 'Timoteo Gerente Sorvetes Nestle River', '["31/07 (9h) - Instalação + Treinamento","01/08 (9h) - Virada de sistema"]'),
        ('74039', 'PASTELANDIA', 'PETROLINA', 'pastelandiapetrolina.meusoftcom.com.br', 'Não liberado', 'Não recebido', 'Não recebido', 'Pendente', '["Pendente"]'),
        ('74053', 'PASTELANDIA VILAREJO', 'PETROLINA', 'pastelandiavilarejo.meusoftcom.com.br', 'Não liberado', 'Recebido, não cadastrado', 'Não recebido', 'Pendente', '["Pendente"]'),
        ('74054', 'TORTTERIA SUICA RIVER SHOPPING', 'PETROLINA', 'tortteriasuica.meusoftcom.com.br', 'Não liberado', 'Não recebido', 'Não recebido', 'Pendente', '["Pendente"]')
      `;
    }

    return res.status(200).json({ message: 'Banco inicializado com sucesso!' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
