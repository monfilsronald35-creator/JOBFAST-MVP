import React, { memo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

/**
 * VirtualizedMessageList — Efficient virtualized list for chat messages.
 * Uses @tanstack/react-virtual for rendering only visible messages.
 */
export const VirtualizedMessageList = memo(function VirtualizedMessageList({
  messages = [],
  renderMessage,
  className = '',
}) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 10,
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > 0 && parentRef.current) {
      rowVirtualizer.scrollToIndex(messages.length - 1, { align: 'end' });
    }
  }, [messages.length, rowVirtualizer]);

  return (
    <div
      ref={parentRef}
      className={`overflow-y-auto ${className}`}
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const message = messages[virtualRow.index];
          return (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {renderMessage ? renderMessage(message, virtualRow.index) : (
                <div className="px-4 py-2 text-sm text-slate-200">
                  {message?.content ?? ''}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default VirtualizedMessageList;