import { AccountCircle, Map } from '@mui/icons-material';
import { Avatar, IconButton, ListItemButton, Typography } from '@mui/material';
import React from 'react';
import { HandleSelect } from 'src/pages/TechnicianScheduler/Roadmap';
import { TActivity } from 'src/pages/TechnicianScheduler/Roadmap/types';

type SidebarProps = {
  activity: TActivity[];
  handleSelect: HandleSelect;
};

const Sidebar = ({ activity, handleSelect }: SidebarProps) => {
  return (
    <aside className="sticky left-0 z-[3] border-r bg-[white] dark:bg-[--dark-primary]">
      <div className="sticky top-0 z-[4] flex h-[--header-h] items-center gap-2 border-b bg-[--dark-secondary,white] p-4">
        <Map />
        <Typography variant="body1" display="block">
          Technician
        </Typography>
      </div>
      <ul>
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
    </aside>
  );
};

export default Sidebar;
