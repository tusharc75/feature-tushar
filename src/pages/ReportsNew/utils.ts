import { SelectedReport } from 'src/pages/ReportsNew/types';

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
