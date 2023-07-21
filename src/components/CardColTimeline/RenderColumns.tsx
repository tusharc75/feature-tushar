import React from 'react';
import ColCard from './ColCard';
import { datarowInterface } from './index';

export interface colDataInterface extends React.HTMLAttributes<HTMLDivElement> {
  data: any;
  cardOnClick?: (e: React.MouseEvent, data: any) => void | null;
  cardDataRows: datarowInterface[];
  passFailStatus?: boolean;
  passFailAccessor?: string;
}

const RenderColumns: React.FC<colDataInterface> = ({ data, cardOnClick, cardDataRows, passFailStatus, passFailAccessor }) => {
  return (
    <div>
      {data.map((colData, index) => (
        <ColCard
          key={index}
          data={colData}
          cardOnClick={cardOnClick}
          cardDataRows={cardDataRows}
          passFailStatus={passFailStatus}
          passFailAccessor={passFailAccessor}
        />
      ))}
    </div>
  );
};

export default RenderColumns;
