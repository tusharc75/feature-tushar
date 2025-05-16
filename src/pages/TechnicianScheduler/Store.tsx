import createFastContext from 'src/StateProvider/createFastContext';

type Store = {
  activeItemData: { type: 'technician' | 'sidebar'; data: any };
  leftSearchValue: string;
  technicianSearchValue: string;
  mapData: string[] | null;
};
const initialState: Store = {
  activeItemData: null,
  leftSearchValue: '',
  technicianSearchValue: '',
  mapData: null
};

const { Provider, useStore } = createFastContext<Store>(initialState);

export { Provider as RoadMapProvider, useStore as useRoadMapStore };
