import { memo } from 'react';

function NoDataCellImpl() {
  return <span style={{ color: 'grey' }}>{`- - - - - - - `}</span>;
}

const NoDataCell = memo(NoDataCellImpl);

export default NoDataCell;
