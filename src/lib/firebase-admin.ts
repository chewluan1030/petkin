import fs from 'node:fs';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getFirebaseProjectId(): string | undefined {
  if (process.env.FIREBASE_PROJECT_ID?.trim()) {
    return process.env.FIREBASE_PROJECT_ID.trim();
  }
  try {
    const configUrl = new URL('../../firebase-applet-config.json', import.meta.url);
    const parsed = JSON.parse(fs.readFileSync(configUrl, 'utf8')) as {
      projectId?: string;
    };
    return parsed.projectId;
  } catch {
    return process.env.VITE_FIREBASE_PROJECT_ID?.trim();
  }
}

if (!getApps().length) {
  const projectId = getFirebaseProjectId();
  initializeApp(projectId ? { projectId } : undefined);
}

export const adminAuth = getAuth();
