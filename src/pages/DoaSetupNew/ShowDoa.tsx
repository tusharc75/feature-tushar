import { Info } from '@mui/icons-material';
import { ClickAwayListener, IconButton, Popover, useMediaQuery } from '@mui/material';
import { useMemo, useState } from 'react';
import { BsFillCheckCircleFill, BsFillClockFill, BsFillXCircleFill } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import routes from 'src/components/Helpers/Routes';
import { cn, DOA_STATUS } from 'src/constants/helpers';

const ShowDoa = ({ status, data }) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const isTablet = useMediaQuery('(max-width:1080px)');
  const userCount = useMemo(
    () =>
      data?.doaUsers?.reduce((acc, curr) => {
        acc += curr.users?.length;
        return acc;
      }, 0),
    [data?.doaUsers]
  );

  const shouldRenderPopup = userCount > 1 || isTablet;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      {data ? (
        <div className={'flex flex-wrap items-center gap-2 rounded-b-md bg-[var(--dark-primary,white)] p-[5px_10px] shadow-md'}>
          {status === DOA_STATUS.sentForDoa && (
            <div className={`flex items-center gap-1 font-semibold text-[#0f9fa9]`}>
              <BsFillClockFill size={16} />
              <span className="text-sm">DOA Sent</span>
            </div>
          )}
          {status === DOA_STATUS.acceptedbyDOA && (
            <div className={`flex items-center gap-1 font-semibold text-[#6ca826]`}>
              <BsFillCheckCircleFill size={16} />
              <span className="text-sm">Approved by DOA</span>
            </div>
          )}
          {status === DOA_STATUS.rejectedbyDOA && (
            <div className={`flex items-center gap-1 font-semibold text-[#d60f0f]`}>
              <BsFillXCircleFill size={16} />
              <span className="text-sm">Rejected by DOA</span>
            </div>
          )}
          {shouldRenderPopup ? (
            <>
              <HtmlTooltip title="User Details">
                <IconButton onClick={handleClick} size="small" color="primary">
                  <Info fontSize="small" />
                </IconButton>
              </HtmlTooltip>
              <Popover
                open={Boolean(anchorEl)}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left'
                }}
              >
                <div className="bg-[var(--dark-secondary,white)] p-2">
                  <RenderUsers data={data} />
                </div>
              </Popover>
            </>
          ) : (
            <RenderUsers data={data} />
          )}
        </div>
      ) : null}
    </>
  );
};

const RenderUsers = ({ data }: { data: any }) => {
  return (
    <>
      {data?.doaUsers?.length &&
        data?.doaUsers?.map((users, index) => (
          <div key={index} className={cn('flex items-center gap-1')}>
            {users?.status === DOA_STATUS.pending && <BsFillClockFill size={16} style={{ color: '#F25F54' }} />}
            {users?.status === DOA_STATUS.approved && <BsFillCheckCircleFill size={16} style={{ color: '#4BAE4F' }} />}

            <div className="text">
              {users?.users?.slice(0, 3).map((user) => (
                <Link title={user?.name} className="link text-sm" to={`${routes.userDetail.path}/${user?._id}`} target="_blank">
                  {user?.name}
                </Link>
              ))}
              {users?.users?.length > 4 && `+ ${users?.users?.length - 4} more`}
              <p className="line-clamp-1 max-w-[150px] text-sm">{users?.doaComment}</p>
            </div>
          </div>
        ))}
    </>
  );
};

export default ShowDoa;
