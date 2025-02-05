import React, { memo, useMemo } from 'react';
import CellTooltip from 'src/components/CustomReactTable/Cells/CellTooltip';
import NoDataCell from 'src/components/Helpers/NoDataCell';

type FreeStyleMultiSelectProps = {
  value: string;
  mode?: 'table' | 'details';
};

const FreeStyleMultiSelectImpl = ({ value, mode = 'table' }: FreeStyleMultiSelectProps) => {
  const optionList = useMemo(() => value?.split(',').map((d) => d.trim()), [value]);

  if (!value || typeof value !== 'string') return mode === 'table' ? <NoDataCell /> : <>'--'</>;

  return (
    <CellTooltip
      more={optionList.length > 1 ? optionList.length - 1 : 0}
      tooltipChildren={<RenderTooltipChildren optionList={optionList} />}
      title={`${optionList[0]}`}
      className={mode === 'details' ? 'line-clamp-1' : ''}
    >
      {optionList[0]}
    </CellTooltip>
  );
};

const RenderTooltipChildren = ({ optionList }: { optionList: string[] }) => {
  if (!optionList || optionList?.length === 0) return null;
  return (
    <div className="space-y-2">
      {optionList.map((o, index) => {
        if (index === 0) return null;
        return (
          <span className="line-clamp-2 block" title={o}>
            {o}
          </span>
        );
      })}
    </div>
  );
};

const FreeStyleMultiSelect = memo(FreeStyleMultiSelectImpl);

export default FreeStyleMultiSelect;
