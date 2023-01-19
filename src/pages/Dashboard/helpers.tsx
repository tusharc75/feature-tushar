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
  for (const [key, values] of Object.entries(groupedData)) {
    if (key !== '') {
      let obj: any = { ...setDataBySectionName(key) };
      obj.head = key;
      obj.items = values;
      dataList.push(obj);
    }
  }
  return dataList;
};

// CHECK SECTION NAME AND RETURN ICON, COLOR, AND DESCRIPTION
const setDataBySectionName = (secName) => {
  let icon = <img src={SVGImages(secName)} alt="Form Logo" width={IMAGE_WIDTH} height={IMAGE_HEIGHT} />;
  // let icon = <DashboardIcons[secName]/>
  let text = '';
  let color = colorPalette[secName] || '#FFEFEE';
  const iconColors = getIconColor(color);

  switch (secName) {
    case 'Product Setup':
      text = 'Product and Category Setup.';
      icon = <DashboardIcons.PRODUCT_SETUP colors={iconColors} />;
      break;
    case 'Admin Portal':
      text = 'Build your own Template, Manage Roles and Entities.';
      icon = <DashboardIcons.ADMIN_PORTAL colors={iconColors} />;
      break;
    case 'CRM +':
      text = 'Convert leads and close sales deals faster.';
      icon = <DashboardIcons.CRM colors={iconColors} />;
      break;
    case 'ROM':
      text = 'Fulfill Rental Orders Faster.';
      icon = <DashboardIcons.ROM colors={iconColors} />;
      break;
    case 'Accounts':
      text = 'Customer and Supplier Account Management at your fingertips.';
      icon = <DashboardIcons.ACCOUNTS colors={iconColors} />;
      break;
    case 'Activities':
      text = 'Assign and Access Activities related to an Order.';
      icon = <DashboardIcons.ACTIVITIES colors={iconColors} />;
      break;
    case 'Dynamic Forms':
      text = 'Setup Dynamic Forms & Templates';
      icon = <DashboardIcons.FORM_ICON colors={iconColors} />;
      break;
    case 'Inventory Management':
      text = 'Manage Inventory and Purchases Smartly.';
      icon = <DashboardIcons.INVENTORY_MANAGEMENT colors={iconColors} />;
      break;

    case 'Sales Management':
      text = 'Convert leads and close sales deals faster.';
      icon = <DashboardIcons.SALES_MANAGEMENT colors={iconColors} />;
      break;
    case 'Rental Management':
      text = 'Fulfill Rental Orders Faster.';
      icon = <DashboardIcons.RENTAL_MANAGEMENT colors={iconColors} />;
      break;
    case 'eCommerce':
      text = 'Simplified eCommerce functionalities to smoothen your lives.';
      icon = <DashboardIcons.ECOMMERCE colors={iconColors} />;
      break;
    case 'Repair & Maintenance Management':
      text = 'Repair and Maintain your product and services at ease.';
      icon = <DashboardIcons.REPAIR_AND_MAINTENANCE_MANAGEMENT colors={iconColors} />;
      break;
    case 'Service Management':
      text = 'Fulfill Service Orders Faster.';
      break;
    default:
      text = '';
  }
  return {
    icon: icon,
    text: text,
    color: color
  };
};

// SET ICON COLORS BY CARD BACKGROUND COLOR
const getIconColor = (mainColor: string) => {
  let colors = ['#FC5757', '#C60707'];
  switch (mainColor) {
    case '#FFEFEE':
      colors = ['#FC5757', '#C60707'];
      break;
    case '#F3F8FF':
      colors = ['#577BFC', '#1608BD'];
      break;
    case '#FFF7F2':
      colors = ['#FFA800', '#E35200'];
      break;
    case '#F9FDEC':
      colors = ['#3BE961', '#058D12'];
      break;
    case '#FFFAEC':
      colors = ['#FAC94B', '#FF9B04'];
      break;
    case '#F6F1FF':
      colors = ['#AD14F5', '#6203AC'];
      break;
    default:
      break;
  }
  return colors;
};

// COLOR PALATTE BY SECTION NAME
const colorPalette = {
  'Product Setup': '#FFEFEE',
  'Admin Portal': '#F3F8FF',
  'CRM +': '#FFF7F2',
  ROM: '#F9FDEC',
  Accounts: '#FFFAEC',
  Activities: '#F6F1FF',
  'Dynamic Forms': '#FFEFEE',
  'Inventory Management': '#FFF7F2',
  'Sales Management': '#FFEFEE',
  'Rental Management': '#F3F8FF',
  eCommerce: '#F9FDEC',
  'Repair & Maintenance Management': '#FFFAEC',
  'Service Management': '#F6F1FF'
};
