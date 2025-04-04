import { memo } from 'react';

export function NoDataCellImpl({ label = 'noDataCell' }) {
  return <span className="no-data-cell" style={{ color: 'grey' }} aria-label={label}>{`- - - - - - - `}</span>;
}

const NoDataCell = memo(NoDataCellImpl);

export default NoDataCell;
