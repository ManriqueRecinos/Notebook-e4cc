'use client';
import { apiPost } from '@/lib/api';

export default function MigrationHelper() {
    const runMigration = async () => {
        try {
            const res = await apiPost('/api/admin/migrate', {});
            alert('Migration finished: ' + JSON.stringify(res));
        } catch (err) {
            alert('Migration failed: ' + err);
        }
    };

    return (
        <div style={{ padding: 20 }}>
            <h1>Migration Helper</h1>
            <button onClick={runMigration} className="btn btn-primary">Run Schema Update (Levels)</button>
        </div>
    );
}
