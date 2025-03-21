import axios, { CancelToken } from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { sidebarResource } from 'src/constants/helpers';
import { CustomToastContextType } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
export type TechnicianResource = { key: string; resource: string; title: string };

export const useTechnicianResources = (
  toastConfig: CustomToastContextType,
  setSelectedResource: React.Dispatch<React.SetStateAction<TechnicianResource>>
) => {
  const {
    state: { permissions, resources }
  }: any = useData();
  const [technicianResources, setTechnicianResources] = useState<TechnicianResource[]>([]);

  const allResources = useMemo(() => {
    const data: TechnicianResource[] = [];
    if (permissions?.fieldTicket?.isRead) {
      data.push({
        key: 'fieldTicket',
        resource: sidebarResource.fieldTicket,
        title: resources?.fieldTicket?.titlePlural
      });
    }
    if (permissions?.rentalManagement?.isRead) {
      data.push({
        key: 'rentalManagement',
        resource: sidebarResource.rentalManagement,
        title: resources?.rentalManagement?.titlePlural
      });
    }
    return data;
  }, [resources, permissions]);

  useEffect(() => {
    setSelectedResource(allResources[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allResources]);

  const fetchfieldServiceOrderPolicy = async (cancelToken: CancelToken) => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.fieldServiceOrder}`, { cancelToken });
      if (data?.policy?.addTechnicians && permissions?.fieldServiceOrder?.isRead) {
        const newResources = [...allResources];
        newResources.push({
          key: 'fieldServiceOrder',
          resource: sidebarResource.fieldServiceOrder,
          title: resources?.fieldServiceOrder?.titlePlural
        });
        setTechnicianResources(newResources);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  useEffect(() => {
    const cancelToken = axios.CancelToken.source();
    if (permissions && resources) {
      fetchfieldServiceOrderPolicy(cancelToken.token);
    }
    return () => {
      cancelToken.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions, resources]);

  return technicianResources;
};
