import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { player_name, score } = req.body;
        
        // Konektuje se preko environment varijable koju ćeš podesiti na Vercelu
        const sql = neon(process.env.DATABASE_URL);

        await sql`
            INSERT INTO scores (player_name, score) 
            VALUES (${player_name}, ${score})
        `;

        return res.status(200).json({ success: true, message: 'Rezultat spašen!' });
    } catch (error) {
        console.error('Greška pri bazi:', error);
        return res.status(500).json({ success: false, error: 'Greška na serveru' });
    }
}