import React, { createContext, useEffect, useState } from 'react';
import axiosInstance from '../../axios/axiosInstance';
import { deliveryTicket, rentalManagement, asyncForEach } from '../../constants/helpers';
import { objectStore, findAll, deleteOne, setUpindexDB, deleteMany } from '../../constants/indexdbhelper';
import { rentalJobOfflineUpdate } from '../../pages/RentalManagement/rentalOfflineHelper';
import { sortBy } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import { fieldServiceOrderAddOffline } from 'src/pages/FieldServiceOrder/Services/OfflineHelper';

export const CustomOfflineContext = createContext(null);

export const CustomOfflineProvider = ({ children }) => {

  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isSynch, setIsSynch] = useState(false);
  const history = useHistory();

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
    try {
      if (!isOffline) {
        history.push('/');
        await setUpindexDB();
        var data = await findAll(objectStore.offlineDataSync);
        if (data?.length) {
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
              await axiosInstance().post(`${routes?.fieldTicket?.path}/offlinedatasync`, d.data);
              deleteOne(objectStore.offlineDataSync, d.data._id);
              deleteOne(objectStore.offlineDataSync, `${d.data._id}_submit`);
              deleteOne(objectStore.fieldTicket, d.data._id);
              let fieldTicketMaterial = await findAll(objectStore.fieldTicketMaterial);
              fieldTicketMaterial = fieldTicketMaterial?.filter((e) => e?.fieldTicketId === d?.data?._id)?.map((e) => e?._id);
              let fieldTicketLogs = await findAll(objectStore.fieldTicketLogs);
              fieldTicketLogs = fieldTicketLogs?.filter((e) => e?.fieldTicketId === d?.data?._id)?.map((e) => e?._id);
              deleteMany(objectStore.fieldTicketLogs, fieldTicketLogs);
              deleteMany(objectStore.fieldTicketMaterial, fieldTicketMaterial);
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
            if (d?.type === 'fieldTicketMaterial') {
              if (d?.data?.length) {
                await axiosInstance()
                  .post(`${routes?.fieldTicket?.path}/${d.data[0]?.fieldTicketId}/material-offline-data-sync`, d.data)
                  .then(({ data: { data } }) => {
                    let ids = d?.data?.map((e) => e?._id);
                    deleteMany(objectStore.fieldTicketMaterial, ids);
                  })
                  .catch((error) => { });
                await new Promise((resolve) => setTimeout(resolve, 2000));
              }
              deleteOne(objectStore.offlineDataSync, d._id);
            }
            if (d?.type === 'fieldTicketMaterialDelete') {
              await axiosInstance()
                .post(`${routes?.fieldTicket?.path}/${d?.data?.fieldTicketId}/material-offline-data-sync`, d.data)
                .then(({ data: { data } }) => {
                  deleteOne(objectStore.offlineDataSync, d._id);
                })
                .catch((error) => { });
              await new Promise((resolve) => setTimeout(resolve, 2000));
            }
          });
          fieldServiceOrderAddOffline([]);
          rentalJobOfflineUpdate([]);
        }
        setIsSynch(false);
      }
    } catch (err) {
      setIsSynch(false);
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
