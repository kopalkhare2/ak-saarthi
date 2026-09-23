import { NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

// GET: Download a backup of the entire SQLite database
export async function GET() {
  try {
    const auth = await requireSession(['advisor']);
    if ('response' in auth) return auth.response;

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');

    if (!fs.existsSync(dbPath)) {
      return NextResponse.json({ error: 'Database file not found' }, { status: 404 });
    }

    // Create backups directory
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    // Create timestamped backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `aksaarthi-backup-${timestamp}.db`;
    const backupPath = path.join(backupsDir, backupFileName);

    // Copy the database file
    fs.copyFileSync(dbPath, backupPath);

    // Read the backup and return as downloadable file
    const fileBuffer = fs.readFileSync(backupPath);
    const headers = new Headers();
    headers.set('Content-Type', 'application/x-sqlite3');
    headers.set('Content-Disposition', `attachment; filename="${backupFileName}"`);
    headers.set('Content-Length', fileBuffer.length.toString());

    return new NextResponse(fileBuffer, { status: 200, headers });
  } catch (error) {
    console.error('Backup failed:', error);
    return NextResponse.json({ error: 'Failed to create database backup' }, { status: 500 });
  }
}
