import { Close, Search } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { useState } from 'react';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn } from 'src/constants/helpers';

const SearchButton = ({
  setValue,
  value,
  onOpenToggle,
  maxWidth = 'var(--sidebar-w,285px)'
}: {
  value: string;
  setValue: (value: string) => void;
  onOpenToggle?: (open: boolean) => void;
  maxWidth?: string;
}) => {
  const [open, setOpen] = useState(false);

  const toggleOpen = () =>
    setOpen((prev) => {
      const val = !prev;
      onOpenToggle?.(val);
      return val;
    });
  return (
    <div className="relative inline-flex min-h-[34px] items-center">
      <div
        className={cn('absolute -top-[0] right-full mr-1 h-[calc(100%+2px)] overflow-hidden bg-[--dark-primary,white] transition-all')}
        style={{ width: open ? `calc(${maxWidth} - 50px)` : 0 }}
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

      <div className="rounde-full relative">
        {value && (
          <span className="absolute right-[3px] top-[3px] flex size-[5px] items-center justify-center rounded-full bg-red-500">
            <span className="size-2 flex-shrink-0 animate-ping rounded-full bg-red-500/70" />
          </span>
        )}
        <HtmlTooltip title={open ? 'Close Search' : ''}>
          <IconButton size={'small'} onClick={toggleOpen} color="primary">
            {open ? <Close fontSize="small" /> : <Search fontSize="small" />}
          </IconButton>
        </HtmlTooltip>
      </div>
    </div>
  );
};

export default SearchButton;
