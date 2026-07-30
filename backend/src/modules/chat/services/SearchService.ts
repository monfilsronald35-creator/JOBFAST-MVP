import { MessageRepository } from '../repositories/MessageRepository.js';
import { RoomRepository }    from '../repositories/RoomRepository.js';
import { AppError }          from '../../../core/errors/AppError.js';
import type { ChatMessage }  from '../types/chat.types.js';

interface SearchOptions {
  query:    string;
  userId:   string;
  roomId?:  string | undefined;
  type?:    'message' | 'file' | 'media' | undefined;
  from?:    string | undefined;
  to?:      string | undefined;
  limit?:   number | undefined;
}

interface SearchResult {
  messages: ChatMessage[];
  total:    number;
}

export const SearchService = {
  async search(opts: SearchOptions): Promise<SearchResult> {
    if (opts.query.length < 2) throw new AppError('Search query too short', 400, 'INVALID_QUERY');

    if (opts.roomId) {
      const member = await RoomRepository.getMember(opts.roomId, opts.userId);
      if (!member) throw new AppError('Not a member of this room', 403, 'FORBIDDEN');
    }

    const searchOpts: Parameters<typeof MessageRepository.search>[1] = {};
    const s = searchOpts as unknown as Record<string, unknown>;
    if (opts.roomId) s['roomId'] = opts.roomId;
    if (opts.limit)  s['limit']  = opts.limit;

    const messages = await MessageRepository.search(opts.query, searchOpts);
    return { messages, total: messages.length };
  },

  async searchFiles(opts: { userId: string; roomId?: string | undefined; limit?: number }): Promise<ChatMessage[]> {
    const searchOpts: Parameters<typeof MessageRepository.search>[1] = {};
    const s = searchOpts as unknown as Record<string, unknown>;
    if (opts.roomId) s['roomId'] = opts.roomId;
    if (opts.limit)  s['limit']  = opts.limit;
    return MessageRepository.search('', searchOpts);
  },
};
