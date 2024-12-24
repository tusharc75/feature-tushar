import { Dialog, DialogContent, IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import React, { useCallback, useEffect } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { TbStar, TbStarFilled } from 'react-icons/tb';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn, CustomDialogTransition } from 'src/constants/helpers';
import { SectionProps } from 'src/pages/Reports/SidebarContent/Section';

type ViewAllDialogProps<D> = {
  onClose: () => void;
} & SectionProps<D>;

const ViewAllDialog = <D,>({ getTitle, items, onClick, onClose, selectedTitle, title, isFilled, onButtonClick }: ViewAllDialogProps<D>) => {
  const [fullScreen] = React.useState(isMobile && !isTablet);
  const [filteredItems, setFIlteredItems] = React.useState(items);
  const [searchedVal, setSearchedValue] = React.useState('');

  const handleSearch = useCallback(
    (value: string) => {
      if (!value) {
        setFIlteredItems(items);
        return;
      }
      const filteredItems = items.filter((item) => getTitle(item).toLowerCase().includes(value.toLowerCase()));
      setFIlteredItems(filteredItems);
    },
    [getTitle, items]
  );

  useEffect(() => {
    handleSearch(searchedVal);
  }, [handleSearch, searchedVal]);

  return (
    <Dialog
      open={true}
      onClose={onClose}
      fullScreen={fullScreen}
      TransitionComponent={CustomDialogTransition}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: 'md:!rounded-[12px] !rounded-[0px] !max-w-[576px]'
      }}
      className={cn(
        ' [--px:20px] [--py:20px] md:[--px:35px] md:[--py:21px]',
        fullScreen
          ? '[--container-max-h:calc(100vh-160px)]  [--content-max-h:calc(100vh-250px)]'
          : '[--container-max-h:500px] [--content-max-h:433px]'
      )}
    >
      <div className="flex items-center gap-3 px-[--px] py-[--py] ">
        <div className="flex-grow">
          <h6 className="mb-[5px] text-[20px] font-semibold leading-[22px]">{title}</h6>
        </div>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </div>

      <DialogContent className="!px-[--px] !py-[--py] pt-0">
        <div className="py-[10px]">
          <SearchBox fullWidth value={searchedVal} onChange={(e) => setSearchedValue(e.target.value)} autoComplete="off" />
        </div>
        <ul className="max-h-[534px] min-h-[300px] space-y-2 overflow-y-auto">
          {filteredItems?.map((item) => {
            return (
              <li
                key={`${getTitle(item)}-${isFilled(item)}`}
                onClick={() => {
                  onClick(item);
                  onClose();
                }}
                className="flex min-h-[32px] cursor-pointer list-none items-center gap-[10px] rounded-lg py-2 pl-2 pr-[14px] hover:bg-[#fafafa] data-[active=true]:bg-[#fafafa] dark:hover:bg-gray-800 data-[active=true]:dark:bg-gray-800"
                data-active={selectedTitle === getTitle(item)}
                role="button"
              >
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onButtonClick?.(item);
                  }}
                  size={'small'}
                >
                  {isFilled(item) ? (
                    <TbStarFilled size={16} className="text-[--new-theme-color]" />
                  ) : (
                    <TbStar size={16} className="text-[--new-theme-color]" />
                  )}
                </IconButton>
                <p className="text-[14px] font-normal leading-[1.5] dark:text-gray-200">{getTitle(item)}</p>
              </li>
            );
          })}
        </ul>
      </DialogContent>
    </Dialog>
  );
};

export default ViewAllDialog;
