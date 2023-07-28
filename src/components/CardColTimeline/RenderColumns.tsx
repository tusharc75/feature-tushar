import React from 'react';
import ColCard from './ColCard';
import { datarowInterface } from './index';
import { FixedSizeList as List, } from 'react-window';

export interface colDataInterface extends React.HTMLAttributes<HTMLDivElement> {
  data: any;
  cardOnClick?: (e: React.MouseEvent, data: any) => void | null;
  cardDataRows: datarowInterface[];
  passFailStatus?: boolean;
  passFailAccessor?: string;
  cardHeight?: number;
}

const RenderColumns: React.FC<colDataInterface> = ({ data, cardOnClick, cardDataRows, passFailStatus, passFailAccessor, cardHeight = 130 }) => {
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
    <List
      style={{ overflowX: 'hidden' }}
      height={500}
      itemCount={data.length}
      itemSize={cardHeight}
      width={'100%'}
    >
      {Row}
    </List>
  );
};

export default RenderColumns;
