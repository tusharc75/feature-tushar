import { Avatar, Chip, ListItem, Typography } from '@mui/material';
import { Check, Group } from '@mui/icons-material';
import { ForwardedRef, forwardRef, useMemo } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { displayCardDate } from 'src/constants/helpers';
import { getUserAvatar } from './utils';
import dayjs from 'dayjs';

export const HistoryItem = ({ data, userId, handleClick }) => {
  const formatTime = (time: string) => dayjs.utc(time).tz().format('HH:MM');

  const isUnseen = useMemo(() => data?.unseen > 0, [data]);

  const userAvatar = getUserAvatar(data);

  return (
    <ListItem
      button
      divider
      onClick={() => handleClick(data)}
      className={`p-0 [border-bottom:1px_solid_#F4F4F4_!important] dark:[border-bottom:1px_solid_var(--common-border-color)_!important] `}
    >
      <div className="flex w-full items-center gap-[15px] px-[20px] py-[10px] md:gap-[17px]">
        <div className=" basis-[38px]">
          <div className="relative h-[38px] w-[38px] rounded-full bg-[var(--dark-secondary,#F4F4F4)]">
            <Avatar alt={data.chatTitle} src={userAvatar} className="[height:38px_!important] [width:38px_!important]" />
          </div>
        </div>
        <div className="flex-grow">
          <h4
            className={`mb-[8px] text-[12px] font-medium leading-[22px] ${
              isUnseen ? 'font-semibold text-[var(--primary-text)] dark:text-white' : 'text-[#6B6F77] dark:text-gray-300'
            }  `}
          >
            {data.chatTitle}{' '}
            {data?.users.length > 2 && (
              <HtmlTooltip title={<>{data?.users.map((u) => <Typography>{`${u?.firstName} ${u?.lastName}`}</Typography>)}</>}>
                <Chip variant="outlined" color="secondary" label="Group" size="small" icon={<Group />} />
              </HtmlTooltip>
            )}
          </h4>
          <div className="flex justify-between gap-2" title={data.message?.message ? data.message?.message : "'New chat'"}>
            <h5
              className={`${
                isUnseen ? 'text dark:text-white' : 'text-[var(--dark-secondary-text,_#718496)]'
              } mb-[2px] line-clamp-1 text-[11px] font-normal`}
            >
              {data?.message?.userid === userId ? 'You:' : ''}&nbsp;
              <span className={`  ${isUnseen ? 'unseen' : ''}`}>{data.message?.message ? data.message?.message : "'New chat'"}</span>
            </h5>
            <p className="text-[11px] font-normal text-[var(--dark-secondary-text,_#718496)]">{formatTime(data.message.date)}</p>
          </div>
        </div>
      </div>
    </ListItem>
  );
};

export const NotificationItem = forwardRef(
  (props: { handleClick: any; data: any; isReplayVisible: (data: any) => boolean }, ref: ForwardedRef<any>) => {
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
        className={`p-0 [border-bottom:1px_solid_#F4F4F4_!important] dark:[border-bottom:1px_solid_var(--common-border-color)_!important] `}
        key={data._id}
        ref={ref}
      >
        <div className={`flex w-full items-start gap-[15px] p-[20px] md:gap-[17px] `}>
          <div className=" basis-[38px]">
            <div className="relative h-[38px] w-[38px] rounded-full bg-[var(--dark-secondary,#F4F4F4)]">
              <Avatar src={data.avatar} alt={data.chatterName || data.title || ''} className="[height:38px_!important] [width:38px_!important]" />
            </div>
          </div>
          <div className="flex-grow">
            <h4
              className={`mb-[8px] text-[12px] font-medium leading-[22px] text-[#6B6F77] dark:text-gray-300 [&>strong]:font-semibold [&>strong]:text-[var(--primary-text)] dark:[&>strong]:font-bold ${className}`}
            >
              <strong className=" capitalize">{userName}</strong> <span>{notificationMessage}</span>
            </h4>
            <p className={`mb-[8px] text-[11px] font-normal text-[var(--dark-secondary-text,_#718496)] ${className}`}>
              {displayCardDate(data?.date)}
            </p>
            <h5
              className={`mb-[12px] max-w-fit rounded-[8px] bg-[var(--dark-secondary,_white)] p-[10px_12px] text-[12px] font-medium text-[var(--dark-secondary-text,_#6B6F77)] shadow-[0px_4px_40px_0px_rgba(0,_0,_0,_0.06)] ${className}`}
            >
              {data.description || '--'}
            </h5>
            {isReplayVisible(data) && (
              <button
                onClick={() => {
                  handleClick(data);
                }}
                tabIndex={0}
                className={`poppins cursor-pointer rounded-[4px] border-0 bg-[var(--primary)] p-[4px_14px] text-[13px] font-semibold text-white shadow-none outline-[transparent] transition-all duration-300 focus-within:[outline:2px_solid_var(--new-theme-color)] hover:scale-110 hover:opacity-90 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#163340]`}
              >
                Reply
              </button>
            )}
          </div>
        </div>
      </ListItem>
    );
  }
);

export const SingleUser = ({ handleClick, data, selected }) => {
  return (
    <ListItem
      button
      aria-label={data.title}
      className={`rounded-sm p-0 [border-bottom:1px_solid_#F4F4F4_!important] dark:[border-bottom:1px_solid_var(--common-border-color)_!important] `}
      key={data._id}
      onClick={() => {
        handleClick(data);
      }}
      selected={selected}
    >
      <div className="flex w-full items-center gap-[15px] px-2 py-[10px] md:gap-[17px]" title={data.name}>
        <div className=" basis-[40px]">
          <div className="relative h-[40px] w-[40px] rounded-full bg-[var(--dark-secondary,#F4F4F4)]">
            <Avatar src={data.avatar} className="h-[40px] w-[40px]" />
          </div>
        </div>
        <div className="flex flex-grow justify-between">
          <h4 className="line-clamp-1 text-[12px] font-medium  leading-[22px] text-[#6B6F77] dark:text-gray-300 [&>strong]:font-semibold [&>strong]:text-[var(--primary-text)] dark:[&>strong]:font-bold">
            {data.name}
          </h4>
          {selected && <Check />}
        </div>
      </div>
    </ListItem>
  );
};
