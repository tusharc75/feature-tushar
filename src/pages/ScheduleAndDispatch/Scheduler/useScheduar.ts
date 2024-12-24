import { useMediaQuery } from '@material-ui/core';
import React, { useCallback, useContext, useEffect } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { rentalManagement, sidebarResource } from 'src/constants/helpers';
import { SchedularState, TabKey, UseScheduarActions } from 'src/pages/ScheduleAndDispatch/Scheduler/types';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';

const initialState: SchedularState = {
  selectedAssets: [],
  selectedServices: [],
  selectedTechnicians: [],
  selectedWarehouse: '',
  productOptions: [],
  warehouseOptions: [],
  selectedProduct: null,
  loading: false,
  activeTab: null,
  tabs: [],
  activeTabIndex: -1
};

const reducer = (state: SchedularState, action: UseScheduarActions) => {
  switch (action.type) {
    case 'setSelectedAssets':
      return { ...state, selectedAssets: action.payload };
    case 'setSelectedServices':
      return { ...state, selectedServices: action.payload };
    case 'setSelectedTechnicians':
      return { ...state, selectedTechnicians: action.payload };
    case 'setSelectedWarehouse':
      return { ...state, selectedWarehouse: action.payload };
    case 'setProductOptions':
      return { ...state, productOptions: action.payload };
    case 'setWarehouseOptions':
      return { ...state, warehouseOptions: action.payload };
    case 'setSelectedProduct':
      return { ...state, selectedProduct: action.payload };
    case 'setLoading':
      return { ...state, loading: action.payload };
    case 'setActiveTab':
      return { ...state, activeTab: action.payload };
    case 'setTabs':
      return { ...state, tabs: action.payload };
    case 'setActiveTabIndex':
      return { ...state, activeTabIndex: action.payload };
    default:
      return state;
  }
};

const useScheduar = () => {
  const [state, setState] = React.useReducer(reducer, initialState);
  const isMobile = useMediaQuery('(max-width:768px)');
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { resources, user, permissions }
  }: any = useData();

  const setSelectedAssets = useCallback((value: SchedularState['selectedAssets']) => setState({ type: 'setSelectedAssets', payload: value }), []);
  const setSelectedServices = useCallback(
    (value: SchedularState['selectedServices']) => setState({ type: 'setSelectedServices', payload: value }),
    []
  );
  const setSelectedTechnicians = useCallback(
    (value: SchedularState['selectedTechnicians']) => setState({ type: 'setSelectedTechnicians', payload: value }),
    []
  );
  const setSelectedWarehouse = useCallback(
    (value: SchedularState['selectedWarehouse']) => setState({ type: 'setSelectedWarehouse', payload: value }),
    []
  );
  const setProductOptions = useCallback((value: SchedularState['productOptions']) => setState({ type: 'setProductOptions', payload: value }), []);
  const setWarehouseOptions = useCallback(
    (value: SchedularState['warehouseOptions']) => setState({ type: 'setWarehouseOptions', payload: value }),
    []
  );
  const setSelectedProduct = useCallback((value: SchedularState['selectedProduct']) => setState({ type: 'setSelectedProduct', payload: value }), []);
  const setLoading = useCallback((value: SchedularState['loading']) => setState({ type: 'setLoading', payload: value }), []);
  const setTabs = useCallback((value: SchedularState['tabs']) => setState({ type: 'setTabs', payload: value }), []);
  const getTabData = useCallback(
    (key: TabKey) => {
      const index = state.tabs.findIndex((tab) => tab.key === key);
      if (index !== -1) {
        setState({ type: 'setActiveTabIndex', payload: index });
        return state.tabs[index];
      }
      setState({ type: 'setActiveTabIndex', payload: index });
      return null;
    },
    [state.tabs]
  );
  const setActiveTab = useCallback(
    (key: TabKey) => {
      setState({ type: 'setActiveTab', payload: getTabData(key) });
    },
    [getTabData]
  );

  const handleSave = useCallback(
    async (values) => {
      setLoading(true);

      const materialData = {
        assets:
          state.selectedAssets?.map((a) => ({
            asset: a?._id
          })) || [],
        services: state.selectedServices?.map((s) => s._id) || [],
        technicians: state.selectedTechnicians?.map((a) => a?._id) || []
      };

      try {
        const { data } = await axiosInstance().post(`${rentalManagement.api}/schedule-and-dispatch`, {
          ...values,
          warehouse: state.selectedWarehouse,
          materialData
        });

        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
        setSelectedAssets([]);
        setSelectedServices([]);
        setSelectedTechnicians([]);
        setActiveTab('assets');
        setSelectedWarehouse(state.warehouseOptions[0]?.optionValue);
        setSelectedProduct(null);
      } catch (error) {
        toastConfig.setToastConfig(error);
      } finally {
        setLoading(false);
      }
    },
    [
      setActiveTab,
      setLoading,
      setSelectedAssets,
      setSelectedProduct,
      setSelectedServices,
      setSelectedTechnicians,
      setSelectedWarehouse,
      state.selectedAssets,
      state.selectedServices,
      state.selectedTechnicians,
      state.selectedWarehouse,
      state.warehouseOptions,
      toastConfig
    ]
  );

  useEffect(() => {
    axiosInstance()
      .get(`/sa-formbuilder/lookup?lookupResource=${sidebarResource.warehouse},${sidebarResource.product}`)
      .then(({ data: { data } }) => {
        setWarehouseOptions(data[sidebarResource.warehouse]);
        setProductOptions(data[sidebarResource.product]);
        if (data[sidebarResource.warehouse]?.length) {
          setSelectedWarehouse(data[sidebarResource.warehouse][0]?.optionValue);
        }
      });
  }, [setProductOptions, setSelectedWarehouse, setWarehouseOptions]);

  useEffect(() => {
    const tabs: SchedularState['tabs'] = [
      { key: 'assets', label: resources?.serializedAsset?.titlePlural, show: true },
      { key: 'services', label: resources?.serviceMaster?.titlePlural, show: true },
      { key: 'technicians', label: resources?.employeeMaster?.titlePlural, show: permissions?.employeeMaster?.isRead },
      { key: 'customerDetail', label: 'Customer Detail', show: true }
    ];
    setTabs(tabs);
  }, [resources?.employeeMaster?.titlePlural, resources?.serializedAsset?.titlePlural, resources?.serviceMaster?.titlePlural, setTabs]);

  useEffect(() => {
    setActiveTab('assets');
  }, [setActiveTab, state.tabs]);

  return {
    ...state,
    isMobile,
    setSelectedAssets,
    setSelectedServices,
    setSelectedTechnicians,
    setSelectedWarehouse,
    setProductOptions,
    setWarehouseOptions,
    setSelectedProduct,
    setLoading,
    setActiveTab,
    setState,
    handleSave,
    getTabData,
    toastConfig,
    resources,
    user
  };
};

export default useScheduar;
