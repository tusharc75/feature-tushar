import React from 'react';
import { ASSET_STATUS, sidebarResource } from 'src/constants/helpers';
import { AssetData, WellData, PadData, Status, FieldViewResource } from 'src/pages/FieldView/types';

const convertToString = (value: string | Object | undefined) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

type GenerateDataReturnType = { label: string; value: React.ReactNode; type?: 'tag' | 'key-val' | 'location', coordinate?: any } & React.HTMLAttributes<HTMLDivElement>;
export const generateData = (data: any, resource: FieldViewResource) => {
  let generatedData: GenerateDataReturnType[] = [];

  switch (resource) {
    case sidebarResource?.padMaster: {
      const tempData = data as PadData;
      generatedData = [
        {
          label: 'Pad Name',
          value: convertToString(tempData.padName ?? '')
        },
        {
          label: 'Location',
          type: 'location',
          value: convertToString(tempData.address?.optionLabel ?? ''),
          coordinate: { latitude: tempData.address?.latitude, longitude: tempData.address?.longitude }
        }
      ];
      break;
    }
    case sidebarResource?.wellMaster: {
      const tempData = data as WellData;
      generatedData = [
        {
          label: 'Well Name',
          value: convertToString(tempData.wellName ?? '')
        },
        {
          label: 'Location',
          type: 'location',
          value: convertToString(tempData.address?.optionLabel ?? ''),
          coordinate: { latitude: tempData.address?.latitude, longitude: tempData.address?.longitude }
        }
      ];
      break;
    }
    case sidebarResource?.serializedAsset: {
      const tempData = data as any;
      generatedData = [
        {
          label: 'Asset',
          value: convertToString(tempData.assetNumber ?? '')
        },
        {
          label: 'Product',
          value: convertToString(tempData.product?.optionLabel ?? '')
        },
        {
          label: 'Location',
          type: 'location',
          coordinate: { latitude: tempData.currentLocation?.latitude, longitude: tempData.currentLocation?.longitude },
          value: convertToString(tempData.currentLocation?.optionLabel ?? '')
        },
        {
          label: 'Status',
          value: <>{convertToString(tempData.status)}</>,
          type: 'tag',
          className: statusColorMap(tempData.status)
        }
      ];
      break;
    }
    default:
      break;
  }

  return generatedData;
};

export const getAddressPayload = (data: any, resource: FieldViewResource) => {
  let payload: google.maps.GeocoderRequest = {};
  if (resource === sidebarResource?.padMaster || resource === sidebarResource.wellMaster) {
    const newData = data as PadData;
    const hasLatLng = typeof newData?.address?.latitude === 'number' && typeof newData?.address?.longitude === 'number';
    if (hasLatLng) {
      payload.location = { lat: newData.address.latitude, lng: newData.address.longitude };
    } else {
      payload.address = newData?.address?.optionLabel;
    }
  }
  if (resource === sidebarResource?.serializedAsset) {
    const newData = data as AssetData;
    payload.address = newData?.currentLocation?.optionLabel;
  }
  return payload;
};

const statusColorMap = (status: Status) => {
  let className = '';
  switch (status) {
    case ASSET_STATUS.needRepair:
      className = 'bg-red-500 text-white dark:bg-red-800 dark:text-white';
      break;
    case ASSET_STATUS.needRecert:
      className = 'bg-orange-500 text-white dark:bg-orange-800 dark:text-white';
      break;
    default:
      className = 'bg-green-500 text-white dark:bg-green-800 dark:text-white';
      break;
  }
  return className;
};
