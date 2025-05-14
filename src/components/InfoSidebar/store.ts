import { sidebarResource } from 'src/constants/helpers';
import createFastContext from 'src/StateProvider/createFastContext';

type SidebarResource = typeof sidebarResource;

export type InfoSidebarState = {
  data: null | {
    resource: SidebarResource[keyof SidebarResource];
    actionId: string;
  };
};

const initialState: InfoSidebarState = {
  data: null
};

export const { Provider: InfoSidebarProvider, useStore: useInforSidebar } = createFastContext(initialState);
