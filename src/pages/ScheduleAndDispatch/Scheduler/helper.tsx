import { Collapse, IconButton } from '@mui/material';
import { ExpandLess, ExpandMore } from '@material-ui/icons';

export const CollapsibleWrapper = ({ index, title, isExpand, accordionType, handleOpen, children }) => {
  return (
    <div className="rounded-[5px] bg-[var(--dark-secondary,white)] [border:1px_solid_var(--common-border-color)]">
      <div className="flex items-center justify-between p-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <span className="flex h-6 w-6 items-center justify-center rounded-md border border-[var(--common-border-color)] text-center font-semibold">
            {index}
          </span>
          {title}
        </h3>
        <div className="flex min-w-fit gap-1">
          <IconButton size="small" onClick={() => handleOpen(accordionType)}>
            {isExpand ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        </div>
      </div>
      <Collapse in={isExpand}>
        <div className="flex flex-col gap-2 p-3 [border-top:1px_solid_var(--common-border-color)]">{children}</div>
      </Collapse>
    </div>
  );
};

export const ACCORDION_TYPE = {
  asset: 'asset',
  service: 'service',
  technician: 'technician',
  customerDetail: 'customerDetail'
};
