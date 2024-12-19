import { useMediaQuery } from '@material-ui/core';
import { uniq } from 'lodash';
import { useCallback, useContext, useEffect, useReducer } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { pageTitle } from 'src/pages/UserManual/constants';
import { ManualActions, UseManualState } from 'src/pages/UserManual/type';
import { createURl, getCurrentManualUrl, getPageDataByUrl, getSectionFromUrl } from 'src/pages/UserManual/utils';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const initialState: UseManualState = {
  manualData: [],
  isSidebarOpen: false,
  currentRoute: '',
  pageData: [],
  loading: false
};

const reducer = (state: UseManualState, action: ManualActions) => {
  switch (action.type) {
    case 'setManualData':
      return { ...state, manualData: action.payload };
    case 'setIsSidebarOpen':
      return { ...state, isSidebarOpen: action.payload };
    case 'setLoading':
      return { ...state, loading: action.payload };
    case 'setCurrentRoute': {
      const pageData = getPageDataByUrl(state.manualData, action.payload);
      const updatedState = { ...state, currentRoute: action.payload };
      const sections = getSectionFromUrl(action.payload);
      document.title = `${sections?.[1] ? sections[1] + ' | ' : ''} ${pageTitle}`;
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

const useManual = () => {
  const toastConfig = useContext(CustomToastContext);
  const [state, setState] = useReducer(reducer, initialState);
  const { isSidebarOpen, manualData } = state;
  const isMobile = useMediaQuery('(max-width:1024px)');

  const toggleSidebar = useCallback(() => {
    setState({ type: 'setIsSidebarOpen', payload: !isSidebarOpen });
  }, [isSidebarOpen]);

  const fetchData = useCallback(() => {
    setState({ type: 'setLoading', payload: true });
    axiosInstance()
      .get('/user/user-manual')
      .then(({ data: { data } }) => {
        const sectionNames = uniq(data?.resources?.map((e) => e?.sectionName));
        const result = [];
        sectionNames?.forEach((ele) => {
          const obj: any = {};
          obj.sectionName = ele;
          obj.resource = data?.resources?.filter((e) => e.sectionName === ele);
          result.push(obj);
        });
        setState({ type: 'setManualData', payload: result });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setState({ type: 'setLoading', payload: false });
      });
  }, [toastConfig]);

  const navigate = useCallback((url, scrollKey = null) => {
    if (url) {
      const parsedUrl = createURl(url);
      setState({ type: 'setCurrentRoute', payload: parsedUrl });
      window.history.pushState(null, '', parsedUrl);
  
      if (scrollKey) {
        setTimeout(() => {
          const element = document.querySelector(scrollKey);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 0);
      }
    }
  }, []);
  

  useEffect(() => {
    const handlePopstate = () => {
      const url = getCurrentManualUrl();
      setState({ type: 'setCurrentRoute', payload: url });
    };
    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, [manualData, navigate]);

  useEffect(() => {
    if (manualData) {
      const url = getCurrentManualUrl();
      setState({ type: 'setCurrentRoute', payload: url });
    } else {
      document.title = pageTitle;
    }
  }, [manualData]);

  useEffect(() => {
    fetchData();
  }, []);

  return { ...state, isMobile, setState, toggleSidebar, navigate };
};

export type UseManual = ReturnType<typeof useManual>;
export default useManual;
