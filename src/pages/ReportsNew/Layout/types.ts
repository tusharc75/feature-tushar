import React from 'react';
import useLayout from 'src/pages/ReportsNew/Layout/useLayout';

export type LayoutState = {
  isSidebarOpen: boolean;
  transitionComplete: boolean;
};
export type LayoutActions = { type: 'setIsSidebarOpen'; payload: boolean } | { type: 'setTransitionComplete'; payload: boolean };

export type UseLayout = ReturnType<typeof useLayout>;

export type LayoutComponentProps = {
  state: UseLayout;
  children: React.ReactNode;
};
