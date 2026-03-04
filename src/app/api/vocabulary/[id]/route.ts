import { NextRequest } from 'next/server';
import sql from '@/lib/db';
import { getUserFromRequest } from '@/lib/auth';
import { requireWriteAccess, logActivity } from '@/lib/middleware';
import { errorResponse, UnauthorizedError, NotFoundError } from '@/lib/errors';

// PATCH /api/vocabulary/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();
        const { id } = await params;

        const existing = await sql`
      SELECT v.*, n.workspace_id FROM vocabulary v
      JOIN notebooks n ON v.notebook_id = n.id
      WHERE v.id = ${id}
    `;
        if (existing.length === 0) throw new NotFoundError('Vocabulary entry not found');

        await requireWriteAccess(req, existing[0].workspace_id);

        const {
            word_english, word_spanish, present, past,
            past_participle, pronunciation, example_sentence, notes,
        } = await req.json();

        // UPDATE vocabulary
        const rows = await sql`
      UPDATE vocabulary SET
        word_english = COALESCE(${word_english || null}, word_english),
        word_spanish = COALESCE(${word_spanish !== undefined ? word_spanish : null}, word_spanish),
        present = COALESCE(${present !== undefined ? present : null}, present),
        past = COALESCE(${past !== undefined ? past : null}, past),
        past_participle = COALESCE(${past_participle !== undefined ? past_participle : null}, past_participle),
        pronunciation = COALESCE(${pronunciation !== undefined ? pronunciation : null}, pronunciation),
        example_sentence = COALESCE(${example_sentence !== undefined ? example_sentence : null}, example_sentence),
        notes = COALESCE(${notes !== undefined ? notes : null}, notes),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

        await logActivity({
            workspace_id: existing[0].workspace_id,
            notebook_id: existing[0].notebook_id,
            user_id: user.userId,
            entity_type: 'vocabulary',
            entity_id: id,
            action: 'UPDATE',
            old_data: { word_english: existing[0].word_english },
            new_data: { word_english: rows[0].word_english },
        });

        return Response.json(rows[0]);
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/vocabulary/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const user = getUserFromRequest(req);
        if (!user) throw new UnauthorizedError();
        const { id } = await params;

        const existing = await sql`
      SELECT v.*, n.workspace_id FROM vocabulary v
      JOIN notebooks n ON v.notebook_id = n.id
      WHERE v.id = ${id}
    `;
        if (existing.length === 0) throw new NotFoundError('Vocabulary entry not found');

        await requireWriteAccess(req, existing[0].workspace_id);

        // DELETE FROM vocabulary
        await sql`DELETE FROM vocabulary WHERE id = ${id}`;

        await logActivity({
            workspace_id: existing[0].workspace_id,
            notebook_id: existing[0].notebook_id,
            user_id: user.userId,
            entity_type: 'vocabulary',
            entity_id: id,
            action: 'DELETE',
            old_data: { word_english: existing[0].word_english },
        });

        return Response.json({ message: 'Vocabulary entry deleted' });
    } catch (error) {
        return errorResponse(error);
    }
}
