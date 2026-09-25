import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const sql = neon(process.env.DATABASE_URL);

        // Čita limit iz URL-a: ?limit=10 ili ?limit=100
        let limit = parseInt(req.query.limit, 10);

        // Ako limit nije validan, koristi 10.
        // Maksimalno dozvoljavamo 100.
        if (isNaN(limit) || limit < 1) {
            limit = 10;
        }

        limit = Math.min(limit, 100);

        const scores = await sql`
            SELECT player_name, score
            FROM scores
            ORDER BY score DESC
            LIMIT ${limit}
        `;

        return res.status(200).json({
            success: true,
            scores
        });

    } catch (error) {
        console.error('Greška pri čitanju baze:', error);

        return res.status(500).json({
            success: false,
            error: 'Greška na serveru'
        });
    }
}