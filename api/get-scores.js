import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const sql = neon(process.env.DATABASE_URL);
        // Uzima top 10 najvećih rezultata sortirano opadajuće
        const scores = await sql`
            SELECT player_name, score 
            FROM scores 
            ORDER BY score DESC 
            LIMIT 10
        `;

        return res.status(200).json({ success: true, scores });
    } catch (error) {
        console.error('Greška pri čitanju baze:', error);
        return res.status(500).json({ success: false, error: 'Greška na serveru' });
    }
}