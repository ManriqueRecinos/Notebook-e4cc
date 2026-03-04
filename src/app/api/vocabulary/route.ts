import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { requireWriteAccess, logActivity } from '@/lib/middleware';
import { errorResponse, UnauthorizedError, ValidationError } from '@/lib/errors';

// GET /api/vocabulary?notebook_id=xxx
export async function GET(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();

        const notebookId = req.nextUrl.searchParams.get('notebook_id');
        if (!notebookId) throw new ValidationError('notebook_id is required');

        const rows = await sql`
      SELECT * FROM vocabulary WHERE notebook_id = ${notebookId} ORDER BY word_english
    `;

        return Response.json(rows);
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/vocabulary
export async function POST(req: NextRequest) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();

        const {
            notebook_id, word_english, word_spanish,
            present, past, past_participle,
            pronunciation, example_sentence, notes,
        } = await req.json();

        if (!notebook_id || !word_english) {
            throw new ValidationError('notebook_id and word_english are required');
        }

        // Get workspace_id from notebook
        const nb = await sql`SELECT workspace_id FROM notebooks WHERE id = ${notebook_id}`;
        if (nb.length === 0) throw new ValidationError('Notebook not found');

        await requireWriteAccess(req, nb[0].workspace_id);

        // INSERT INTO vocabulary
        const rows = await sql`
      INSERT INTO vocabulary (
        notebook_id, word_english, word_spanish,
        present, past, past_participle,
        pronunciation, example_sentence, notes, created_by
      ) VALUES (
        ${notebook_id}, ${word_english}, ${word_spanish || null},
        ${present || null}, ${past || null}, ${past_participle || null},
        ${pronunciation || null}, ${example_sentence || null}, ${notes || null}, ${user.userId}
      )
      RETURNING *
    `;

        await logActivity({
            workspace_id: nb[0].workspace_id,
            notebook_id,
            user_id: user.userId,
            entity_type: 'vocabulary',
            entity_id: rows[0].id,
            action: 'INSERT',
            new_data: { word_english, word_spanish },
        });

        return Response.json(rows[0], { status: 201 });
    } catch (error) {
        return errorResponse(error);
    }
}
