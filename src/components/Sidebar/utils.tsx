import { kebabCase } from 'lodash';
import routes from '../Helpers/Routes';
import type { TResource, TSidebarSection } from './type';
import { staticHiddenResource } from 'src/constants/helpers';
import { FaRegUserCircle } from 'react-icons/fa';
import { MdOutlineDashboard } from 'react-icons/md';
import { AiOutlineFileText } from 'react-icons/ai';

export const isSectionVisible = (item: TResource) => {
  return (
    item.isRead &&
    !item.isHidden &&
    // item.sectionName !== '' &&
    !staticHiddenResource.includes(item.name) &&
    !(item?.name === 'Product Builder')
  );
};

export const handleRoutes = (item) => {
  switch (item.name) {
    case 'Pos':
      return routes.pos.path;
    default:
      return `/${kebabCase(item.name)}`;
  }
};

export const staticSidebarData = (user: any, permissions: any, isOffline: boolean) => {
  // permissions?.dashboard?.isRead && !isOffline &&
  // permissions?.report?.isRead && !isOffline &&

  const data: TSidebarSection[] = [
    {
      name: `${user?.user?.firstName} ${user?.user?.lastName}`,
      link: '/',
      sectionName: `${user?.user?.firstName} ${user?.user?.lastName}`,
      items: null,
      icon: <FaRegUserCircle size={20} />
    }
  ];
  if (permissions?.dashboard?.isRead && !isOffline) {
    data.push({
      name: `Dashboard`,
      link: '/dashboards',
      sectionName: `Dashboard`,
      items: null,
      icon: <MdOutlineDashboard size={20} />
    });
  }
  if (permissions?.report?.isRead && !isOffline) {
    data.push({
      name: `Reports`,
      link: '/reports',
      sectionName: `Reports`,
      items: null,
      icon: <AiOutlineFileText size={20} />
    });
  }

  return data;
};

export const isSectionActive = (pathName: string, location: string, section: TSidebarSection) => {
  const hasChild = Boolean(section.items);
  if (section.link === routes.reports.path) {
    return location.startsWith(routes.reports.path);
  }
  if (hasChild) {
    const items = section.items?.map((item) => item.name.toLowerCase().split(' ').join('-')) || [];
    return items.some((item) => pathName === item);
  } else {
    return location === section.link;
  }
};
