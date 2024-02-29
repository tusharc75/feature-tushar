import { Avatar, Chip, ListItem, Typography } from '@material-ui/core';
import { Check, Group } from '@material-ui/icons';
import moment from 'moment';
import { ForwardedRef, forwardRef, useMemo } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { displayCardDate } from 'src/constants/helpers';
import { getUserAvatar } from './utils';

export const HistoryItem = ({ data, userId, handleClick }) => {
  const formatTime = (time: string) => moment(time).format('HH:MM');

  const isUnseen = useMemo(() => data?.unseen > 0, [data]);

  const userAvatar = getUserAvatar(data);

  return (
    <ListItem
      button
      divider
      onClick={() => handleClick(data)}
      className={`p-0 dark:[border-bottom:1px_solid_var(--common-border-color)_!important] [border-bottom:1px_solid_#F4F4F4_!important] `}
    >
      <div className="flex items-center md:gap-[17px] gap-[15px] py-[10px] w-full px-[20px]">
        <div className=" basis-[38px]">
          <div className="rounded-full bg-[var(--dark-secondary,#F4F4F4)] w-[38px] h-[38px] relative">
            <Avatar alt={data.chatTitle} src={userAvatar} className="[width:38px_!important] [height:38px_!important]" />
          </div>
        </div>
        <div className="flex-grow">
          <h4
            className={`text-[12px] font-medium mb-[8px] leading-[22px] ${isUnseen ? 'dark:text-white text-[var(--primary-text)] font-semibold' : 'text-[#6B6F77] dark:text-gray-300'
              }  `}
          >
            {data.chatTitle}{' '}
            {data?.users.length > 2 && (
              <HtmlTooltip
                title={
                  <>
                    {data?.users.map((u) => (
                      <Typography>{`${u?.firstName} ${u?.lastName}`}</Typography>
                    ))}
                  </>
                }
              >
                <Chip variant="outlined" color="secondary" label="Group" size="small" icon={<Group />} />
              </HtmlTooltip>
            )}
          </h4>
          <div className="flex justify-between gap-2" title={data.message?.message ? data.message?.message : "'New chat'"}>
            <h5
              className={`${isUnseen ? 'dark:text-white text' : 'text-[var(--dark-secondary-text,_#718496)]'
                } text-[11px] font-normal mb-[2px] line-clamp-1`}
            >
              {data?.message?.userid === userId ? 'You:' : ''}&nbsp;
              <span className={`  ${isUnseen ? 'unseen' : ''}`}>{data.message?.message ? data.message?.message : "'New chat'"}</span>
            </h5>
            <p className="text-[var(--dark-secondary-text,_#718496)] text-[11px] font-normal">{formatTime(data.message.date)}</p>
          </div>
        </div>
      </div>
    </ListItem>
  );
};

export const NotificationItem = forwardRef((props: { handleClick: any; data: any, isReplayVisible: (data: any) => boolean }, ref: ForwardedRef<any>) => {
  const { handleClick, data, isReplayVisible } = props;
  const splittedTitle = data.title.split(' ') as string[];
  let notificationMessage = '';
  let userName = '';
  for (const [index, word] of splittedTitle.entries()) {
    if (index < splittedTitle.length - 6) {
      userName += word + ' ';
    } else {
      notificationMessage += word + ' ';
    }
  }
  const className = `${data.read ? 'opacity-70 text-gray-500' : ''}`;

  return (
    <ListItem
      aria-label={data.title}
      className={`p-0 dark:[border-bottom:1px_solid_var(--common-border-color)_!important] [border-bottom:1px_solid_#F4F4F4_!important] `}
      key={data._id}
      ref={ref}
    >
      <div className={`flex items-start md:gap-[17px] gap-[15px] p-[20px] w-full `}>
        <div className=" basis-[38px]">
          <div className="rounded-full bg-[var(--dark-secondary,#F4F4F4)] w-[38px] h-[38px] relative">
            <Avatar src={data.avatar} alt={data.chatterName || data.title || ''} className="[width:38px_!important] [height:38px_!important]" />
          </div>
        </div>
        <div className="flex-grow">
          <h4
            className={`text-[12px] font-medium mb-[8px] [&>strong]:font-semibold dark:[&>strong]:font-bold leading-[22px] text-[#6B6F77] dark:text-gray-300 [&>strong]:text-[var(--primary-text)] ${className}`}
          >
            <strong className=" capitalize">{userName}</strong> <span>{notificationMessage}</span>
          </h4>
          <p className={`text-[var(--dark-secondary-text,_#718496)] text-[11px] font-normal mb-[8px] ${className}`}>{displayCardDate(data?.date)}</p>
          <h5
            className={`text-[var(--dark-secondary-text,_#6B6F77)] text-[12px] font-medium mb-[12px] p-[10px_12px] bg-[var(--dark-secondary,_white)] rounded-[8px] shadow-[0px_4px_40px_0px_rgba(0,_0,_0,_0.06)] max-w-fit ${className}`}
          >
            {data.description || '--'}
          </h5>
          {isReplayVisible(data) &&
            <button
              onClick={() => {
                handleClick(data);
              }}
              tabIndex={0}
              className={`bg-[var(--primary)] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90 hover:scale-110 focus-within:[outline:2px_solid_var(--new-theme-color)] transition-all duration-300 dark:bg-[#163340] shadow-none border-0 outline-[transparent] text-white p-[4px_14px] rounded-[4px] text-[13px] font-semibold cursor-pointer poppins`}
            >
              Reply
            </button>
          }
        </div>
      </div>
    </ListItem>
  );
});

export const SingleUser = ({ handleClick, data, selected }) => {
  return (
    <ListItem
      button
      aria-label={data.title}
      className={`p-0 dark:[border-bottom:1px_solid_var(--common-border-color)_!important] [border-bottom:1px_solid_#F4F4F4_!important] rounded-sm `}
      key={data._id}
      onClick={() => {
        handleClick(data);
      }}
      selected={selected}
    >
      <div className="flex items-center md:gap-[17px] gap-[15px] py-[10px] w-full px-2" title={data.name}>
        <div className=" basis-[40px]">
          <div className="rounded-full bg-[var(--dark-secondary,#F4F4F4)] w-[40px] h-[40px] relative">
            <Avatar src={data.avatar} className="w-[40px] h-[40px]" />
          </div>
        </div>
        <div className="flex-grow flex justify-between">
          <h4 className="text-[12px] line-clamp-1 font-medium  [&>strong]:font-semibold dark:[&>strong]:font-bold leading-[22px] text-[#6B6F77] dark:text-gray-300 [&>strong]:text-[var(--primary-text)]">
            {data.name}
          </h4>
          {selected && <Check />}
        </div>
      </div>
    </ListItem>
  );
};
