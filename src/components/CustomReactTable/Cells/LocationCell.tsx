import { IconButton } from '@material-ui/core';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import { useState } from 'react';
import GoogleMaps from 'src/components/GoogleMap';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const LocationCell = ({ field, original }) => {

  const [viewMap, setViewMap] = useState({ open: false, locationName: null, longitude: null, latitude: null });

  const key = field.fieldName;
  const value = original[key] || original;

  return (
    <div>
      <h5 className="text-truncate">
        {value?.locationName ? (
          <>
            {value?.locationName}{' '}
            {value?.longitude && value?.latitude ? (
              <HtmlTooltip title="View in Map">
                <IconButton
                  size="small"
                  aria-label="view-in-map"
                  onClick={() => {
                    setViewMap({ open: true, locationName: value?.locationName, longitude: value.longitude, latitude: value.latitude });
                  }}>
                  <LocationOnIcon fontSize='small' color='primary' />
                </IconButton>
              </HtmlTooltip>
            ) : null
            }
          </>
        ) : <NoDataCell />}
      </h5>
      {viewMap?.open && (
        <GoogleMaps
          onClose={() => {
            setViewMap({ open: false, locationName: null, longitude: null, latitude: null });
          }}
          longitude={viewMap.longitude}
          latitude={viewMap.latitude}
          locationName={viewMap.locationName}
        />
      )}
    </div>
  );
};

export default LocationCell;
