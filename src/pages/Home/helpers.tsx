import { AiFillAccountBook } from 'react-icons/ai';
import { SVGImages, IMAGE_WIDTH, IMAGE_HEIGHT, IconConst } from '../../assets/dashboard_images';
import DashboardIcons from 'src/assets/dashboard_images/icons';

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
const setDataBySectionName = (secName, index) => {
  const colorAccessor = index % colourCodes.length;
  const iconColour = colourCodes[colorAccessor]?.icon || ['#FFA800', '#E35200'];
  let icon = <DashboardIcons.INVENTORY_MANAGEMENT colors={iconColour} />;
  let text = '';
  // let color = colourCodes[index]?.main || '#FFF7F2'
  let color = '#FFFFFF';

  if (['CRM +', 'Sales Management'].includes(secName)) {
    text = 'Convert leads and close sales deals faster.';
    icon = <DashboardIcons.CRM colors={iconColour} />;
  } else if (['eCommerce'].includes(secName)) {
    text = 'Simplified eCommerce functionalities to smoothen your lives.';
    icon = <DashboardIcons.ECOMMERCE colors={iconColour} />;
  } else if (['Inventory Management'].includes(secName)) {
    text = 'Manage Inventory and Purchases Smartly.';
    icon = <DashboardIcons.INVENTORY_MANAGEMENT colors={iconColour} />;
  } else if (['Rental Operations Management', 'ROM'].includes(secName)) {
    text = 'Fulfill Rental Orders Faster.';
    icon = <DashboardIcons.ROM colors={iconColour} />;
  } else if (['Field Service Operations'].includes(secName)) {
    text = 'Fulfill Service Orders Faster.';
    icon = <DashboardIcons.ACCOUNTS colors={iconColour} />;
  } else if (['Repair and Maintenance Management'].includes(secName)) {
    text = 'Repair and Maintain your product and services at ease.';
    icon = <DashboardIcons.REPAIR_AND_MAINTENANCE_MANAGEMENT colors={iconColour} />;
  } else if (['Admin Portal'].includes(secName)) {
    text = 'Build your own Template, Manage Roles and Entities.';
    icon = <DashboardIcons.ADMIN_PORTAL colors={iconColour} />;
  } else if (['Accounts'].includes(secName)) {
    text = 'Customer and Supplier Account Management at your fingertips.';
    icon = <DashboardIcons.ACCOUNTS colors={iconColour} />;
  } else if (['Product Setup'].includes(secName)) {
    text = 'Product and Category Setup.';
    icon = <DashboardIcons.PRODUCT_SETUP colors={iconColour} />;
  } else if (['Dynamic Forms'].includes(secName)) {
    text = 'Setup Dynamic Forms & Templates';
    icon = <DashboardIcons.FORM_ICON colors={iconColour} />;
  } else if (['Service Operations Management'].includes(secName)) {
    icon = <DashboardIcons.SERVICE_OPERATION_MANAGEMENT colors={iconColour} />;
  } else if (['Purchasing Management'].includes(secName)) {
    icon = <DashboardIcons.PURCHASING_MANAGEMENT colors={iconColour} />;
  } else if (['Planning & Forecasting'].includes(secName)) {
    icon = <DashboardIcons.PLANNING_FORECASTING colors={iconColour} />;
  }

  return {
    icon: icon,
    text: text,
    color: color
  };
};

const colourCodes = [
  {
    main: '#FFEFEE',
    icon: ['#FC5757', '#C60707']
  },
  {
    main: '#F3F8FF',
    icon: ['#68C82E', '#03640D']
  },
  {
    main: '#FFF7F2',
    icon: ['#FFA800', '#E35200']
  },
  {
    main: '#F9FDEC',
    icon: ['#577BFC', '#1608BD']
  },
  {
    main: '#FFFAEC',
    icon: ['#FAC94B', '#FF9B04']
  },
  {
    main: '#F6F1FF',
    icon: ['#AD14F5', '#6203AC']
  },
  {
    main: '#FFFAEC',
    icon: ['#68C82E', '#03640D']
  },
  {
    main: '#F6F1FF',
    icon: ['#EC3F7D', '#FF0550']
  }
];
