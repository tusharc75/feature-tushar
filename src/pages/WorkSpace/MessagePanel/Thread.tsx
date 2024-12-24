import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useEffect, useState } from 'react';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { cn } from 'src/constants/helpers';
import SendMessage from 'src/pages/WorkSpace/MessagePanel/SendMessage';
import { Message } from 'src/pages/WorkSpace/types';
import { formatDateWithTodayYestarday } from 'src/pages/WorkSpace/utils';
import { DisplaySingleMessage, MoreMenuAndDeleteConfirmDialog } from './Messages';

const Thread = ({ message, onClose, socket, channelId, deleteMessage, open, channelData }) => {
  const [messages, setMessages] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, _id: null });

  //
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState<Message>(null);
  const [editingMessage, setEditingMessage] = useState(null);
  //

  useEffect(() => {
    setMessages(message?.replies);
  }, [message?.replies]);

  const handleMenuClick = (event, message: Message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessage(message);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMessage(null);
  };

  const handleEdit = () => {
    setEditingMessage(selectedMessage);
  };

  const handleEditComplete = () => {
    setEditingMessage(null);
  };

  return (
    <>
      <div
        className={cn(
          'thread absolute bottom-0 right-0 top-0 z-10 flex min-w-[var(--thread-bar-width)] max-w-[var(--thread-bar-width)] flex-grow flex-col rounded-md bg-[var(--dark-primary,white)] shadow-lg transition-transform duration-300 [border:1px_solid_var(--common-border-color)] [transform:translateX(100%)] dark:[border:1px_solid_var(--common-border-color)] md:w-[40%]',
          open && '[transform:translateX(0)]'
        )}
      >
        <div className="flex items-center justify-between p-[10px_12px_10px_16px] [border-bottom:1px_solid_var(--common-border-color)]">
          <h3>Thread</h3>
          <IconButton size="small" onClick={onClose}>
            <Close />
          </IconButton>
        </div>
        <div className="flex-grow overflow-auto">
          <div className="sticky top-0 z-10 bg-[var(--dark-primary,white)] pt-2">
            <DisplaySingleMessage
              key={message?._id}
              message={message}
              selectedMessage={selectedMessage}
              editingMessage={editingMessage}
              channelId={channelId}
              socket={socket}
              handleEditComplete={handleEditComplete}
              handleMenuClick={handleMenuClick}
              messageTimeFormatter={(date) => formatDateWithTodayYestarday(date, {})}
              channelData={channelData}
            />
          </div>
          {messages !== null ? (
            <ul className=" list-none">
              <li className="mb- list-none">
                <div className="relative my-[20px] h-[1px] bg-[var(--common-border-color)]">
                  <p
                    className={`absolute left-0 rounded-lg bg-[var(--dark-primary,white)] p-2 px-2 
                    text-center text-gray-400 [top:50%] [transform:translateY(-50%)]`}
                  >
                    {messages?.length} replies
                  </p>
                </div>
                <ul className="list-none space-y-5 px-3">
                  {messages?.map((message) => (
                    <>
                      <DisplaySingleMessage
                        key={message._id}
                        message={message}
                        selectedMessage={selectedMessage}
                        editingMessage={editingMessage}
                        channelId={channelId}
                        socket={socket}
                        handleEditComplete={handleEditComplete}
                        handleMenuClick={handleMenuClick}
                        messageTimeFormatter={(date) => formatDateWithTodayYestarday(date, {})}
                        channelData={channelData}
                      />
                    </>
                  ))}
                </ul>
              </li>
            </ul>
          ) : (
            <div className="p-3">
              <CommonSkeleton lenArray={[...Array(2).keys()]} xs={12} sm={12} md={12} lg={12} />
            </div>
          )}
        </div>
        <div className="footer">
          <SendMessage channelId={channelId} socket={socket} messageId={message?._id} editorId={'from-thread'} channelData={channelData} />
        </div>

        <MoreMenuAndDeleteConfirmDialog
          anchorEl={anchorEl}
          handleMenuClose={handleMenuClose}
          selectedMessage={selectedMessage}
          handleEdit={handleEdit}
          setShowConfirmBox={setShowConfirmBox}
          showConfirmBox={showConfirmBox}
          deleteMessage={deleteMessage}
        />
      </div>
    </>
  );
};

export default Thread;
