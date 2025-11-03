import { useMediaQuery } from '@mui/material';
import { kebabCase, uniq } from 'lodash';
import { useCallback, useContext, useEffect, useReducer, useRef } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { pageTitle } from 'src/pages/UserManual/constants';
import { ManualActions, SearchData, UseManualState } from 'src/pages/UserManual/type';
import { createURl, getCurrentManualUrl, getPageDataByUrl, getSectionFromUrl } from 'src/pages/UserManualNew/utilsNew';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const initialState: UseManualState = {
  manualData: [],
  isSidebarOpen: false,
  currentRoute: '',
  pageData: [],
  loading: false,
  searchData: []
};

const handleCreateData = (section: any, path: string, group: string) => {
  const data: SearchData = {
    ...section,
    path,
    group,
    scrollKey: `#${kebabCase(`${section.sectionName}-section-id`)}`
  };
  return data;
};

const reducer = (state: UseManualState, action: ManualActions) => {
  switch (action.type) {
    case 'setManualData':
      return { ...state, manualData: action.payload };
    case 'setIsSidebarOpen':
      return { ...state, isSidebarOpen: action.payload };
    case 'setSearchData': {
      return { ...state, searchData: action.payload };
    }
    case 'setLoading':
      return { ...state, loading: action.payload };
    case 'setCurrentRoute': {
      const pageData = getPageDataByUrl(state.manualData, action.payload);
      const updatedState = { ...state, currentRoute: action.payload };
      const sections = getSectionFromUrl(action.payload);
      document.title = `${sections?.[0] ? sections?.[0] + ' | ' : ''} ${pageTitle}`;
      if (pageData) {
        updatedState.pageData = [...pageData];
      }
      return updatedState;
    }
    case 'setPageData':
      return { ...state, pageData: action.payload };
    default:
      return state;
  }
};

const useManualNew = () => {
  const toastConfig = useContext(CustomToastContext);
  const [state, setState] = useReducer(reducer, initialState);
  const { isSidebarOpen, manualData } = state;
  const isMobile = useMediaQuery('(max-width:1024px)');
  const currentRoute = useRef<string>('');

  const toggleSidebar = useCallback(() => {
    setState({ type: 'setIsSidebarOpen', payload: !isSidebarOpen });
  }, [isSidebarOpen]);

  const fetchData = useCallback(() => {
    setState({ type: 'setLoading', payload: true });
    axiosInstance()
      .get('/user-manual-master/get-all')
      .then(({ data: { data } }) => {
        const searchData: SearchData[] = [];
        const sectionNames = uniq(data?.resources?.map((e) => e?.sectionName)).filter((d) => !!d);
        const result = [];
        
        sectionNames?.forEach((ele) => {
          const obj: any = {};
          obj.sectionName = ele;
          obj.resource = data?.resources
            ?.filter((e) => e.sectionName === ele)
            ?.map(resource => {
              const path = `/${resource.sectionName}/${resource.resourceLabel || resource.resource}`;
              
              if (resource.content) {
                const sectionData = {
                  content: resource.content,
                  sectionName: resource.resourceLabel || resource.resource
                };
                searchData.push(handleCreateData(sectionData, path, resource.sectionName));
              }
              
              return {
                ...resource,
                resourceLabel: resource.resourceLabel || resource.resource,
                sections: [{
                  content: resource.content,
                  sectionName: resource.resourceLabel || resource.resource
                }]
              };
            });
          result.push(obj);
        });
        
        setState({ type: 'setSearchData', payload: searchData });
        setState({ type: 'setManualData', payload: result });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setState({ type: 'setLoading', payload: false });
      });
  }, [toastConfig]);

  const navigate = useCallback((url, hash?: string) => {
    if (url) {
      const parsedUrl = createURl(url, hash);
      currentRoute.current = parsedUrl;
      setState({ type: 'setCurrentRoute', payload: parsedUrl });
      window.history.pushState(null, '', parsedUrl);
    }
  }, []);

  useEffect(() => {
    const handlePopstate = () => {
      const url = getCurrentManualUrl();
      if (currentRoute.current === url) return;
      currentRoute.current = url;
      setState({ type: 'setCurrentRoute', payload: url });
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [manualData, navigate]);

  useEffect(() => {
    if (manualData) {
      const url = getCurrentManualUrl();
      currentRoute.current = url;
      setState({ type: 'setCurrentRoute', payload: url });
    } else {
      document.title = pageTitle;
    }
  }, [manualData, navigate]);

  useEffect(() => {
    fetchData();
  }, []);

  return { ...state, isMobile, setState, toggleSidebar, navigate };
};

export type UseManual = ReturnType<typeof useManualNew>;
export default useManualNew;
