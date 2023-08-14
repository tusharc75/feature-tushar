import { AiFillAccountBook } from 'react-icons/ai';
import { SVGImages, IMAGE_WIDTH, IMAGE_HEIGHT, IconConst } from '../../assets/dashboard_images';
import DashboardIcons from 'src/assets/dashboard_images/icons';
import { CollaborationToolsIcon } from 'src/assets/sidebar_assets/icons';

import {
  ProductSetup,
  ServiceManagementIcon,
  RentalOperationManagementIcon,
  ServiceOperationManagementIcon,
  PurchasingManagementIcon,
  FieldServiceOperationIcon
} from '../../assets/sidebar_assets/icons';
import {
  BiCog,
  IoPeopleOutline,
  RiSuitcaseLine,
  BiCart,
  FaRegUserCircle,
  FaReact,
  FaRegRegistered,
  FaRegUser,
  MdOutlineDynamicForm,
  MdMiscellaneousServices,
  RiShieldUserLine,
  SiCivicrm,
  RiCustomerServiceLine,
  AiOutlineCalendar,
  GiCircuitry,
  AiOutlineDatabase,
  HiOutlineWrenchScrewdriver,
  MdOutlineEventAvailable,
  PiUsersThree
} from 'react-icons/all';

// CREATE OBJECT FROM LIST GROUPED BY KEYGETTER
export const groupByKey = (arr = [], keyGetter) => {
  arr = arr.filter((item) => item.isRead && !item.isHidden);
  let result = [];
  result = arr.reduce((r, a) => {
    r[keyGetter(a)] = r[keyGetter(a)] || [];
    r[keyGetter(a)].push(a);
    return r;
  }, Object.create(null));
  return result;
};

// CREATE LIST FROM OBJECT SEPATATED BY KEY SECTIONNAME AND ASSGIN ICON, DESCRIPTOIN, AND COLOR
export const assignIconAndText = (groupedData) => {
  let dataList = [];
  let index = 0;
  for (const [key, values] of Object.entries(groupedData)) {
    if (key !== '') {
      let obj: any = { ...setDataBySectionName(key, index) };
      obj.head = key;
      obj.items = values;
      dataList.push(obj);
      index++;
    }
  }
  return dataList;
};

// CHECK SECTION NAME AND RETURN ICON, COLOR, AND DESCRIPTION
export const setDataBySectionName = (secName, index = 0) => {
  const colorAccessor = getColors(index);
  const iconColour = colorAccessor.icon || ['#FFA800', '#E35200'];

  let icon = <DashboardIcons.INVENTORY_MANAGEMENT colors={iconColour} />;
  let text = '';
  let sideBarIcon = <FaReact size={20} />;
  const color = '#ffffff';
  const gradient = colorAccessor.gradient || ['#FFA800', '#E35200'];

  if (['CRM +', 'Sales Management'].includes(secName)) {
    text = 'Convert leads and close sales deals faster.';
    icon = <DashboardIcons.CRM colors={iconColour} />;
    sideBarIcon = <SiCivicrm size={18} />;
  } else if (['eCommerce'].includes(secName)) {
    text = 'Simplified eCommerce functionalities to smoothen your lives.';
    icon = <DashboardIcons.ECOMMERCE colors={iconColour} />;
    sideBarIcon = <BiCart size={20} />;
  } else if (['Inventory Management'].includes(secName)) {
    text = 'Manage Inventory Smartly.';
    icon = <DashboardIcons.INVENTORY_MANAGEMENT colors={iconColour} />;
    sideBarIcon = <ServiceManagementIcon size={20} />;
  } else if (['Rental Operations Management'].includes(secName)) {
    text = 'Fulfill Rental Orders Faster.';
    icon = <DashboardIcons.ROM colors={iconColour} />;
    sideBarIcon = <RentalOperationManagementIcon size={20} />;
  } else if (['ROM'].includes(secName)) {
    text = 'Fulfill Rental Orders Faster.';
    icon = <DashboardIcons.ROM colors={iconColour} />;
    sideBarIcon = <FaRegRegistered size={20} />;
  } else if (['Field Service Operations'].includes(secName)) {
    text = 'Fulfill Service Orders Faster.';
    icon = <DashboardIcons.FIELD_SERVICE_OPERATION colors={iconColour} />;
    sideBarIcon = <FieldServiceOperationIcon size={20} />;
  } else if (['Repair & Maintenance Management'].includes(secName)) {
    text = 'Repair & Maintain your product and services at ease.';
    icon = <DashboardIcons.REPAIR_AND_MAINTENANCE_MANAGEMENT colors={iconColour} />;
    sideBarIcon = <HiOutlineWrenchScrewdriver size={18} />;
  } else if (['Admin Portal'].includes(secName)) {
    text = 'Build your own Template, Manage Roles and Entities.';
    icon = <DashboardIcons.ADMIN_PORTAL colors={iconColour} />;
    sideBarIcon = <RiShieldUserLine size={20} />;
  } else if (['Accounts'].includes(secName)) {
    text = 'Customer and Supplier Account Management at your fingertips.';
    icon = <DashboardIcons.ACCOUNTS colors={iconColour} />;
    sideBarIcon = <FaRegUser size={20} />;
  } else if (['Product Setup'].includes(secName)) {
    text = 'Product and Category Setup.';
    icon = <DashboardIcons.PRODUCT_SETUP colors={iconColour} />;
    sideBarIcon = <ProductSetup size={20} />;
  } else if (['Dynamic Forms'].includes(secName)) {
    text = 'Setup Dynamic Forms & Templates';
    icon = <DashboardIcons.FORM_ICON colors={iconColour} />;
    sideBarIcon = <MdOutlineDynamicForm size={20} />;
  } else if (['Service Operations Management'].includes(secName)) {
    text = 'Deploy, Track and Bill for field services efficiently.';
    icon = <DashboardIcons.SERVICE_OPERATION_MANAGEMENT colors={iconColour} />;
    sideBarIcon = <ServiceOperationManagementIcon size={20} />;
  } else if (['Purchasing Management'].includes(secName)) {
    text = 'Manage working capital effectively.';
    icon = <DashboardIcons.PURCHASING_MANAGEMENT colors={iconColour} />;
    sideBarIcon = <PurchasingManagementIcon size={20} />;
  } else if (['Planning & Forecasting'].includes(secName)) {
    text = 'Optimize your resource utilization.';
    icon = <DashboardIcons.PLANNING_FORECASTING colors={iconColour} />;
    sideBarIcon = <MdOutlineEventAvailable size={20} />;
  } else if (['Brand Admin'].includes(secName)) {
    sideBarIcon = <FaRegUserCircle size={20} />;
  } else if (['Master Data'].includes(secName)) {
    sideBarIcon = <AiOutlineDatabase size={20} />;
  } else if (['Rental Management'].includes(secName)) {
    sideBarIcon = <FaRegRegistered size={20} />;
  } else if (['Service Management'].includes(secName)) {
    sideBarIcon = <ServiceManagementIcon size={18} />;
  } else if (['Setups & Administration'].includes(secName)) {
    sideBarIcon = <BiCog size={20} />;
  } else if (['Activities', 'Collaboration Tools'].includes(secName)) {
    sideBarIcon = <CollaborationToolsIcon size={20} />;
  }

  return {
    icon: icon,
    text: text,
    color: color,
    sideBarIcon,
    gradient
  };
};

const colourCodes = [
  {
    main: '#FFEFEE',
    icon: ['#FC5757', '#C60707'],
    iconGradient: ['#FC5757', '#C60707', '#FC5757'],
    gradient: ['#FC5757', '#C60707']
  },
  {
    main: '#F3F8FF',
    icon: ['#68C82E', '#03640D'],
    iconGradient: ['#68C82E', '#03640D', '#68C82E'],
    gradient: ['#68C82E', '#03640D']
  },
  {
    main: '#FFF7F2',
    icon: ['#FFA800', '#E35200'],
    iconGradient: ['#FFA800', '#E35200', '#FFA800'],
    gradient: ['#FFA800', '#E35200']
  },
  {
    main: '#F9FDEC',
    icon: ['#577BFC', '#1608BD'],
    iconGradient: ['#577BFC', '#1608BD', '#577BFC'],
    gradient: ['#577BFC', '#1608BD']
  },
  {
    main: '#FFFAEC',
    icon: ['#FAC94B', '#FF9B04'],
    iconGradient: ['#FAC94B', '#FF9B04', '#FAC94B'],
    gradient: ['#FAC94B', '#FF9B04']
  },
  {
    main: '#F6F1FF',
    icon: ['#AD14F5', '#6203AC'],
    iconGradient: ['#AD14F5', '#6203AC', '#AD14F5'],
    gradient: ['#AD14F5', '#6203AC']
  },
  {
    main: '#FFFAEC',
    icon: ['#68C82E', '#03640D'],
    iconGradient: ['#68C82E', '#03640D', '#68C82E'],
    gradient: ['#68C82E', '#03640D']
  },
  {
    main: '#F6F1FF',
    icon: ['#EC3F7D', '#FF0550'],
    iconGradient: ['#EC3F7D', '#FF0550', '#EC3F7D'],
    gradient: ['#EC3F7D', '#FF0550']
  }
];

export const getColors = (index: number) => {
  const colorAccessor = index % colourCodes.length;
  return colourCodes[colorAccessor];
};
