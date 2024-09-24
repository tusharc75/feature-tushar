import { IconButton } from '@material-ui/core';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import LocationOnIcon from '@material-ui/icons/LocationOn';

const LocationCell = ({ field, original, setViewMap }) => {

  const key = field.fieldName;
  const value = original[key] || original;

  return (
    <div>
      <h5 className="text-truncate">
        {value?.locationName ? (
          <>
            {value?.locationName}
            {value?.longitude && value?.latitude ? (
              <IconButton size="small" title="View in Map" aria-label="view-in-map" onClick={() => {
                setViewMap({ open: true, longitude: value.longitude, latitude: value.latitude });
              }}>
                <LocationOnIcon fontSize='small' />
              </IconButton>
            ) : null
            }
          </>
        ) : <NoDataCell />}
      </h5>
    </div>
  );
};

export default LocationCell;
