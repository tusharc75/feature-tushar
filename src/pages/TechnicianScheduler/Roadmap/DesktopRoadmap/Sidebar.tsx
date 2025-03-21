import { AccountCircle, Map } from '@mui/icons-material';
import { Avatar, IconButton, ListItemButton, Skeleton, Typography } from '@mui/material';
import React from 'react';
import { HandleSelect } from 'src/pages/TechnicianScheduler/Roadmap';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';

type SidebarProps = {
  activity: TActivity[];
  handleSelect: HandleSelect;
  loading: boolean;
};

const Sidebar = ({ activity, handleSelect, loading }: SidebarProps) => {
  return (
    <aside className="sticky right-0 z-[3] border-l bg-[white] dark:bg-[--dark-primary]">
      <div className="sticky top-0 z-[4] flex h-[--header-h] items-center gap-2 border-b bg-[--dark-primary,white] p-4">
        <Map />
        <Typography variant="body1" display="block">
          Technician
        </Typography>
      </div>
      {!loading ? (
        <ul className="list-none">
          {activity?.map((data, index) => {
            return (
              <li className="border-b">
                <ListItemButton
                  className="flex !h-[calc(var(--data-h)-1px)] items-center !justify-between  px-4"
                  onClick={(event) => {
                    handleSelect(event, data, 'technician');
                  }}
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar sizes="small" style={{ height: 45, width: 45 }} alt="Remy Sharp" src={data?.photo}>
                      <AccountCircle style={{ fontSize: 28 }} />
                    </Avatar>
                    <div className="">
                      <Typography style={{ fontWeight: 'bolder', fontSize: '1rem' }}>{`${data?.firstName} ${data?.lastName}`}</Typography>
                      <p className="line-clamp-1 text-[0.8rem] text-gray-500" title={`${data?.competencyType?.optionLabel || ''}`}>
                        {`${data?.competencyType?.optionLabel || ''}`}
                      </p>
                      <p
                        className="line-clamp-1 text-[0.6rem] text-gray-500"
                        title={`${data?.competencies?.map((e) => e?.optionLabel)?.toString() || ''}`}
                      >
                        {`${data?.competencies?.map((e) => e?.optionLabel)?.toString() || ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <IconButton
                      onClick={(event) => {
                        event.stopPropagation();
                        handleSelect(event, data, 'map');
                      }}
                    >
                      <Map fontSize="medium" />
                    </IconButton>
                  </div>
                </ListItemButton>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul className="list-none">
          {[...Array(8).keys()]?.map((data, index) => {
            return (
              <li className="border-b">
                <ListItemButton className="flex !h-[calc(var(--data-h)-1px)] items-center !justify-between  px-4">
                  <div className="flex min-w-0 items-center gap-4">
                    <Avatar sizes="small" style={{ height: 45, width: 45 }} alt="Remy Sharp" src={data?.photo}>
                      <AccountCircle style={{ fontSize: 28 }} />
                    </Avatar>
                    <div className="">
                      <Typography style={{ fontWeight: 'bolder', fontSize: '1rem' }}>
                        <Skeleton width={'60%'} />
                      </Typography>
                      <p className="line-clamp-1 text-[0.8rem] text-gray-500">
                        <Skeleton width={'80%'} />
                      </p>
                      <p className="line-clamp-1 text-[0.6rem] text-gray-500">
                        <Skeleton width={Math.random() * (200 - 100) + 100} />
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <IconButton>
                      <Map fontSize="medium" />
                    </IconButton>
                  </div>
                </ListItemButton>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
};

export default Sidebar;
