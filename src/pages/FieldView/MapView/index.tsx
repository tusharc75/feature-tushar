import { GoogleMap, InfoWindow, Marker } from '@react-google-maps/api';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppTheme } from 'src/constants/AppConfig';
import { cn, mapDarkTheme, mapLightTheme } from 'src/constants/helpers';
import { generateData, getAddressPayload } from 'src/pages/FieldView/CardView/utils';
import { FieldViewResource, TData } from 'src/pages/FieldView/types';
import { useFieldStore } from 'src/pages/FieldView/useFieldStore';

type MapProps = {
  data: TData[];
  resource: FieldViewResource;
};

type LocationData = { latitude: number; longitude: number; _id: string } & TData;

const MapView = ({ data, resource }: MapProps) => {
  const containerStyle = {
    minHeight: '600px',
    height: '100%',
    maxWidth: '100%',
    minWidth: '100%'
  };
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [, setStore] = useFieldStore((store) => store.activeItem);
  const [thmeColor] = useAppTheme();
  const mapRef = useRef<GoogleMap>(null);

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

          const availableLocations = successfulLocations?.reduce(
            (a, c) => {
              a[c._id] = { lat: c.latitude, lng: c.longitude };
              return a; // Return the accumulator
            },
            {} as Record<string, { lat: number; lng: number }>
          );
          setStore({ availableLocations });
          setLocations(successfulLocations);
        })
        .catch((error) => {
          console.error('Unexpected error:', error);
        });
    }
  }, [data, resource]);

  return (
    <GoogleMap
      ref={mapRef}
      options={{
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        mapTypeControlOptions: {
          style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
        },

        styles: thmeColor === 'dark' ? mapDarkTheme : mapLightTheme,
        // gestureHandling: 'cooperative',
        gestureHandling: 'greedy'
      }}
      mapContainerStyle={containerStyle}
      center={{ lat: locations[0]?.latitude ? locations[0].latitude : 31.9686, lng: locations[0]?.longitude ? locations[0]?.longitude : 99.9018 }}
      zoom={8}
    >
      {locations?.map((item) => {
        return <RenderPoint item={item} resource={resource} setStore={setStore} />;
      })}
    </GoogleMap>
  );
};

export default MapView;

const RenderPoint = ({ item, setStore, resource }) => {
  const { type, label, value, className, ...rest } = generateData(item, resource)[0];
  const position = new google.maps.LatLng(item?.latitude, item?.longitude);

  const [infowindowOpen, setInfowindowOpen] = useState(true);

  return (
    <>
      <Marker position={position} onClick={() => setInfowindowOpen((prev) => true)} />
      {infowindowOpen && (
        <InfoWindow
          options={{ minWidth: 200, maxWidth: 400, headerDisabled: false }}
          position={position}
          onCloseClick={() => setInfowindowOpen(false)}
        >
          <div className="min-h-[47px]">
            <button
              onClick={() => setStore({ activeItem: item._id })}
              className="absolute inset-0 right-6 top-6 flex w-[200px] cursor-pointer flex-col justify-center bg-transparent px-2 py-4 text-left"
            >
              <div key={label} className={cn('items-start', className)} {...rest}>
                {/* <h6 className="text-sm font-semibold text-[--primary-text]">{label}: </h6> */}
                <p className=" line-clamp-2 text-center font-bold text-[#6B7280] dark:text-gray-300" title={typeof value === 'string' ? value : ''}>
                  {value}
                </p>
              </div>
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
};
