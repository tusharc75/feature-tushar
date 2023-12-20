import { Avatar, Chip, ListItem, Typography } from '@material-ui/core';
import { AccountCircle, Check, Group } from '@material-ui/icons';
import moment from 'moment';
import { useMemo } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { displayCardDate } from 'src/constants/helpers';

export const HistoryItem = ({ data, userId, handleClick }) => {
  const formatTime = (time: string) => moment(time).format('HH:MM');

  const isUnseen = useMemo(() => data?.unseen > 0, [data]);

  const userAvatar = useMemo(() => {
    let avatar = '';
    for (const user of data.users) {
      const userName = `${user.firstName} ${user.lastName}`;
      if (userName === data.chatTitle) {
        avatar = user.avatar || '';
      }
    }
    return avatar;
  }, [data]);

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
            className={`text-[12px] font-medium mb-[8px] leading-[22px] ${
              isUnseen ? 'dark:text-white text-[var(--primary-text)] font-semibold' : 'text-[#6B6F77] dark:text-gray-300'
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
              className={`${
                isUnseen ? 'dark:text-white text' : 'text-[var(--dark-secondary-text,_#718496)]'
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

export const NotificationItem = ({ handleClick, data }) => {
  return (
    <ListItem
      button
      aria-label={data.title}
      className={`p-0 dark:[border-bottom:1px_solid_var(--common-border-color)_!important] [border-bottom:1px_solid_#F4F4F4_!important] `}
      key={data._id}
      onClick={() => {
        handleClick(data);
      }}
    >
      <div className="flex items-center md:gap-[17px] gap-[15px] p-[20px] w-full">
        <div className=" basis-[38px]">
          <div className="rounded-full bg-[var(--dark-secondary,#F4F4F4)] w-[38px] h-[38px] relative">
            <Avatar className="[width:38px_!important] [height:38px_!important]" />
          </div>
        </div>
        <div className="flex-grow">
          <h4 className="text-[12px] font-medium mb-[8px] [&>strong]:font-semibold dark:[&>strong]:font-bold leading-[22px] text-[#6B6F77] dark:text-gray-300 [&>strong]:text-[var(--primary-text)]">
            {data.title}
          </h4>
          <h5 className="text-[var(--dark-secondary-text,_#718496)] text-[11px] font-normal mb-[2px]">{data.description}</h5>
          <p className="text-[var(--dark-secondary-text,_#718496)] text-[11px] font-normal">{displayCardDate(data?.date)}</p>
        </div>
      </div>
    </ListItem>
  );
};

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
