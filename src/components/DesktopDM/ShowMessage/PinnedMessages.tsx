import React, { memo, useMemo } from 'react';
import { RenderAvatar } from 'src/components/DesktopDM/ShowMessage/helperComponents';
import { Message } from 'src/components/DesktopDM/types';

const PinnedMessagesImpl = ({ focusMessage, messages }: { focusMessage: (messageId: string) => void; messages: { [key: string]: Message[] } }) => {
  const pinndedMessges = useMemo(() => {
    return messages
      ? Object.values(messages)
          .flat()
          ?.filter((message) => message['pinned'] === true)
      : [];
  }, [messages]);
  if (pinndedMessges.length === 0) return null;
  return (
    <div className="sticky top-0 z-10 flex w-full items-center justify-between border-b bg-white p-2 text-sm font-semibold text-gray-900 dark:bg-slate-800 dark:text-white">
      <span>Pinned Messages</span>
      <span className="flex gap-2">
        {pinndedMessges.map((message) => {
          return (
            <div onClick={() => focusMessage(message._id)} className="cursor-pointer" key={message._id}>
              <RenderAvatar message={message} key={message._id} />
            </div>
          );
        })}
      </span>
    </div>
  );
};

const PinnedMessages = memo(PinnedMessagesImpl) as typeof PinnedMessagesImpl;

export default PinnedMessages;
