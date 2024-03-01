import { Button, Collapse } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
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
          <div key={index} className="[border:1px_solid_var(--common-border-color)] rounded-md items-center mt-4 ">
            <Button
              fullWidth
              onClick={toggleFooter}
              endIcon={<ExpandMore className={`${isFooterExpanded ? '[transform:rotate(180deg)]' : ''} transition-all duration-200`} />}
              aria-expanded={isFooterExpanded}
              aria-label="show more"
              className="[&_.MuiButton-label]:flex [&_.MuiButton-label]:justify-between [&_.MuiButton-label]:font-bold"
            >
              <span>{indexCol?.isPlaceholder ? null : flexRender(indexCol?.column?.columnDef.footer, indexCol?.getContext())}</span>
            </Button>
            <Collapse in={isFooterExpanded} timeout="auto">
              <div
                className={`grid grid-cols-[5fr_3fr] py-2 gap-2 font-semibold text-[12px] text-black px-2 dark:text-gray-300 justify-between [border-top:1px_solid_var(--common-border-color)]
                  `}
              >
                {group?.headers?.map((column) => {
                  if (!column?.column?.columnDef.footer || column.id === 'index') return null;
                  return (
                    <Fragment key={column.id}>
                      <span className="text-truncate">
                        {column?.isPlaceholder ? null : flexRender(column?.column?.columnDef.header, column?.getContext())}
                      </span>
                      <span className="text-truncate font-normal text-right">
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
