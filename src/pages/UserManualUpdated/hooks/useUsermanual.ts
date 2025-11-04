import createFastContext from 'src/StateProvider/createFastContext';
import { Resource, SearchData, UseManualState } from '../types';
import { useCallback, useContext, useEffect } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { uniq } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import { useMediaQuery } from '@mui/material';
import { useHistory, useLocation } from 'react-router-dom';
import { BASE_ROUTE, HOME_RESOURCE_KEY, makeSafeId } from '../utils';

const initialState: UseManualState = {
  manualData: new Map(),
  leftSidebarData: [],
  isSidebarOpen: false,
  currentRoute: null,
  pageData: [],
  loading: true,
  searchData: [],
  isMobile: false,
  toggleSidebar: (prev) => ({ isSidebarOpen: !prev.isSidebarOpen })
};

export const { Provider: UsermanualProvider, useStore: useUserManualStore } = createFastContext<UseManualState>(initialState);

const handleCreateData = (section: any, path: string, group: string) => {
  const data: SearchData = {
    ...section,
    path,
    group,
    scrollKey: `#${makeSafeId(`${section.sectionName}`)}`
  };
  return data;
};

export const useUsermanual = () => {
  const location = useLocation();
  const [, setStore] = useUserManualStore((store) => store.loading);
  const toastConfig = useContext(CustomToastContext);
  const isMobile = useMediaQuery('(max-width:1024px)');
  const history = useHistory();

  useEffect(() => {
    setStore({ currentRoute: location });
  }, [location, setStore]);

  useEffect(() => {
    setStore({ isMobile });
  }, [isMobile, setStore]);

  const fetchData = useCallback(() => {
    setStore({ loading: true });
    const outerMap = new Map<string, Map<string, Resource>>();
    axiosInstance()
      .get('/user-manual-master/get-all')
      .then(({ data: { data } }) => {
        const searchData: SearchData[] = [];
        const sectionNames = uniq<string>(data?.resources?.map((e) => e?.sectionName)).filter((d) => !!d);
        const result = [];

        sectionNames?.forEach((ele) => {
          const innerMap = new Map<string, Resource>();
          const obj: any = {};
          obj.sectionName = ele;
          obj.resource = data?.resources
            ?.filter((e) => e.sectionName === ele)
            ?.map((resource) => {
              const label = resource.resourceLabel || resource.resource;
              const path = `/${resource.sectionName}/${label}`;
              if (resource.content) {
                const sectionData = {
                  content: resource.content,
                  sectionName: label
                };
                searchData.push(handleCreateData(sectionData, path, resource.sectionName));
              }
              innerMap.set(label, resource);
              return {
                ...resource,
                resourceLabel: label,
                sections: [
                  {
                    content: resource.content,
                    sectionName: label
                  }
                ]
              };
            });
          outerMap.set(ele, innerMap);
          if (ele !== HOME_RESOURCE_KEY) result.push(obj);
        });
        setStore({ searchData: searchData.filter((d) => d.sectionName !== HOME_RESOURCE_KEY), leftSidebarData: result, manualData: outerMap });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setStore({ loading: false });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setStore]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const navigate = useCallback(({ route, hash }: { route: string; hash?: string }) => {
    const cleanedUrl = route.startsWith('/') ? route : `/${route}`;
    if (route === '/') {
      history.push({
        pathname: `${BASE_ROUTE}`,
        hash
      });
    } else {
      history.push({
        pathname: `${BASE_ROUTE}${cleanedUrl}`,
        hash
      });
    }
    if (!hash) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
      });
    }
  }, []);

  return {
    navigate
  };
};
