import React from 'react';
import ColCard from './ColCard';
import { datarowInterface } from './index';

export interface colDataInterface extends React.HTMLAttributes<HTMLDivElement> {
  data: any;
  cardOnClick?: (e: React.MouseEvent, data: any) => void | null;
  cardDataRows: datarowInterface[];
  passFailStatus?: boolean;
  passFailAccessor?: string;
  cardTitleAccessor: string;
}

const RenderColumns: React.FC<colDataInterface> = ({ data, cardOnClick, cardDataRows, passFailStatus, passFailAccessor, cardTitleAccessor }) => {
  return (
    <div>
      {data.map((colData) => (
        <ColCard
          data={colData}
          cardOnClick={cardOnClick}
          cardDataRows={cardDataRows}
          passFailStatus={passFailStatus}
          passFailAccessor={passFailAccessor}
          cardTitleAccessor={cardTitleAccessor}
        />
      ))}
    </div>
  );
};

export default RenderColumns;
