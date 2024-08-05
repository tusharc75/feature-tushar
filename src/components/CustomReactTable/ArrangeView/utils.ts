export type GridMetaData = { [key: string]: { hide: string[]; order: string[] } };
export type SelectedViewId = { [key: string]: string };

export const getLocalGridMetaData = (): { gridMetaData: GridMetaData; selectedViews: SelectedViewId } => {
  const selectedViews = JSON.parse(localStorage.getItem('selectedViewId')) || {};
  const gridMetaData = JSON.parse(localStorage.getItem('gridMetaData')) || {};
  return { selectedViews, gridMetaData };
};

export const removeLocalSelectedViewId = (id: string, renderedFrom: string) => {
  const { selectedViews } = getLocalGridMetaData();
  delete selectedViews[renderedFrom];
  localStorage.setItem('selectedViewId', JSON.stringify(selectedViews));
};

export const setLocalGridMetaData = (gridMetaData: GridMetaData, selectedViewId: string) => {
  const { gridMetaData: oldGridMetaData, selectedViews } = getLocalGridMetaData();
  localStorage.setItem('gridMetaData', JSON.stringify({ ...oldGridMetaData, gridMetaData }));
  localStorage.setItem('selectedViewId', JSON.stringify({ ...selectedViews, [Object.keys(gridMetaData)[0]]: selectedViewId }));
};
