/**
 * CollaborationChannel — shared documents (OT ops), tasks, boards, team presence.
 */

import { BaseChannel } from './BaseChannel';
import type { RealtimeEngine } from '../core/RealtimeEngine';
import type { DocumentOperation, TaskUpdatePayload, TeamPresencePayload } from '../types';

export class CollaborationChannel extends BaseChannel {
  #activeDocuments = new Set<string>();
  #activeBoards    = new Set<string>();

  constructor(engine: RealtimeEngine) {
    super(engine, 'collab');
  }

  // ── Documents ────────────────────────────────────────────────────────────────

  joinDocument(docId: string, userId: string): void {
    if (this.#activeDocuments.has(docId)) return;
    this.#activeDocuments.add(docId);
    this.engine.emit('collab:doc:join', { docId, userId }, 'high');
    this.joinRoom(`doc:${docId}`);
  }

  leaveDocument(docId: string, userId: string): void {
    this.#activeDocuments.delete(docId);
    this.engine.emit('collab:doc:leave', { docId, userId }, 'normal');
    this.leaveRoom(`doc:${docId}`);
  }

  applyOperation(op: DocumentOperation): void {
    this.engine.emit('collab:doc:op', op, 'high');
  }

  onOperation(handler: (op: DocumentOperation) => void): () => void {
    return this.onGlobal('collab:doc:op', handler);
  }

  onDocumentSync(handler: (data: { docId: string; content: string; version: number }) => void): () => void {
    return this.onGlobal('collab:doc:sync', handler);
  }

  onDocumentConflict(handler: (data: { docId: string; ops: DocumentOperation[] }) => void): () => void {
    return this.onGlobal('collab:doc:conflict', handler);
  }

  // ── Shared Boards & Tasks ─────────────────────────────────────────────────────

  joinBoard(boardId: string, userId: string): void {
    if (this.#activeBoards.has(boardId)) return;
    this.#activeBoards.add(boardId);
    this.engine.emit('collab:board:join', { boardId, userId }, 'normal');
    this.joinRoom(`board:${boardId}`);
  }

  leaveBoard(boardId: string, userId: string): void {
    this.#activeBoards.delete(boardId);
    this.engine.emit('collab:board:leave', { boardId, userId }, 'normal');
    this.leaveRoom(`board:${boardId}`);
  }

  updateTask(update: TaskUpdatePayload): void {
    this.engine.emit('collab:task:update', update, 'high');
  }

  onTaskUpdate(handler: (update: TaskUpdatePayload) => void): () => void {
    return this.onGlobal('collab:task:update', handler);
  }

  createTask(boardId: string, task: { title: string; status: string; assigneeId?: string; dueDate?: number }): void {
    this.engine.emit('collab:task:create', { boardId, ...task }, 'high');
  }

  onTaskCreated(handler: (task: TaskUpdatePayload) => void): () => void {
    return this.onGlobal('collab:task:created', handler);
  }

  deleteTask(boardId: string, taskId: string, userId: string): void {
    this.engine.emit('collab:task:delete', { boardId, taskId, userId }, 'high');
  }

  onTaskDeleted(handler: (data: { taskId: string; boardId: string }) => void): () => void {
    return this.onGlobal('collab:task:deleted', handler);
  }

  // ── Team Presence & Cursors ───────────────────────────────────────────────────

  onTeamPresence(handler: (data: TeamPresencePayload) => void): () => void {
    return this.onGlobal('collab:presence', handler);
  }

  updateCursor(roomId: string, userId: string, cursor: { x: number; y: number }): void {
    this.engine.emit('collab:cursor', { roomId, userId, cursor }, 'low');
  }

  onCursorUpdate(handler: (data: { userId: string; cursor: { x: number; y: number } }) => void): () => void {
    return this.onGlobal('collab:cursor', handler);
  }

  // ── Shared Tasks (cross-user) ─────────────────────────────────────────────────

  onBoardSync(handler: (data: { boardId: string; tasks: TaskUpdatePayload[] }) => void): () => void {
    return this.onGlobal('collab:board:sync', handler);
  }

  protected override onDestroy(): void {
    // Rooms are cleaned up by BaseChannel teardowns
    this.#activeDocuments.clear();
    this.#activeBoards.clear();
  }
}