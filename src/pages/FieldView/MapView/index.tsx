import { GoogleMap, InfoWindow } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import { cn, sidebarResource } from 'src/constants/helpers';
import { generateData } from 'src/pages/FieldView/CardView/utils';
import { FieldViewResource } from 'src/pages/FieldView/types';
import { useFieldStore } from 'src/pages/FieldView/useFieldStore';

type MapProps = {
  data: any[];
  resource: FieldViewResource;
};

const MapView = ({ data, resource }: MapProps) => {
  const containerStyle = {
    minHeight: '600px',
    height: '100%',
    maxWidth: '100%',
    minWidth: '100%'
  };
  const [locations, setLocations] = useState<any[]>(null);
  const [, stStore] = useFieldStore((store) => store.activeItem);

  useEffect(() => {
    if (data) {
      const tempData = []
      data?.forEach((e) => {
        const convetedData = generateData(e, resource);
        let locationData: any = {}
        if (convetedData?.find((e) => e.type === 'location')) {
          locationData = convetedData?.find((e) => e.type === 'location')
        }
        tempData.push({ ...e, ...convetedData[0], coordinate: locationData.coordinate })
      })
      setLocations(tempData)
    }
  }, [data, resource]);

  return (locations &&
    <GoogleMap
      options={{
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },

        styles: [
          {
            featureType: 'water',
            stylers: [{ color: '#46bcec' }, { visibility: 'on' }]
          },
          { featureType: 'landscape', stylers: [{ color: '#f2f2f2' }] },
          {
            featureType: 'road',
            stylers: [{ saturation: -100 }, { lightness: 45 }]
          },
          {
            featureType: 'road.highway',
            stylers: [{ visibility: 'simplified' }]
          },

          { featureType: 'transit', stylers: [{ visibility: 'off' }] },
          { featureType: 'poi', stylers: [{ visibility: 'off' }] }
        ],
        gestureHandling: 'greedy'
      }}
      mapContainerStyle={containerStyle}
      center={{
        lat: locations[0]?.coordinate?.latitude ? parseFloat(locations[0]?.coordinate?.latitude) : 31.9686,
        lng: locations[0]?.coordinate?.longitude ? parseFloat(locations[0]?.coordinate?.longitude) : 99.9018
      }}
      zoom={resource === sidebarResource.padMaster ? 5 : resource === sidebarResource.wellMaster ? 7 : 15}
    >
      {locations?.map((item) => {
        const { type, label, value, coordinate, className, ...rest } = item;
        return (
          <>
            <InfoWindow
              options={{
                headerDisabled: true,
                disableAutoPan: true,
                pixelOffset: new window.google.maps.Size(0, -30)
              }}
              position={new google.maps.LatLng(coordinate?.latitude, coordinate?.longitude)}>
              <>
                <button onClick={() => stStore({ activeItem: item._id })} className="flex m-2 cursor-pointer flex-col justify-center bg-transparent text-left"   >
                  <div key={label} className={cn('items-start', className)} {...rest}>
                    <p className=" line-clamp-2 text-center font-bold text-[#6B7280] dark:text-gray-300"
                      title={typeof value === 'string' ? value : ''}
                    >
                      {value}
                    </p>
                  </div>
                </button>
              </>
            </InfoWindow>
          </>
        );
      })}
    </GoogleMap>
  );
};

export default MapView;
