import { Search, SearchOff } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import React, { useState } from 'react';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn } from 'src/constants/helpers';

const SearchButton = ({ setValue, value }: { value: string; setValue: React.Dispatch<React.SetStateAction<string>> }) => {
  const [open, setOpen] = useState(false);
  const toggleOpen = () => setOpen((prev) => !prev);
  return (
    <div className="relative inline-flex min-h-[34px] items-center">
      <div
        className={cn(
          'absolute -top-[0] right-full mr-1 h-[calc(100%+2px)] overflow-hidden bg-[--dark-primary,white] transition-all',
          open ? 'w-[calc(var(--sidebar-w,290px)-80px)]' : 'w-0'
        )}
      >
        <div className="p-[1px]">
          <SearchBox
            ref={(node) => {
              if (node && open) {
                node.focus();
              }
            }}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            debounceTime={500}
          />
        </div>
      </div>
      <IconButton size={'small'} onClick={toggleOpen} color="primary">
        {open ? <SearchOff fontSize="small" /> : <Search fontSize="small" />}
      </IconButton>
    </div>
  );
};

export default SearchButton;
