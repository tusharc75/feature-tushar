import { Close } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import { memo } from 'react';
import { cn } from 'src/constants/helpers';
import MapView from 'src/pages/TechnicianScheduler/Map';
import { useRoadMapStore } from 'src/pages/TechnicianScheduler/Store';

const MapImpl = memo(({ className = 'relative h-[--container-h] w-full overflow-auto' }: React.HTMLAttributes<HTMLDivElement>) => {
  const [, setStore] = useRoadMapStore((state) => state.mapData);
  return (
    <div className={cn('h-[--container-h]', className)}>
      <MapView />
      <span className="absolute left-1/2 top-2 z-[1] rounded-[5px] bg-[var(--dark-secondary,white)] shadow-md [transform:translateX(-50%)] ">
        <IconButton
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setStore({ mapData: null });
          }}
          style={{
            borderRadius: '5px'
          }}
        >
          <Close />
        </IconButton>
      </span>
    </div>
  );
});

export default MapImpl;
