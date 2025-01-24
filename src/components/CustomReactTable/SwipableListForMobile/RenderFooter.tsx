import { Button, Collapse } from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { flexRender } from '@tanstack/react-table';
import { Fragment, useState } from 'react';

const RenderFooter = ({ table }) => {
  const [isFooterExpanded, setIsFooterExpanded] = useState(false);

  const toggleFooter = () => {
    setIsFooterExpanded((prev) => !prev);
  };

  return (
    <>
      {table?.getFooterGroups().map((group, index) => {
        const indexCol = group?.headers?.find((g) => g.id === 'index');
        return (
          <div key={index} className="mt-4 items-center rounded-md [border:1px_solid_var(--common-border-color)] ">
            <Button
              fullWidth
              onClick={toggleFooter}
              endIcon={<ExpandMore className={`${isFooterExpanded ? '[transform:rotate(180deg)]' : ''} transition-all duration-200`} />}
              aria-expanded={isFooterExpanded}
              aria-label="show more"
              className="[&_.MuiButton-label]:flex [&_.MuiButton-label]:justify-between [&_.MuiButton-label]:font-bold"
            >
              <span>{indexCol?.isPlaceholder ? null : flexRender(indexCol?.column?.columnDef.footer, indexCol?.getContext()) || 'Total'}</span>
            </Button>
            <Collapse in={isFooterExpanded} timeout="auto">
              <div
                className={`grid grid-cols-[5fr_3fr] justify-between gap-2 px-2 py-2 text-[12px] font-semibold text-black [border-top:1px_solid_var(--common-border-color)] dark:text-gray-300
                  `}
              >
                {group?.headers?.map((column) => {
                  if (!column?.column?.columnDef.footer || column.id === 'index') return null;
                  return (
                    <Fragment key={column.id}>
                      <span className="text-truncate">
                        {column?.isPlaceholder ? null : flexRender(column?.column?.columnDef.header, column?.getContext())}
                      </span>
                      <span className="text-truncate text-right font-normal">
                        {column?.isPlaceholder ? null : flexRender(column?.column?.columnDef.footer, column?.getContext())}
                      </span>
                    </Fragment>
                  );
                })}
              </div>
            </Collapse>
          </div>
        );
      })}
    </>
  );
};

export default RenderFooter;
