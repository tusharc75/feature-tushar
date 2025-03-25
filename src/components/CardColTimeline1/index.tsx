import React from 'react';
import SingleColumn from 'src/components/CardColTimeline1/SingleColumn';
import { CardColTimelineProps, InitProps } from 'src/components/CardColTimeline1/types';

export * from 'src/components/CardColTimeline1/useCardColTimeline';
export * from 'src/components/CardColTimeline1/types';

const CardColTimeline = <D, C extends string[]>({ state, keyGetter, getColor, cardOnClick }: CardColTimelineProps<D, C> & InitProps<D, C>) => {
  const { columns, visibleColumns } = state;
  return (
    <div className="overflow-x-auto">
      <div className="flex">
        {columns.map((c) => {
          if (!visibleColumns.includes(c)) return null;
          return <SingleColumn key={c} state={state} column={c} keyGetter={keyGetter} getColor={getColor} cardOnClick={cardOnClick} />;
        })}
      </div>
    </div>
  );
};

export default CardColTimeline;
