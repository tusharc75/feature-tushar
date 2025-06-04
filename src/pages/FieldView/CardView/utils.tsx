import { Person } from '@mui/icons-material';
import React from 'react';
import { sidebarResource } from 'src/constants/helpers';
import { AssetData, WellData, PadData, TData, Status, FieldViewResource } from 'src/pages/FieldView/types';

const convertToString = (value: string | Object | undefined) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return JSON.stringify(value);
};

type GenerateDataReturnType = { label: string; value: React.ReactNode; type?: 'tag' | 'key-val' } & React.HTMLAttributes<HTMLDivElement>;
export const generateData = (data: TData, resource: FieldViewResource) => {
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
          value: convertToString(tempData.address?.optionLabel ?? '')
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
          value: convertToString(tempData?.address?.optionLabel ?? '')
        },
        {
          label: 'Amount',
          value: convertToString(tempData.amount ?? '')
        },
        {
          label: 'Created By',
          value: (
            <>
              <Person fontSize="small" /> {convertToString(tempData.createdBy?.user?.concatedName ?? '')}
            </>
          ),
          type: 'tag'
        }
      ];
      break;
    }
    case sidebarResource?.serializedAsset: {
      const tempData = data as AssetData;
      generatedData = [
        {
          label: 'Asset Number',
          value: convertToString(tempData.assetNumber ?? '')
        },
        {
          label: 'Location',
          value: convertToString(tempData.currentLocation?.optionLabel ?? '')
        },
        {
          label: 'WareHouse',
          value: convertToString(tempData.warehouse?.optionLabel ?? '')
        },
        {
          label: 'Status',
          value: <>{convertToString(tempData.status ?? '')}</>,
          type: 'tag',
          className: statusColorMap(tempData.status ?? 'Available')
        }
      ];
      break;
    }
    default:
      break;
  }

  return generatedData;
};

export const getAddressPayload = (data: TData, resource: FieldViewResource) => {
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
    case 'Available':
      className = 'bg-green-500 text-white dark:bg-green-800 dark:text-white';
      break;
    case 'Lost':
      className = 'bg-red-500 text-white dark:bg-red-800 dark:text-white';
      break;
    case 'Customer Possession':
      className = 'bg-orange-500 text-white dark:bg-orange-800 dark:text-white';
      break;
    case 'In-Use':
      className = 'bg-blue-500 text-white dark:bg-blue-800 dark:text-white';
      break;
    case 'In-Repair':
      className = 'bg-yellow-500 text-black dark:bg-yellow-800 dark:text-white';
      break;
    case 'Delivered':
      className = 'bg-green-500 text-black dark:bg-green-800 dark:text-white';
      break;
    case 'New':
      className = 'bg-blue-500 text-white dark:bg-blue-800 dark:text-white';
      break;
    case 'In-Transit':
      className = 'bg-emerald-500 text-black dark:bg-emerald-800 dark:text-white';
      break;
    default:
      break;
  }
  return className;
};
