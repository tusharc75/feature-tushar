import { GoogleMap, Marker } from "@react-google-maps/api";
import { useEffect } from "react";

const MapView = ({ data }) => {

  const containerStyle = {
    minHeight: '600px',
    height: '100%',
    maxWidth: '100%',
    minWidth: '100%'
  };


  useEffect(() => {
    if (data) {
      data?.forEach((item: any) => {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: item?.address?.optionLabel }, (results, status) => {
          if (status === "OK" && results[0]) {
            const { location } = results[0].geometry;
            item.address.latitude = location.lat()
            item.address.longitude = location.lng()
          }
        });
      });
    }
  }, [data]);

  return (
    <div>
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
          gestureHandling: 'cooperative'
        }}
        mapContainerStyle={containerStyle}
        center={{ lat: 31.9686, lng: 99.9018 }}
        zoom={4}
      >
        {data?.map((item) => {
          return (
            <Marker
              key={item?.id}
              position={new google.maps.LatLng(item?.address?.latitude, item?.address?.longitude)}
            />
          );
        })}

      </GoogleMap>
    </div>
  )
}

export default MapView;
