import { Map } from '@mui/icons-material';
import { IconButton, ListItemButton, Skeleton, Typography } from '@mui/material';
import React from 'react';
import { HandleSelect } from 'src/pages/TechnicianScheduler/Roadmap';
import Technicians from 'src/pages/TechnicianScheduler/Roadmap/MobileRoadmap/Technicians';
import type { TActivity } from '../types';

type TProps = {
  activity: TActivity[];
  handleSelect: HandleSelect;
  loading: boolean;
  leftSidebar: (isMobile: Boolean) => React.ReactNode;
};

const MobileRoadmap: React.FC<TProps> = ({ activity, handleSelect, loading, leftSidebar }) => {
  return (
    <>
      {leftSidebar(true)}
      <div className="max-h-[600px] overflow-auto border border-[var(--common-border-color)]">
        <div className="sticky top-0 z-[2] flex items-center gap-2 border-b bg-[--dark-secondary,white] p-4">
          <Map />
          <Typography variant="body1" display="block">
            Technician
          </Typography>
        </div>
        {!loading ? (
          <Technicians activity={activity} handleSelect={handleSelect} />
        ) : (
          <ul>
            {[...Array(9).keys()].map((item, index) => {
              return (
                <li className="list-none border-b">
                  <ListItemButton className="flex h-[--data-h] items-center !justify-between px-4 ">
                    <div className="flex min-w-0 flex-grow items-center gap-4">
                      <Skeleton width={'45px'} variant="circular" height={'45px'} sx={{ flexShrink: 0 }} />
                      <div className="w-full">
                        <Typography style={{ fontWeight: 'bolder', fontSize: '1rem' }}>
                          <Skeleton />
                        </Typography>
                        <p className="line-clamp-1 text-[0.8rem] text-gray-500">
                          <Skeleton />
                        </p>
                        <p className="line-clamp-1 text-[0.6rem] text-gray-500">
                          <Skeleton />
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-shrink-0">
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
      </div>
    </>
  );
};

export default MobileRoadmap;
