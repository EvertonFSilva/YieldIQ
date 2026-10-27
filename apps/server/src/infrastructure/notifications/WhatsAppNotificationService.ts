import * as baileys from '@whiskeysockets/baileys';
import QRCode from 'qrcode';
import axios from 'axios';
import path from 'path';
import os from 'os';
import fs from 'fs';
import pino from 'pino';
import { supabaseAdmin } from '../database/SupabaseClient';
import { LoggerUtils } from '../utils/Logger';

const makeWASocket = (baileys as any).default?.default || (baileys as any).default || (baileys as any).makeWASocket;
const { useMultiFileAuthState, Browsers, fetchLatestBaileysVersion } = baileys as any;

const AUTHENTICATION_DIRECTORY = path.join(process.cwd(), '.baileys_auth');
const SESSION_STORAGE_BUCKET = 'whatsapp-session';

export interface WhatsAppServiceStatus {
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  qrCodeDataUrl: string | null;
  botInformation: { name?: string; identifier?: string } | null;
}

export interface WhatsAppGroupInformation {
  id: string;
  name: string;
}

export class WhatsAppNotificationService {
  private static serviceInstance: WhatsAppNotificationService;
  private socketClient: any = null;
  private connectionStatus: 'disconnected' | 'connecting' | 'qr_ready' | 'connected' = 'disconnected';
  private generatedQrCodeDataUrl: string | null = null;
  private connectedBotInformation: { name?: string; identifier?: string } | null = null;
  private isInitializationInProgress: boolean = false;
  private reconnectionAttemptCount: number = 0;
  private readonly maximumReconnectionAttempts: number = 5;
  private storageSynchronizationTimer: NodeJS.Timeout | null = null;
  private outgoingMessageAcknowledgements = new Map<string, { resolve: (acknowledged: boolean) => void }>();
  private groupMetadataCache = new Map<string, { data: any; timestamp: number }>();
  private readonly groupMetadataTtlInMilliseconds = 10 * 60 * 1000;
  private cachedGroupsList: WhatsAppGroupInformation[] | null = null;
  private cachedGroupsTimestamp: number = 0;
  private groupFetchPromise: Promise<WhatsAppGroupInformation[]> | null = null;

  public static getInstance(): WhatsAppNotificationService {
    if (!WhatsAppNotificationService.serviceInstance) {
      WhatsAppNotificationService.serviceInstance = new WhatsAppNotificationService();
    }
    return WhatsAppNotificationService.serviceInstance;
  }

  private async ensureStorageBucketExists(): Promise<void> {
    try {
      const { data: existingBuckets } = await supabaseAdmin.storage.listBuckets();
      const bucketFound = existingBuckets?.some((bucketItem) => bucketItem.name === SESSION_STORAGE_BUCKET);
      if (!bucketFound) {
        await supabaseAdmin.storage.createBucket(SESSION_STORAGE_BUCKET, { public: false });
      }
    } catch (error) {
      LoggerUtils.error('Failed to verify session storage bucket', error, 'WhatsAppService');
    }
  }

  private async restoreAuthenticationSessionFromStorage(): Promise<void> {
    try {
      await this.ensureStorageBucketExists();
      const { data: storedFiles, error: listError } = await supabaseAdmin.storage
        .from(SESSION_STORAGE_BUCKET)
        .list('', { limit: 500 });

      if (listError || !storedFiles || storedFiles.length === 0) {
        return;
      }

      if (!fs.existsSync(AUTHENTICATION_DIRECTORY)) {
        fs.mkdirSync(AUTHENTICATION_DIRECTORY, { recursive: true });
      }

      for (const fileItem of storedFiles) {
        const fileName = (fileItem as any).name;
        if (!fileName || fileName.startsWith('.')) {
          continue;
        }

        const { data: downloadedData, error: downloadError } = await supabaseAdmin.storage
          .from(SESSION_STORAGE_BUCKET)
          .download(fileName);

        if (downloadError || !downloadedData) {
          continue;
        }

        const fileBuffer = Buffer.from(await downloadedData.arrayBuffer());
        fs.writeFileSync(path.join(AUTHENTICATION_DIRECTORY, fileName), fileBuffer);
      }
    } catch (error) {
      LoggerUtils.error('Failed to restore WhatsApp session from remote storage', error, 'WhatsAppService');
    }
  }

  private async backupAuthenticationSessionToStorage(): Promise<void> {
    try {
      if (!fs.existsSync(AUTHENTICATION_DIRECTORY)) {
        return;
      }

      await this.ensureStorageBucketExists();
      const directoryEntries = fs.readdirSync(AUTHENTICATION_DIRECTORY, { withFileTypes: true });

      for (const directoryEntry of directoryEntries) {
        if (!directoryEntry.isFile() || directoryEntry.name.startsWith('.')) {
          continue;
        }

        const filePath = path.join(AUTHENTICATION_DIRECTORY, directoryEntry.name);
        const fileContent = fs.readFileSync(filePath);
        await supabaseAdmin.storage
          .from(SESSION_STORAGE_BUCKET)
          .upload(directoryEntry.name, fileContent, { upsert: true });
      }
    } catch (error) {
      LoggerUtils.error('Failed to synchronize WhatsApp session to storage', error, 'WhatsAppService');
    }
  }

  private async clearAuthenticationSessionStorage(): Promise<void> {
    try {
      let hasMoreFiles = true;
      while (hasMoreFiles) {
        const { data: files, error: listError } = await supabaseAdmin.storage
          .from(SESSION_STORAGE_BUCKET)
          .list('', { limit: 100 });

        if (listError || !files || files.length === 0) {
          hasMoreFiles = false;
          break;
        }

        const fileNamesToDelete = files.map((fileItem) => fileItem.name);
        await supabaseAdmin.storage.from(SESSION_STORAGE_BUCKET).remove(fileNamesToDelete);
      }
    } catch (error) {
      LoggerUtils.error('Failed to clear session storage bucket', error, 'WhatsAppService');
    }
  }

  private scheduleSessionStorageBackup(): void {
    if (this.storageSynchronizationTimer) {
      clearTimeout(this.storageSynchronizationTimer);
    }
    this.storageSynchronizationTimer = setTimeout(() => {
      this.storageSynchronizationTimer = null;
      this.backupAuthenticationSessionToStorage();
    }, 5000);
  }

  private async retrieveCachedGroupMetadata(targetGroupJid: string): Promise<any | undefined> {
    const cachedEntry = this.groupMetadataCache.get(targetGroupJid);
    if (
      cachedEntry &&
      Date.now() - cachedEntry.timestamp < this.groupMetadataTtlInMilliseconds
    ) {
      return cachedEntry.data;
    }

    if (!this.socketClient) {
      return undefined;
    }

    try {
      const metadata = await this.socketClient.groupMetadata(targetGroupJid);
      if (metadata) {
        this.groupMetadataCache.set(targetGroupJid, { data: metadata, timestamp: Date.now() });
      }
      return metadata;
    } catch {
      return cachedEntry?.data;
    }
  }

  public async initialize(): Promise<void> {
    if (this.socketClient || this.isInitializationInProgress) {
      return;
    }

    this.isInitializationInProgress = true;
    this.connectionStatus = 'connecting';

    try {
      if (!fs.existsSync(AUTHENTICATION_DIRECTORY)) {
        fs.mkdirSync(AUTHENTICATION_DIRECTORY, { recursive: true });
      }

      await this.restoreAuthenticationSessionFromStorage();
      const { state: authenticationState, saveCreds: persistCredentials } =
        await useMultiFileAuthState(AUTHENTICATION_DIRECTORY);

      let detectedVersion = [2, 3000, 1015901307];
      try {
        const versionResult = await fetchLatestBaileysVersion();
        detectedVersion = versionResult.version;
      } catch {
      }

      const socketInstance = makeWASocket({
        version: detectedVersion,
        auth: authenticationState,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }) as any,
        browser: Browsers.ubuntu('Chrome'),
        syncFullHistory: false,
        markOnlineOnConnect: false,
        generateHighQualityLinkPreview: true,
        cachedGroupMetadata: async (groupJid: string) => this.retrieveCachedGroupMetadata(groupJid)
      });

      this.socketClient = socketInstance;

      socketInstance.ev.on('groups.update', (updatedGroups: any[]) => {
        for (const group of updatedGroups || []) {
          if (group?.id) {
            this.groupMetadataCache.delete(group.id);
          }
        }
        this.cachedGroupsList = null;
      });

      socketInstance.ev.on('group-participants.update', (participantUpdate: any) => {
        if (participantUpdate?.id) {
          this.groupMetadataCache.delete(participantUpdate.id);
        }
      });

      socketInstance.ev.on('messages.update', (messageUpdates: any[]) => {
        for (const updateItem of messageUpdates || []) {
          const messageKeyId = updateItem.key?.id;
          if (!messageKeyId || !updateItem.key?.fromMe) {
            continue;
          }

          const registeredAcknowledgement = this.outgoingMessageAcknowledgements.get(messageKeyId);
          if (!registeredAcknowledgement) {
            continue;
          }

          if (updateItem.status === 0) {
            this.outgoingMessageAcknowledgements.delete(messageKeyId);
            registeredAcknowledgement.resolve(false);
          } else if (updateItem.status !== undefined && updateItem.status >= 2) {
            this.outgoingMessageAcknowledgements.delete(messageKeyId);
            registeredAcknowledgement.resolve(true);
          }
        }
      });

      socketInstance.ev.on('creds.update', async (credentialUpdate: any) => {
        await persistCredentials(credentialUpdate);
        this.scheduleSessionStorageBackup();
      });

      socketInstance.ev.on('connection.update', async (connectionUpdate: any) => {
        const { connection, lastDisconnect, qr } = connectionUpdate;

        if (qr && this.connectionStatus !== 'connected') {
          try {
            this.generatedQrCodeDataUrl = await QRCode.toDataURL(qr);
            this.connectionStatus = 'qr_ready';
          } catch (error) {
            LoggerUtils.error('Failed to convert QR code to data URL', error, 'WhatsAppService');
          }
        }

        if (connection === 'close') {
          const disconnectStatusCode = (lastDisconnect?.error as any)?.output?.statusCode;

          if (disconnectStatusCode === 401 || disconnectStatusCode === 405) {
            if (fs.existsSync(AUTHENTICATION_DIRECTORY)) {
              fs.rmSync(AUTHENTICATION_DIRECTORY, { recursive: true, force: true });
            }
            await this.clearAuthenticationSessionStorage();
            this.reconnectionAttemptCount = this.maximumReconnectionAttempts;
          }

          if (disconnectStatusCode === 515) {
            this.reconnectionAttemptCount = 0;
          }

          this.connectionStatus = 'disconnected';
          this.generatedQrCodeDataUrl = null;
          this.connectedBotInformation = null;
          this.socketClient = null;
          this.isInitializationInProgress = false;

          for (const [, acknowledgementEntry] of this.outgoingMessageAcknowledgements) {
            acknowledgementEntry.resolve(false);
          }
          this.outgoingMessageAcknowledgements.clear();

          if (this.storageSynchronizationTimer) {
            clearTimeout(this.storageSynchronizationTimer);
            this.storageSynchronizationTimer = null;
          }

          if (this.reconnectionAttemptCount < this.maximumReconnectionAttempts) {
            this.reconnectionAttemptCount++;
            setTimeout(() => {
              this.initialize();
            }, 5000);
          }
        } else if (connection === 'open') {
          LoggerUtils.info('WhatsApp connection opened successfully');
          this.connectionStatus = 'connected';
          this.generatedQrCodeDataUrl = null;
          this.reconnectionAttemptCount = 0;

          this.connectedBotInformation = {
            name: socketInstance.user?.name || 'YieldIQ Bot',
            identifier: socketInstance.user?.id
          };
          this.isInitializationInProgress = false;
          this.backupAuthenticationSessionToStorage();
        }
      });
    } catch (error) {
      LoggerUtils.error('Failed to initialize WhatsApp connection', error, 'WhatsAppService');
      this.connectionStatus = 'disconnected';
      this.socketClient = null;
      this.isInitializationInProgress = false;
    }
  }

  public isConnected(): boolean {
    return this.connectionStatus === 'connected';
  }

  public getStatus(): WhatsAppServiceStatus {
    return {
      status: this.connectionStatus,
      qrCodeDataUrl: this.connectionStatus === 'connected' ? null : this.generatedQrCodeDataUrl,
      botInformation: this.connectedBotInformation
    };
  }

  public async disconnect(): Promise<void> {
    if (this.socketClient) {
      try {
        await this.socketClient.logout();
      } catch {
      }
      this.socketClient = null;
    }

    if (fs.existsSync(AUTHENTICATION_DIRECTORY)) {
      try {
        fs.rmSync(AUTHENTICATION_DIRECTORY, { recursive: true, force: true });
      } catch {
      }
    }

    this.connectionStatus = 'disconnected';
    this.generatedQrCodeDataUrl = null;
    this.connectedBotInformation = null;
    this.isInitializationInProgress = false;
    this.reconnectionAttemptCount = 0;

    if (this.storageSynchronizationTimer) {
      clearTimeout(this.storageSynchronizationTimer);
      this.storageSynchronizationTimer = null;
    }

    await this.clearAuthenticationSessionStorage();
  }

  private waitForAcknowledgement(messageKeyIdentifier: string, timeoutInMilliseconds: number): Promise<boolean> {
    return new Promise((resolveAcknowledgement) => {
      const timeoutTimer = setTimeout(() => {
        this.outgoingMessageAcknowledgements.delete(messageKeyIdentifier);
        resolveAcknowledgement(true);
      }, timeoutInMilliseconds);

      this.outgoingMessageAcknowledgements.set(messageKeyIdentifier, {
        resolve: (isDelivered: boolean) => {
          clearTimeout(timeoutTimer);
          resolveAcknowledgement(isDelivered);
        }
      });
    });
  }

  private async resolveDestinationJid(destination: string): Promise<string | null> {
    if (!destination) {
      return null;
    }

    const sanitizedDestination = destination.trim();

    if (sanitizedDestination.endsWith('@g.us') || sanitizedDestination.endsWith('@s.whatsapp.net')) {
      return sanitizedDestination;
    }

    if (/[a-zA-Z]/.test(sanitizedDestination)) {
      const activeGroups = await this.getParticipatingGroups();
      const matchedGroup = activeGroups.find(
        (groupItem) =>
          groupItem.name.trim().toLowerCase() === sanitizedDestination.toLowerCase() ||
          groupItem.id === sanitizedDestination
      );

      if (matchedGroup) {
        return matchedGroup.id;
      }
      return null;
    }

    let sanitizedDigits = sanitizedDestination.replace(/\D/g, '');
    if (
      sanitizedDigits.length >= 10 &&
      sanitizedDigits.length <= 11 &&
      !sanitizedDigits.startsWith('55')
    ) {
      sanitizedDigits = '55' + sanitizedDigits;
    }

    if (!sanitizedDigits.endsWith('@s.whatsapp.net') && !sanitizedDigits.endsWith('@g.us')) {
      if (sanitizedDigits.length > 15) {
        sanitizedDigits = sanitizedDigits + '@g.us';
      } else {
        sanitizedDigits = sanitizedDigits + '@s.whatsapp.net';
      }
    }

    return sanitizedDigits;
  }

  public async sendMessage(
    recipientIdentifier: string,
    messageContent: string,
    originatingUserId?: string
  ): Promise<boolean> {
    if (!this.socketClient || this.connectionStatus !== 'connected') {
      return false;
    }

    try {
      const targetJid = await this.resolveDestinationJid(recipientIdentifier);
      if (!targetJid) {
        return false;
      }

      const sendResult = await this.socketClient.sendMessage(targetJid, { text: messageContent });
      const delivered = await this.waitForAcknowledgement(sendResult?.key?.id, 12000);

      if (!delivered) {
        return false;
      }

      if (originatingUserId) {
        const currentTimestampIso = new Date().toISOString();
        supabaseAdmin
          .from('api_telemetry')
          .insert({
            user_id: originatingUserId,
            created_at: currentTimestampIso,
            endpoint: 'whatsapp_message',
            method: 'SEND'
          })
          .then(undefined, () => {});
      }

      return true;
    } catch (error) {
      LoggerUtils.error(`Failed to send WhatsApp message to ${recipientIdentifier}`, error, 'WhatsAppService');
      return false;
    }
  }

  public async sendDocument(
    recipientIdentifier: string,
    remoteDocumentUrl: string,
    suggestedFileName: string,
    documentCaption: string,
    originatingUserId?: string
  ): Promise<boolean> {
    if (!this.socketClient || this.connectionStatus !== 'connected') {
      return false;
    }

    const sanitizedFileName = (suggestedFileName || 'document.pdf').replace(/[^a-zA-Z0-9._-]/g, '_');
    const temporaryFilePath = path.join(
      os.tmpdir(),
      `yieldiq_document_${Date.now()}_${sanitizedFileName}`
    );

    try {
      const targetJid = await this.resolveDestinationJid(recipientIdentifier);
      if (!targetJid) {
        return false;
      }

      const downloadResponse = await axios.get(remoteDocumentUrl, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxContentLength: 50 * 1024 * 1024
      });

      const fileBuffer = Buffer.from(downloadResponse.data);
      const documentHeaderPrefix = fileBuffer.subarray(0, 5).toString('latin1');
      if (fileBuffer.length < 5 || documentHeaderPrefix !== '%PDF-') {
        throw new Error('Downloaded binary content is not a valid PDF document');
      }

      fs.writeFileSync(temporaryFilePath, fileBuffer);
      const documentMimeType = downloadResponse.headers?.['content-type'] || 'application/pdf';

      const sendResult = await this.socketClient.sendMessage(targetJid, {
        document: fs.readFileSync(temporaryFilePath),
        fileName: sanitizedFileName,
        caption: documentCaption || '',
        mimetype: documentMimeType
      });

      const delivered = await this.waitForAcknowledgement(sendResult?.key?.id, 12000);
      if (!delivered) {
        return false;
      }

      if (originatingUserId) {
        const currentTimestampIso = new Date().toISOString();
        supabaseAdmin
          .from('api_telemetry')
          .insert({
            user_id: originatingUserId,
            created_at: currentTimestampIso,
            endpoint: 'whatsapp_document',
            method: 'SEND'
          })
          .then(undefined, () => {});
      }

      return true;
    } catch (error) {
      LoggerUtils.error(`Failed to send WhatsApp document to ${recipientIdentifier}`, error, 'WhatsAppService');
      return false;
    } finally {
      try {
        if (fs.existsSync(temporaryFilePath)) {
          fs.unlinkSync(temporaryFilePath);
        }
      } catch {
      }
    }
  }

  public async getParticipatingGroups(): Promise<WhatsAppGroupInformation[]> {
    if (!this.socketClient) {
      return [];
    }

    if (this.cachedGroupsList && Date.now() - this.cachedGroupsTimestamp < 60000) {
      return this.cachedGroupsList;
    }

    if (this.groupFetchPromise) {
      return this.groupFetchPromise;
    }

    this.groupFetchPromise = (async () => {
      try {
        const participatingGroups = await this.socketClient.groupFetchAllParticipating();
        const currentTimestamp = Date.now();

        for (const groupObject of Object.values(participatingGroups) as any[]) {
          if (groupObject?.id) {
            this.groupMetadataCache.set(groupObject.id, {
              data: groupObject,
              timestamp: currentTimestamp
            });
          }
        }

        this.cachedGroupsList = Object.values(participatingGroups).map((groupObject: any) => ({
          id: groupObject.id,
          name: groupObject.subject
        }));
        this.cachedGroupsTimestamp = Date.now();
        return this.cachedGroupsList;
      } catch (error) {
        LoggerUtils.error('Failed to retrieve participating WhatsApp groups', error, 'WhatsAppService');
        return this.cachedGroupsList || [];
      } finally {
        this.groupFetchPromise = null;
      }
    })();

    return this.groupFetchPromise;
  }
}

export const whatsAppService = WhatsAppNotificationService.getInstance();
