import React from 'react';
import ColCard from './ColCard';
import { datarowInterface } from './index';
import { FixedSizeList as List } from 'react-window';
import { Button } from '@material-ui/core';
import AddIcon from '@material-ui/icons/Add';

export interface colDataInterface extends React.HTMLAttributes<HTMLDivElement> {
  data: any;
  cardOnClick?: (e: React.MouseEvent, data: any) => void | null;
  cardDataRows: datarowInterface[];
  passFailStatus?: boolean;
  passFailAccessor?: string;
  cardHeight?: number;
  createNew?: () => void;
  createNewText?: string;
  isCreateNew?: boolean;
}

const RenderColumns: React.FC<colDataInterface> = ({
  data,
  cardOnClick,
  cardDataRows,
  passFailStatus,
  passFailAccessor,
  cardHeight = 130,
  createNew,
  isCreateNew,
  createNewText
}) => {
  const listRef = React.useRef(null);
  const Row = ({ index, style }) => {
    const colData = data[index];

    return (
      <div style={style}>
        <ColCard
          key={index}
          data={colData}
          cardOnClick={cardOnClick}
          cardDataRows={cardDataRows}
          passFailStatus={passFailStatus}
          passFailAccessor={passFailAccessor}
        />
      </div>
    );
  };

  return (
    <div className="col group">
      <List ref={listRef} style={{ overflowX: 'hidden' }} height={800} itemCount={data.length} itemSize={cardHeight} width={'100%'}>
        {Row}
      </List>
      {createNew && isCreateNew && (
        <Button
          onClick={createNew}
          style={{ marginTop: '10px' }}
          startIcon={<AddIcon />}
          fullWidth
          className="group-hover:opacity-1 opacity-0 transition-opacity"
        >
          {createNewText || 'Create Task'}
        </Button>
      )}
    </div>
  );
};

export default RenderColumns;
