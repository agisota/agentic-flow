/**
 * AgentDB integration for vector storage and retrieval
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export interface VectorDoc {
  id: string;
  text: string;
  embedding: number[];
  metadata?: Record<string, any>;
  timestamp: number;
}

export class VectorDB {
  private db: Database.Database;

  constructor(dbPath?: string) {
    if (!dbPath) {
      const dataDir = join(homedir(), '.calm-flow');
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }
      dbPath = join(dataDir, 'vectors.db');
    }

    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        text TEXT NOT NULL,
        embedding BLOB NOT NULL,
        metadata TEXT,
        timestamp INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_timestamp ON documents(timestamp);
    `);
  }

  insert(doc: VectorDoc): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO documents (id, text, embedding, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);

    const embeddingBlob = Buffer.from(new Float32Array(doc.embedding).buffer);
    const metadataJson = doc.metadata ? JSON.stringify(doc.metadata) : null;

    stmt.run(doc.id, doc.text, embeddingBlob, metadataJson, doc.timestamp);
  }

  insertBatch(docs: VectorDoc[]): void {
    const insert = this.db.prepare(`
      INSERT OR REPLACE INTO documents (id, text, embedding, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = this.db.transaction((docs: VectorDoc[]) => {
      for (const doc of docs) {
        const embeddingBlob = Buffer.from(new Float32Array(doc.embedding).buffer);
        const metadataJson = doc.metadata ? JSON.stringify(doc.metadata) : null;
        insert.run(doc.id, doc.text, embeddingBlob, metadataJson, doc.timestamp);
      }
    });

    insertMany(docs);
  }

  search(queryVec: number[], k: number = 5): Array<{ id: string; text: string; distance: number }> {
    const stmt = this.db.prepare('SELECT id, text, embedding FROM documents');
    const rows = stmt.all() as Array<{ id: string; text: string; embedding: Buffer }>;

    // Compute cosine distances
    const results = rows.map(row => {
      const embedding = new Float32Array(row.embedding.buffer);
      const distance = this.cosineSimilarity(queryVec, Array.from(embedding));
      return {
        id: row.id,
        text: row.text,
        distance: 1 - distance, // Convert similarity to distance
      };
    });

    // Sort by distance and return top-k
    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, k);
  }

  getById(id: string): VectorDoc | null {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE id = ?');
    const row = stmt.get(id) as any;

    if (!row) return null;

    return {
      id: row.id,
      text: row.text,
      embedding: Array.from(new Float32Array(row.embedding.buffer)),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      timestamp: row.timestamp,
    };
  }

  count(): number {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM documents');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  clear(): void {
    this.db.exec('DELETE FROM documents');
  }

  close(): void {
    this.db.close();
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return dot / (normA * normB || 1e-6);
  }
}
