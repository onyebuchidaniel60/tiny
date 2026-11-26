import { createHash } from 'node:crypto';
import { db } from './firebase';
import { COLLECTIONS, type SyncOutcome } from './contracts';

export interface Receipt {
  idempotencyKey: string;
  uid: string;
  workspaceId: string;
  commandType: string;
  payloadHash: string;
  outcome: SyncOutcome;
  resultRef?: string;
  errorCode?: string;
  createdAt: unknown;
}

export function payloadHash(payload: unknown): string {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export async function getUserReceipt(uid: string, key: string): Promise<Receipt | null> {
  const snap = await db.collection(COLLECTIONS.users).doc(uid).collection(COLLECTIONS.commandReceipts).doc(key).get();
  return snap.exists ? (snap.data() as Receipt) : null;
}

export async function writeUserReceipt(uid: string, receipt: Receipt): Promise<void> {
  await db.collection(COLLECTIONS.users).doc(uid).collection(COLLECTIONS.commandReceipts).doc(receipt.idempotencyKey).set(receipt);
}

export async function getWorkspaceReceipt(workspaceId: string, key: string): Promise<Receipt | null> {
  const snap = await db.collection(COLLECTIONS.workspaces).doc(workspaceId).collection(COLLECTIONS.commandReceipts).doc(key).get();
  return snap.exists ? (snap.data() as Receipt) : null;
}

export async function writeWorkspaceReceipt(workspaceId: string, receipt: Receipt): Promise<void> {
  await db.collection(COLLECTIONS.workspaces).doc(workspaceId).collection(COLLECTIONS.commandReceipts).doc(receipt.idempotencyKey).set(receipt);
}
