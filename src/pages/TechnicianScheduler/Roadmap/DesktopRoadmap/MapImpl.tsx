import { Close } from '@mui/icons-material';
import { IconButton } from '@mui/material';
import MapView from 'src/pages/TechnicianScheduler/Map';

type MapImplProps = {
  selected: string | null;
  setSelected: React.Dispatch<React.SetStateAction<string>>;
};

const MapImpl = ({ selected, setSelected }: MapImplProps) => {
  return (
    <div className="relative h-[--container-h] w-full overflow-auto">
      <MapView technician={selected} />
      <IconButton
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelected(null);
        }}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          zIndex: 1
        }}
      >
        <Close />
      </IconButton>
    </div>
  );
};

export default MapImpl;
