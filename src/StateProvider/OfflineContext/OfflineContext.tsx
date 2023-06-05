import React, { createContext, useEffect, useState } from 'react';
import axiosInstance from '../../axios/axiosInstance';
import { deliveryTicket, rentalManagement, asyncForEach } from '../../constants/helpers';
import { objectStore, findAll, deleteOne, setUpindexDB } from '../../constants/indexdbhelper';
import { rentalJobOfflineUpdate } from '../../pages/RentalManagement/rentalOfflineHelper';
import { sortBy } from 'lodash';
import routes from 'src/components/Helpers/Routes';

export const CustomOfflineContext = createContext(null);


export const CustomOfflineProvider = ({ children }) => {


  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSynch, setIsSynch] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('token')) {
      synchronizationData();
    }
  }, [isOffline]);

  window.addEventListener(
    'load',
    function (e) {
      if (navigator.onLine) {
        if (isOffline) setIsOffline(false);
      } else {
        setIsOffline(true);
      }
    },
    false
  );

  window.addEventListener('online', function (e) {
    setIsOffline(false);
  });

  window.addEventListener('offline', function (e) {
    setIsOffline(true);
  });

  const synchronizationData = async () => {
    if (localStorage.getItem('isSynchronizationData') === 'true') {
      return false;
    }
    if (!isOffline) {
      await setUpindexDB();
      var data = await findAll(objectStore.offlineDataSync);
      if (data?.length) {
        localStorage.setItem('isSynchronizationData', 'true');
        setIsSynch(true);
        var OrderBy = ['Loading', 'Receiving'];
        data = sortBy(data, function (item: any) {
          return OrderBy.indexOf(item?.data?.ticketType);
        });
        await asyncForEach(data, async (d: any) => {
          if (d?.type === 'deliveryTicket') {
            await axiosInstance()
              .post(`${deliveryTicket.api}/offlinedatasync`, d.data)
              .then(({ data: { data } }) => {
                deleteOne(objectStore.offlineDataSync, d.data._id);
                deleteOne(objectStore.deliveryTicket, d.data._id);
              })
              .catch((error) => { });
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
          if (d?.type === 'assets') {
            d.data?.forEach((ele) => {
              delete ele.status;
            });
            await axiosInstance()
              .post(`${rentalManagement.api}/${d._id}/inventory/sync-assets`, d.data)
              .then(({ data: { data } }) => {
                deleteOne(objectStore.offlineDataSync, d._id);
              })
              .catch((error) => { });
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
          if (d?.type === 'fieldTicket') {
            await axiosInstance()
              .post(`${routes?.fieldTicket?.path}/offlinedatasync`, d.data)
              .then(({ data: { data } }) => {
                deleteOne(objectStore.offlineDataSync, d.data._id);
                deleteOne(objectStore.fieldTicket, d.data._id);
              })
              .catch((error) => { });
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        });
        await rentalJobOfflineUpdate([]);
        localStorage.removeItem('isSynchronizationData');
        setIsSynch(false);
      } else {
        setIsSynch(false);
      }
    }
  };

  return (
    <CustomOfflineContext.Provider
      value={{ isOffline, isSynch }}
    >
      {children}
    </CustomOfflineContext.Provider>
  );
};
