import { IconButton } from '@mui/material';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import { useState } from 'react';
import GoogleMaps from 'src/components/GoogleMap';
import HtmlTooltip from 'src/components/CustomTooltipTitle';

const GpsLocationCell = ({ value }) => {
  const [viewMap, setViewMap] = useState({ open: false, locationName: null, longitude: null, latitude: null });

  return (
    <div>
      {value?.locationName ? (
        <>
          <h5 className="text-truncate">{value?.locationName} </h5>
          {value?.longitude && value?.latitude ? (
            <HtmlTooltip title="View in Map">
              <IconButton
                size="small"
                aria-label="view-in-map"
                onClick={() => {
                  setViewMap({ open: true, locationName: value?.locationName, longitude: value.longitude, latitude: value.latitude });
                }}
              >
                <LocationOnIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
          ) : null}
        </>
      ) : (
        <NoDataCell />
      )}
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

export default GpsLocationCell;
