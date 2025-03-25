import React from 'react';
import { CardColTimelineProps } from 'src/components/CardColTimeline1/types';

const SingleColumn = <D, C extends string[]>({ state, keyGetter, getColor, column }: { column: C[number] } & CardColTimelineProps<D, C>) => {
  return (
    <div>
      <div className="head">{column}</div>
    </div>
  );
};

export default SingleColumn;
