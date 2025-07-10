import { Close } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React from 'react';
import SearchButton from 'src/pages/TechnicianScheduler/SearchButton';
import { useTimelineStore } from 'src/pages/TechnicianScheduler/Vis/useTimelineStore';

const DesktopWrapper = ({
  children,
  setIsSidebarOpen
}: {
  children: React.ReactNode;
  setIsSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [selectedResource] = useTimelineStore((store) => store.selectedResource);
  const [leftSearchValue, setStore] = useTimelineStore((state) => state.leftSearchValue);

  return (
    <div className="flex h-[calc(100vh-200px)] min-w-[300px] flex-col border">
      <div className="head flex min-h-[61px] items-center justify-between border-b px-4">
        <h6 className="line-clamp-1 text-[1rem] font-semibold">{selectedResource ? selectedResource.title : 'Field Jobs'}</h6>
        <div className="flex">
          <SearchButton setValue={(value) => setStore({ leftSearchValue: value })} value={leftSearchValue} maxWidth="265px" />
          <IconButton size="small" onClick={() => setIsSidebarOpen(false)}>
            <Close />
          </IconButton>
        </div>
      </div>
      <div className="flex-grow p-2">{children}</div>
    </div>
  );
};

export default DesktopWrapper;
