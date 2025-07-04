import { Action } from 'src/components/InfoSidebar/types';
import { sidebarResource } from 'src/constants/helpers';
import createFastContext from 'src/StateProvider/createFastContext';

type SidebarResource = typeof sidebarResource;

export type InfoSidebarState = {
  data: null | {
    resource?: SidebarResource[keyof SidebarResource];
    actionId?: string;
  };
  item?: Partial<Action>;
};

const initialState: InfoSidebarState = {
  data: null,
  item: null
};

export const { Provider: InfoSidebarProvider, useStore: useInforSidebar } = createFastContext(initialState);
