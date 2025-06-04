import React from 'react';
import { cn, sidebarResource } from 'src/constants/helpers';
import CardView from 'src/pages/FieldView/CardView';
import MapView from 'src/pages/FieldView/MapView';
import { TData } from 'src/pages/FieldView/types';

type ShowViewProps = {
  view: 'card' | 'map';
  data: TData[];
  onClick: (data: TData) => void;
  resource: 'Serialized Asset' | 'Well Master' | 'Pad Master';
};

const ShowView = ({ data, onClick, view, resource }: ShowViewProps) => {
  return (
    <div className={cn('relative flex h-[calc(100vh-200px)] gap-4 overflow-hidden')}>
      <div className={cn('transition-all duration-300', view === 'map' ? 'md:w-[300px]' : 'w-full flex-grow')}>
        <CardView resource={resource} data={data} clickOnCard={onClick} />
      </div>
      {view === 'map' && (
        <div className={cn('overflow-hidden rounded-md transition-all duration-300', view === 'map' ? 'flex-grow' : '')}>
          <MapView resource={resource} data={data} />
        </div>
      )}
    </div>
  );
};

export default ShowView;
