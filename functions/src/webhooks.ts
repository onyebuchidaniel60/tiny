import { createHmac, timingSafeEqual } from 'node:crypto';
import { logger } from 'firebase-functions';
import { onRequest } from 'firebase-functions/v2/https';
import { db } from './shared/firebase';
import { COLLECTIONS, REGION } from './shared/contracts';
import { normalizeNigerianPhone } from './domain/phone';
import { guardianPhoneKey, isStartKeyword, isStopKeyword } from './domain/guardian';

function verifySignature(rawBody: Buffer, signature: string | undefined, secret: string | undefined): boolean {
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = signature.replace(/^sha256=/i, '').trim();
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(provided, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

function text(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export const esmsInbound = onRequest({ region: REGION, cors: false }, async (request, response) => {
  const rawBody = request.rawBody ?? Buffer.from(JSON.stringify(request.body ?? {}));
  const signature = request.header('x-webhook-signature') ?? undefined;
  if (!verifySignature(rawBody, signature, process.env.ESMS_WEBHOOK_SECRET)) {
    response.status(401).json({ error: 'INVALID_SIGNATURE' });
    return;
  }

  const body = request.body ?? {};
  const providerEventId = text(body.eventId) || text(body.messageId) || text(body.id);
  if (!providerEventId) {
    response.status(400).json({ error: 'MISSING_EVENT_ID' });
    return;
  }
  const receiptRef = db.collection(COLLECTIONS.webhookReceipts).doc(providerEventId);
  if ((await receiptRef.get()).exists) {
    response.status(200).json({ ok: true, duplicate: true });
    return;
  }
  await receiptRef.set({
    receiptId: providerEventId,
    provider: 'esms',
    providerEventId,
    payloadHash: createHmac('sha256', process.env.ESMS_WEBHOOK_SECRET ?? 'missing').update(rawBody).digest('hex'),
    signatureValid: true,
    eventType: 'message.inbound',
    processedStatus: 'processing',
    receivedAt: new Date(),
  });

  const sender = normalizeNigerianPhone(text(body.from) || text(body.sender));
  const messageText = text(body.text) || text(body.message);
  if (!sender || !messageText) {
    await receiptRef.update({ processedStatus: 'rejected', errorCode: 'INVALID_SENDER_OR_TEXT', processedAt: new Date() });
    response.status(200).json({ ok: true });
    return;
  }

  if (isStopKeyword(messageText) || isStartKeyword(messageText)) {
    await receiptRef.update({ processedStatus: 'processed', processedAt: new Date() });
    response.status(200).json({ ok: true, consent: isStopKeyword(messageText) ? 'opted_out' : 'reopt_in_pending' });
    return;
  }

  const match = messageText.match(/^\s*TINY\s+([A-Z0-9]{8})\s+(.+)$/i);
  const schoolCode = match?.[1]?.toUpperCase();
  const routedText = match?.[2]?.trim() ?? messageText.trim();
  if (!schoolCode) {
    await receiptRef.update({ processedStatus: 'processed', processedAt: new Date(), note: 'ROUTING_CODE_REQUIRED' });
    response.status(200).json({ ok: true, routing: 'CODE_REQUIRED' });
    return;
  }

  const workspaceSnap = await db.collection(COLLECTIONS.workspaces).where('schoolCode', '==', schoolCode).limit(2).get();
  if (workspaceSnap.size !== 1) {
    await receiptRef.update({ processedStatus: 'processed', processedAt: new Date(), note: 'AMBIGUOUS_OR_UNKNOWN_SCHOOL' });
    response.status(200).json({ ok: true, routing: 'AMBIGUOUS_OR_UNKNOWN' });
    return;
  }
  const workspaceId = workspaceSnap.docs[0].id;
  const secret = process.env.PHONE_HASH_SECRET;
  if (!secret) {
    await receiptRef.update({ processedStatus: 'failed', errorCode: 'PHONE_HASH_SECRET_MISSING', processedAt: new Date() });
    response.status(503).json({ error: 'TEMPORARILY_UNAVAILABLE' });
    return;
  }
  const phoneKey = guardianPhoneKey(workspaceId, sender, secret);
  const phoneKeySnap = await db.collection(COLLECTIONS.workspaces).doc(workspaceId).collection(COLLECTIONS.phoneKeys).doc(phoneKey).get();
  if (!phoneKeySnap.exists) {
    await receiptRef.update({ processedStatus: 'processed', processedAt: new Date(), note: 'UNVERIFIED_SENDER' });
    response.status(200).json({ ok: true });
    return;
  }
  const guardianId = String(phoneKeySnap.data()?.guardianId ?? '');
  const guardianSnap = await db.collection(COLLECTIONS.workspaces).doc(workspaceId).collection(COLLECTIONS.guardians).doc(guardianId).get();
  if (!guardianSnap.exists || guardianSnap.data()?.verificationStatus !== 'verified' || guardianSnap.data()?.consentStatus !== 'opted_in') {
    await receiptRef.update({ processedStatus: 'processed', processedAt: new Date(), note: 'GUARDIAN_NOT_ELIGIBLE' });
    response.status(200).json({ ok: true });
    return;
  }

  const conversationId = `${workspaceId}_${guardianId}`;
  const conversationRef = db.collection(COLLECTIONS.workspaces).doc(workspaceId).collection(COLLECTIONS.conversations).doc(conversationId);
  const now = new Date();
  await db.runTransaction(async (transaction) => {
    const conversation = await transaction.get(conversationRef);
    if (!conversation.exists) {
      transaction.set(conversationRef, {
        conversationId,
        workspaceId,
        guardianId,
        pupilId: null,
        channel: 'sms',
        status: 'waiting_teacher',
        lastMessageAt: now,
        lastMessageDirection: 'inbound',
        createdAt: now,
        updatedAt: now,
        version: 1,
      });
    } else {
      transaction.update(conversationRef, {
        status: 'waiting_teacher',
        lastMessageAt: now,
        lastMessageDirection: 'inbound',
        updatedAt: now,
      });
    }
    transaction.set(conversationRef.collection(COLLECTIONS.messages).doc(providerEventId), {
      messageId: providerEventId,
      workspaceId,
      conversationId,
      direction: 'inbound',
      senderType: 'guardian',
      guardianId,
      pupilId: null,
      body: routedText,
      locale: guardianSnap.data()?.preferredLocale ?? 'en',
      provider: 'esms',
      providerMessageId: providerEventId,
      status: 'received',
      createdAt: now,
      updatedAt: now,
    });
  });
  await receiptRef.update({ processedStatus: 'processed', processedAt: new Date() });
  logger.info('Inbound parent SMS accepted', { providerEventId, workspaceId });
  response.status(200).json({ ok: true });
});

export const esmsDelivery = onRequest({ region: REGION, cors: false }, async (request, response) => {
  const rawBody = request.rawBody ?? Buffer.from(JSON.stringify(request.body ?? {}));
  const signature = request.header('x-webhook-signature') ?? undefined;
  if (!verifySignature(rawBody, signature, process.env.ESMS_WEBHOOK_SECRET)) {
    response.status(401).json({ error: 'INVALID_SIGNATURE' });
    return;
  }
  const body = request.body ?? {};
  const providerEventId = text(body.eventId) || text(body.messageId);
  const providerMessageId = text(body.messageId);
  const providerStatus = text(body.status).toLowerCase();
  if (!providerEventId || !providerMessageId) {
    response.status(400).json({ error: 'MISSING_EVENT_ID' });
    return;
  }
  const receiptRef = db.collection(COLLECTIONS.webhookReceipts).doc(`delivery_${providerEventId}`);
  if ((await receiptRef.get()).exists) {
    response.status(200).json({ ok: true, duplicate: true });
    return;
  }
  const status = providerStatus === 'delivered' ? 'delivered' : providerStatus === 'failed' ? 'failed' : 'accepted';
  const messages = await db.collectionGroup(COLLECTIONS.messages).where('providerMessageId', '==', providerMessageId).limit(10).get();
  for (const message of messages.docs) {
    await message.ref.update({ status, updatedAt: new Date() });
  }
  await receiptRef.set({
    receiptId: `delivery_${providerEventId}`,
    provider: 'esms',
    providerEventId,
    payloadHash: createHmac('sha256', process.env.ESMS_WEBHOOK_SECRET ?? 'missing').update(rawBody).digest('hex'),
    signatureValid: true,
    eventType: 'message.delivery',
    processedStatus: 'processed',
    receivedAt: new Date(),
    processedAt: new Date(),
  });
  response.status(200).json({ ok: true });
});
