import { Collapse, IconButton } from '@material-ui/core';
import React from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { TbStar, TbStarFilled } from 'react-icons/tb';
import { cn } from 'src/constants/helpers';

type SectionProps<I> = {
  title: string;
  items: I[];
  onClick: (item: I) => void;
  getTitle: (item: I) => string;
  selectedTitle: string | null;
  isFilled?: (item: I) => boolean;
  onButtonClick?: (item: I) => void;
};

const Section = <T,>({
  items,
  onClick,
  title,
  getTitle,
  selectedTitle,
  isFilled = () => false,
  onButtonClick = (data) => console.log(data)
}: SectionProps<T>) => {
  const [open, setOpen] = React.useState(true);
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
          <ul className="space-y-2">
            {items?.map((item) => {
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
                    {isFilled(item) ? <TbStarFilled size={16} /> : <TbStar size={16} />}
                  </IconButton>
                  <p className="text-[14px] font-normal leading-[1.5] dark:text-gray-200">{getTitle(item)}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="p-12 text-center text-[16px] font-semibold text-gray-400  dark:text-gray-600">No {title} Found</div>
        )}
      </Collapse>
    </div>
  );
};

export default Section;
