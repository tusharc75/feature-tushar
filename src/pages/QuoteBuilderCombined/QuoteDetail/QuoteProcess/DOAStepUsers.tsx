import { Button, Collapse } from '@mui/material';
import React, { FC, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { FcApproval } from 'react-icons/fc';
import { Block, KeyboardArrowUp, WatchLater } from '@mui/icons-material';

import { DOAApproved, DOARejected, DOAPending } from 'src/assets/svg/svgIcons';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const DEFAULT_DATA_COUNT = 2; // this value will change how many users will be displayed by default;

const statusIconAndColorClassMap = {
  approve: {
    icon: <DOAApproved size={16} className="block" />,
    colorClasses: 'text-[#64B067]',
    text: 'Accepted'
  },
  pending: {
    icon: <DOAPending size={16} className="block" />,
    colorClasses: 'text-[#858B9D]',
    text: 'Pending'
  },
  rejected: {
    icon: <DOARejected size={16} className="block" />,
    colorClasses: 'text-[#EC6852]',
    text: 'Rejected'
  }
};

const versionStatusIconMap = {
  'Sent for DOA': {
    icon: <WatchLater className="[font-size:20px_!important]" />,
    lebel: 'DOA Sent',
    colorClass: 'text-[#00acc1]'
  },
  'Rejected by DOA': {
    icon: <Block className="[font-size:20px_!important]" />,
    lebel: 'Rejected by DOA',
    colorClass: 'text-[#d60f0f]'
  },
  'Accepted by DOA': {
    icon: <FcApproval size={20} />,
    lebel: 'Approved by DOA',
    colorClass: 'bg-[#6ca826] dark:bg-[#294c00]'
  }
};

export type TDOAData = {
  users?: User[];
  status?: TStatus;
};
export interface User {
  firstName?: string;
  lastName?: string;
  id?: string;
  status?: TStatus;
  data?: Date;
}

type TStatus = 'approve' | 'pending' | 'rejected';

type TDoaStepUsersProps = {
  DOAData?: TDOAData[];
  versionStatus?: 'Sent for DOA' | 'Rejected by DOA' | 'Accepted by DOA';
} & React.HTMLAttributes<HTMLDivElement>;

const DoaStepUsers: FC<TDoaStepUsersProps> = ({ DOAData, versionStatus, ...props }) => {
  const [open, setOpen] = useState(false);

  const visibleData = React.useMemo(() => {
    return DOAData?.slice(0, DEFAULT_DATA_COUNT) || [];
  }, [DOAData]);

  const collapsedData = React.useMemo(() => {
    return DOAData?.slice(DEFAULT_DATA_COUNT, DOAData.length) || [];
  }, [DOAData]);
  const versionData = useMemo(() => versionStatusIconMap[versionStatus], [versionStatus]);

  return (
    <div className="  min-w-[120px]" {...props}>
      <div
        className={`flex max-w-[var(--width)] items-center gap-[7px] bg-[white]  px-[7px] py-[4px] text-[12px] [--width:177px] dark:bg-[var(--dark-primary)]`}
      >
        <div className={`${versionData?.colorClass} h-[20px] w-[20px] rounded-full`}>{versionData?.icon}</div>
        <p title={versionData?.lebel} className=" line-clamp-1 text-[13px] text-[var(--primary-text)]">
          {versionData?.lebel}
        </p>
      </div>
      <div className="step relative z-50 ml-auto max-w-[120px] bg-[white] px-[4px] py-[var(--line-height)] pt-[12px]  [--line-height:6px] dark:bg-[var(--dark-primary)]">
        {visibleData?.map((d, index) => {
          return <RenderUser userData={d} index={index} />;
        })}
        {collapsedData && collapsedData?.length > 0 && (
          <>
            <Collapse in={open}>
              {collapsedData?.map((d, index) => {
                return <RenderUser userData={d} index={index} />;
              })}
            </Collapse>
            <Button
              variant="text"
              size="small"
              style={{
                width: '20px',
                height: '20px',
                padding: '2px',
                minWidth: 'unset',
                marginLeft: 32
              }}
              onClick={() => setOpen((prev) => !prev)}
            >
              {open ? <KeyboardArrowUp /> : `+${collapsedData?.length}`}
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default DoaStepUsers;

type TRenderUserProps = {
  userData?: TDOAData;
  index: number;
};

const lineClassName =
  'absolute block left-0 right-0 mx-auto h-[var(--line-height)] block bg-[var(--primary)] dark:bg-[var(--common-border-color)] w-[1px]';

const RenderUser = ({ userData, index }: TRenderUserProps) => {
  const user = userData?.users?.[0];
  const icon = statusIconAndColorClassMap[userData?.status];

  const userFullName = `${user?.firstName} ${user?.lastName}`;

  return (
    <div key={user?.id || index} className="mb-[var(--line-height)] grid grid-cols-[24px_85px] items-center  gap-[7px]">
      <div
        style={{ borderWidth: '1px', borderStyle: 'solid' }}
        className={`status-icon relative h-[24px] w-[24px] rounded-full border-[var(--primary)] transition-colors dark:border-[var(--common-border-color)] ${icon.colorClasses} `}
      >
        <div className={`${lineClassName} -top-[var(--line-height)]`} />
        <HtmlTooltip title={<span className=" capitalize">{icon.text}</span>} placement="top" arrow>
          <span className="absolute inset-0 m-auto block max-h-[16px] max-w-[16px] cursor-pointer ">{icon.icon}</span>
        </HtmlTooltip>
        <div className={`${lineClassName} -bottom-[var(--line-height)]`} />
      </div>
      {user?.id ? (
        <Link
          title={userFullName}
          target="_blank"
          rel="noopener noreferrer"
          className="link line-clamp-1 max-w-[85px] text-[12px] font-normal"
          to={`${routes.userDetail.path}/${user?.id}`}
        >
          {userFullName}
        </Link>
      ) : (
        <span className="line-clamp-1 max-w-[85px] text-[12px] font-normal">{userFullName}</span>
      )}
    </div>
  );
};
