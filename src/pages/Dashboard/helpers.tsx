import { AiFillAccountBook } from 'react-icons/ai';
import { SVGImages, IMAGE_WIDTH, IMAGE_HEIGHT, IconConst } from '../../assets/dashboard_images';

// CREATE OBJECT FROM LIST GROUPED BY KEYGETTER
export const groupByKey = (arr = [], keyGetter) => {
  let result = [];
  result = arr.reduce((r, a) => {
    r[keyGetter(a)] = r[keyGetter(a)] || [];
    r[keyGetter(a)].push(a);
    return r;
  }, Object.create(null));
  console.log(result);
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
  let text = '';
  let color = colorPalette[secName] || '#FFEFEE';

  switch (secName) {
    case 'Product Setup':
      text = 'Product and Category Setup.';
      break;
    case 'Admin Portal':
      text = 'Build your own Template, Manage Roles and Entities.';
      break;
    case 'CRM +':
      text = 'Convert leads and close sales deals faster.';
      break;
    case 'ROM':
      text = 'Fulfill Rental Orders Faster.';
      break;
    case 'Accounts':
      text = 'Customer and Supplier Account Management at your fingertips.';
      break;
    case 'Activities':
      text = 'Assign and Access Activities related to an Order.';
      break;
    case 'Dynamic Forms':
      text = 'Setup Dynamic Forms & Templates';
      break;
    case 'Inventory Management':
      text = 'Manage Inventory and Purchases Smartly.';
      break;

    case 'Sales Management':
      text = 'Convert leads and close sales deals faster.';
      break;
    case 'Rental Management':
      text = 'Fulfill Rental Orders Faster.';
      break;
    case 'eCommerce':
      text = 'Simplified eCommerce functionalities to smoothen your lives.';
      break;
    case 'Repair & Maintenance Management':
      text = 'Repair and Maintain your product and services at ease.';
      break;
    case 'Service Management':
      text = 'Build your own Template, Manage Roles and Entities.';
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
