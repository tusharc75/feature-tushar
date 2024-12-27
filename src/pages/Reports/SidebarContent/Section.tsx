import { Collapse, IconButton } from '@mui/material';
import React, { useMemo, useState } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { TbStar, TbStarFilled } from 'react-icons/tb';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn } from 'src/constants/helpers';
import ViewAllDialog from 'src/pages/Reports/SidebarContent/ViewAllDialog';

export type SectionProps<I> = {
  title: string;
  items: I[];
  onClick: (item: I) => void;
  getTitle: (item: I) => string;
  selectedTitle: string | null;
  isFilled?: (item: I) => boolean;
  onButtonClick?: (item: I) => void;
};

const ITEMS_TO_SHOW = 5;

const Section = <T,>({
  items,
  onClick,
  title,
  getTitle,
  selectedTitle,
  isFilled = () => false,
  onButtonClick = (data) => {
    () => {};
  }
}: SectionProps<T>) => {
  const [open, setOpen] = React.useState(true);
  const firstFewItems = useMemo(() => [...items].slice(0, ITEMS_TO_SHOW), [items]);
  const isShowMore = useMemo(() => items.length > ITEMS_TO_SHOW, [items]);
  const [viewAll, setViewAll] = React.useState(false);

  return (
    <div>
      <div
        role="button"
        onClick={() => setOpen((prev) => !prev)}
        className="sticky top-0 z-10 mb-2 flex cursor-pointer items-center gap-1 bg-[var(--dark-primary,white)] text-[#2E2C2E] shadow-none outline-none dark:text-[white]"
      >
        <p className="text-[14px] font-semibold leading-[24px]">{title}</p>
        <FaChevronDown size={10} className={cn('block  transition-transform', open ? '' : '[transform:rotate(180deg)]')} />
      </div>
      <Collapse in={open}>
        {items.length > 0 ? (
          <>
            <ul className="space-y-2">
              {firstFewItems?.map((item) => {
                return (
                  <li
                    key={getTitle(item)}
                    onClick={() => onClick(item)}
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
            {isShowMore && (
              <ThemeButton fullWidth iconForMobile={false} onClick={() => setViewAll(true)}>
                View All
              </ThemeButton>
            )}
          </>
        ) : (
          <div className="p-12 text-center text-[16px] font-semibold text-gray-400  dark:text-gray-600">No {title} Found</div>
        )}
      </Collapse>
      {viewAll && (
        <ViewAllDialog
          title={title}
          onClose={() => setViewAll(false)}
          items={items}
          onClick={onClick}
          getTitle={getTitle}
          selectedTitle={selectedTitle}
          isFilled={isFilled}
          onButtonClick={onButtonClick}
        />
      )}
    </div>
  );
};

export default Section;
