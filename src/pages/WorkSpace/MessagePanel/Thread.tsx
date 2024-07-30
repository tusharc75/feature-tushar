import { useState, useEffect } from 'react';
import { Dialog, IconButton } from '@material-ui/core';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { groupByDate } from './Messages';
import SendMessage from 'src/pages/WorkSpace/MessagePanel/SendMessage';
import moment from 'moment';
import { cn, dateFormat } from 'src/constants/helpers';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { Delete } from '@material-ui/icons';
import { useData } from 'src/StateProvider/Provider';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const Thread = ({ message, onClose, socket, channelId, deleteMessage, open }) => {
  const [messages, setMessages] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState({ open: false, _id: null });

  const {
    state: {
      user: { user }
    }
  } = useData();

  useEffect(() => {
    setMessages(groupByDate(message?.replies || []));
  }, [message?.replies]);

  return (
    <div
      className={cn(
        'thread absolute bottom-0 right-0 top-0 z-10 h-[calc(100vh-390px)] min-w-[360px] flex-grow bg-[var(--dark-primary,white)] shadow-md transition-all duration-300 [transform:translateX(100%)] dark:[border:1px_solid_var(--common-border-color)] md:w-[40%]',
        open && '[transform:translateX(0)]'
      )}
    >
      <CustomDialogHeader title={`Thread`} onClose={onClose} showRequiredLabel={false} />
      <div>
        {messages !== null ? (
          <ul className="mt-8 list-none">
            {Object.keys(messages).map((date) => (
              <li key={date} className="mb- list-none">
                <div className="relative my-[20px] h-[1px] bg-[var(--common-border-color)]">
                  <p
                    className={`absolute rounded-lg bg-[var(--dark-primary,white)] p-2 px-2 text-center 
                    text-gray-400 [border:1px_solid_var(--common-border-color)] [left:50%] [top:50%] [transform:translate(-50%,_-50%)]`}
                  >
                    {moment(date, dateFormat).format('MMMM Do YYYY')}
                  </p>
                </div>
                <ul className="list-none space-y-5 px-3">
                  {messages[date].map((message) => (
                    <li key={message._id} className="list-none">
                      <div className="flex items-end gap-2">
                        <p className="user text-[15px] font-bold">{message.user?.optionLabel}</p>
                        <span className="text-[12px] font-normal">{moment(message.date).format('hh:mm A')}</span>
                      </div>
                      <p className="message" dangerouslySetInnerHTML={{ __html: message.message }}></p>
                      {message?.user?.optionValue === user?._id && (
                        <>
                          <HtmlTooltip title={'Delete'}>
                            <IconButton onClick={() => setShowConfirmBox({ open: true, _id: message?._id })} size={'small'}>
                              <Delete color="error" />
                            </IconButton>
                          </HtmlTooltip>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-3">
            <CommonSkeleton lenArray={[...Array(2).keys()]} xs={12} sm={12} md={12} lg={12} />
          </div>
        )}
        <div className="footer">
          <SendMessage channelId={channelId} socket={socket} messageId={message?._id} editorId={'from-thread'} />
        </div>
      </div>
      {showConfirmBox.open && (
        <ConfirmationDialog
          open={showConfirmBox.open}
          message={`Are you sure you want to delete Reply?`}
          onClose={() => {
            setShowConfirmBox({ open: false, _id: null });
          }}
          onOk={() => {
            deleteMessage(showConfirmBox._id);
            setShowConfirmBox({ open: false, _id: null });
          }}
        />
      )}
    </div>
  );
};

export default Thread;
