import axios, { CancelToken } from 'axios';
import React, { useEffect, useMemo, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { fieldServiceOrder, fieldTicket, rentalManagement, sidebarResource } from 'src/constants/helpers';
import { CustomToastContextType } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
export type TechnicianResource = { key: string; resource: string; title: string, titleSingular: string, api: string };

export const useTechnicianResources = (
  toastConfig: CustomToastContextType,
  setSelectedResource: React.Dispatch<React.SetStateAction<TechnicianResource>>
) => {
  const {
    state: { permissions, resources, user }
  }: any = useData();
  const [technicianResources, setTechnicianResources] = useState<TechnicianResource[]>([]);

  const allResources = useMemo(() => {
    const data: TechnicianResource[] = [];
    if (permissions?.fieldTicket?.isRead) {
      data.push({
        key: 'fieldTicket',
        resource: sidebarResource.fieldTicket,
        title: resources?.fieldTicket?.titlePlural,
        titleSingular: resources?.fieldTicket?.titleSingular,
        api: fieldTicket.api
      });
    }
    if (permissions?.rentalManagement?.isRead && user?.user?.brandPolicy?.rentalService) {
      data.push({
        key: 'rentalManagement',
        resource: sidebarResource.rentalManagement,
        title: resources?.rentalManagement?.titlePlural,
        titleSingular: resources?.rentalManagement?.titleSingular,
        api: rentalManagement.api
      });
    }
    return data;
  }, [resources, permissions]);

  const fetchfieldServiceOrderPolicy = async (cancelToken: CancelToken) => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.fieldServiceOrder}`, { cancelToken });
      const newResources = [...allResources];
      if (data?.policy?.addTechnicians && permissions?.fieldServiceOrder?.isRead) {
        newResources.unshift({
          key: 'fieldServiceOrder',
          resource: sidebarResource.fieldServiceOrder,
          title: resources?.fieldServiceOrder?.titlePlural,
          titleSingular: resources?.fieldServiceOrder?.titleSingular,
          api: fieldServiceOrder.api
        });
      }
      setSelectedResource(newResources[0]);
      setTechnicianResources(newResources);
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
