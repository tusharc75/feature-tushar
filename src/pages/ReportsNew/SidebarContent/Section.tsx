import { Collapse } from '@material-ui/core';
import React from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { IoIosStarOutline } from 'react-icons/io';
import { cn } from 'src/constants/helpers';

type SectionProps<I> = {
  title: string;
  items: I[];
  onClick: (item: I) => void;
  getTitle: (item: I) => string;
};

// const link = `/reports${report.type !== 'dynamic' ? `/${kebabCase(report.key)}/` + kebabCase(report.type) : routes[report.key]?.path}`;
// const link = `/reports/custom-report/${item._id}`;

const Section = <T,>({ items, onClick, title, getTitle }: SectionProps<T>) => {
  const [open, setOpen] = React.useState(true);
  return (
    <div>
      <div
        role="button"
        onClick={() => setOpen((prev) => !prev)}
        className="sticky top-0 z-10 mb-2 flex cursor-pointer items-center gap-1 bg-[var(--dark-primary,white)] text-[#2E2C2E] shadow-none outline-none dark:text-[white]"
      >
        <p className="text-[14px] font-semibold leading-[24px]">{title}</p>
        <span className={cn('block max-h-[14px] transition-transform', open ? '' : '[transform:rotate(180deg)]')}>
          <FaChevronDown />
        </span>
      </div>
      <Collapse in={open}>
        {items.length > 0 ? (
          items?.map((item) => {
            return (
              <div key={getTitle(item)}>
                <IoIosStarOutline />
                <span>{getTitle(item)}</span>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-[16px] font-semibold text-gray-400  dark:text-gray-300">No {title} Found</div>
        )}
      </Collapse>
    </div>
  );
};

export default Section;
