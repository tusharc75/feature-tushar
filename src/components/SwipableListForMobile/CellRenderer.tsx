import React, { FC } from 'react';

interface CellRendererProps {
  isPrimaryField: boolean;
}

const CellRenderer: FC<CellRendererProps> = ({ isPrimaryField = false }) => {
  return <div>CellRenderer</div>;
};

export default CellRenderer;
