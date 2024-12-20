import { CustomReport, SelectedReport, Report, isCustomReport, isReport, FavouriteReport } from 'src/pages/ReportsNew/types';

export const handleGetRoute = ({ route, title }: { route: string; title: string }): SelectedReport => {
  const data: SelectedReport = {
    route: route,
    type: 'report',
    resource: '',
    title: title
  };
  if (!route) return data;
  const routeArr = route.split('/');
  const isStandardReport = routeArr[2] === 'standard-report';
  const isCustomReport = routeArr[2] === 'custom-report';
  if (isStandardReport) {
    data.type = 'standard-report';
    data.resource = routeArr[3];
    return data;
  }
  if (isCustomReport) {
    data.type = 'custom-report';
    data.resource = routeArr[3];
    return data;
  }
  data.resource = routeArr[2];
  return data;
};

export const createUserFavouriteObj = (item: Report | CustomReport) => {
  const name = (item as CustomReport)._id || (item as Report).label;
  const type: 'standard' | 'custom' = (item as CustomReport)._id ? 'custom' : 'standard';
  let obj: FavouriteReport = { identifier: name };
  if (isCustomReport(item)) {
    obj = {
      identifier: name,
      label: item.customReportName,
      reportType: type,
      ...item
    };
  } else if (isReport(item)) {
    obj = {
      identifier: name,
      label: item.label,
      reportType: type,
      key: item.key,
      type: item.type,
      ...item
    };
  }
  return { obj, name };
};
