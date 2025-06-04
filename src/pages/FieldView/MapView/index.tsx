import { GoogleMap, InfoWindow, Marker, InfoBox } from '@react-google-maps/api';
import { useEffect, useState } from 'react';
import { cn } from 'src/constants/helpers';
import { generateData, getAddressPayload } from 'src/pages/FieldView/CardView/utils';
import { FieldViewResource, TData } from 'src/pages/FieldView/types';
import { useFieldStore } from 'src/pages/FieldView/useFieldStore';

type MapProps = {
  data: TData[];
  resource: FieldViewResource;
};

// const hasLatLng = typeof item?.address?.latitude === 'number' && typeof item?.address?.longitude === 'number';
// const payload: google.maps.GeocoderRequest = hasLatLng
//   ? { location: { lat: item.address.latitude, lng: item.address.longitude } }
//   : { address: item?.address?.optionLabel as string };

type LocationData = { latitude: number; longitude: number; _id: string } & TData;

const MapView = ({ data, resource }: MapProps) => {
  const containerStyle = {
    minHeight: '600px',
    height: '100%',
    maxWidth: '100%',
    minWidth: '100%'
  };
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [, stStore] = useFieldStore((store) => store.activeItem);

  useEffect(() => {
    if (data) {
      const geocoder = new window.google.maps.Geocoder();
      const geocodePromises: Promise<LocationData>[] = data.map((item) => {
        const payload = getAddressPayload(item, resource);
        return new Promise((resolve, reject) => {
          geocoder.geocode(payload, (results, status) => {
            if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
              const { location } = results[0].geometry;
              resolve({ latitude: location.lat(), longitude: location.lng(), _id: item._id, ...item } as LocationData);
            } else {
              reject(`Geocode failed for ${item._id} with status: ${status}`);
            }
          });
        });
      });
      Promise.allSettled(geocodePromises)
        .then((results) => {
          const successfulLocations = results
            .filter((result): result is PromiseFulfilledResult<LocationData> => result.status === 'fulfilled')
            .map((result) => result.value);

          setLocations(successfulLocations);
        })
        .catch((error) => {
          console.error('Unexpected error:', error);
        });
    }
  }, [data, resource]);

  return (
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
        // gestureHandling: 'cooperative',
        gestureHandling: 'greedy'
      }}
      mapContainerStyle={containerStyle}
      center={{ lat: locations[0]?.latitude ? locations[0].latitude : 31.9686, lng: locations[0]?.longitude ? locations[0]?.longitude : 99.9018 }}
      zoom={4}
    >
      {locations?.map((item) => {
        const { type, label, value, className, ...rest } = generateData(item, resource)[0];

        return (
          <>
            <InfoWindow position={new google.maps.LatLng(item?.latitude, item?.longitude)} options={{ minWidth: 200, maxWidth: 400 }}>
              <>
                <button
                  onClick={() => stStore({ activeItem: item._id })}
                  className="flex w-[200px] cursor-pointer flex-col justify-center bg-transparent px-2 py-4 text-left"
                >
                  <div key={label} className={cn('items-start', className)} {...rest}>
                    {/* <h6 className="text-sm font-semibold text-[--primary-text]">{label}: </h6> */}
                    <p
                      className=" line-clamp-2 text-center font-bold text-[#6B7280] dark:text-gray-300"
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
        // <Marker key={item?._id} position={new google.maps.LatLng(item?.latitude, item?.longitude)} />;
      })}
    </GoogleMap>
  );
};

export default MapView;
