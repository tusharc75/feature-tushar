import DashboardIcons from 'src/assets/dashboard_images/icons';
import {
  CollaborationToolsIcon,
  CustomForms,
  FieldServiceOperationIcon,
  FleetManagementIcon,
  ForeCastingAndPlanning,
  IOT,
  ProductSetup,
  PurchasingManagementIcon,
  RentalOperationManagementIcon,
  ServiceManagementIcon,
  ServiceOperationManagementIcon
} from 'src/assets/sidebar_assets/icons';

import { AiOutlineDatabase } from 'react-icons/ai';
import { BiCart, BiCog } from 'react-icons/bi';
import { FaRegRegistered, FaRegUser, FaRegUserCircle } from 'react-icons/fa';
import { HiOutlineWrenchScrewdriver } from 'react-icons/hi2';
import { MdOutlineDynamicForm, MdOutlineEventAvailable } from 'react-icons/md';
import { RiShieldUserLine } from 'react-icons/ri';
import { SiCivicrm } from 'react-icons/si';
import { DynamicIcon } from 'src/assets/IconGenerator';

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
export const assignIconAndText = (groupedData, brandSectionMaster) => {
  let dataList = [];
  let index = 0;
  for (const [key, values] of Object.entries(groupedData)) {
    if (key !== '') {
      let obj: any = { ...setDataBySectionName(key, index) };
      const section = brandSectionMaster?.find((e) => e?.sectionName === key);
      if (section && section.description !== '') {
        obj.text = section.description;
      }
      if (section?.iconName !== undefined && section.iconName) {
        obj.icon = section.iconName;
        obj.sideBarIcon = DynamicIcon(section.iconName);
      }
      obj.head = key;
      obj.items = values;
      dataList.push(obj);
      index++;
    }
  }
  return dataList;
};

// CHECK SECTION NAME AND RETURN ICON, COLOR, AND DESCRIPTION
export const setDataBySectionName = (secName, index = 0, className = '') => {
  const colorAccessor = getColors(index);
  const iconColour = colorAccessor.icon || ['#FFA800', '#E35200'];

  const compareName = (nameList: string[], name) => {
    const namelistInSmallLetter = nameList.map((n) => n.trim().toLowerCase());
    const lowercaseName = name.toLowerCase().trim();

    return namelistInSmallLetter.includes(lowercaseName);
  };

  let icon = <DashboardIcons.INVENTORY_MANAGEMENT colors={iconColour} />;
  let text = '';
  let sideBarIcon = <ServiceManagementIcon size={20} className={className} />;
  const color = '#ffffff';
  const gradient = colorAccessor.gradient || ['#FFA800', '#E35200'];

  switch (true) {
    case compareName(['CRM +', 'Sales Management'], secName): {
      text = 'Create Leads, Convert Opportunities and Manage Contracts Effectively';
      icon = <DashboardIcons.CRM colors={iconColour} />;
      sideBarIcon = <SiCivicrm size={18} className={className} />;
      break;
    }
    case compareName(['Production Order Management'], secName): {
      text = 'Speed-up shop floor operations and manage technicians and parts issued effectively';
      icon = <DashboardIcons.INVENTORY_MANAGEMENT colors={iconColour} />;
      sideBarIcon = <ServiceManagementIcon size={20} className={className} />;
      break;
    }
    case compareName(['eCommerce', 'eCommerce Operations Management'], secName): {
      text = 'Simplify your Customer Journey and Reduce Execution Time significantly';
      icon = <DashboardIcons.ECOMMERCE colors={iconColour} />;
      sideBarIcon = <BiCart size={20} className={className} />;
      break;
    }
    case compareName(['Inventory Management'], secName): {
      text = 'Manage Inventory Smartly';
      icon = <DashboardIcons.INVENTORY_MANAGEMENT colors={iconColour} />;
      sideBarIcon = <ServiceManagementIcon size={20} className={className} />;
      break;
    }
    case compareName(['Rental Operations Management', 'Rental Jobs Management'], secName): {
      text = 'Fulfill Rental Orders Faster';
      icon = <DashboardIcons.ROM colors={iconColour} />;
      sideBarIcon = <RentalOperationManagementIcon size={20} className={className} />;
      break;
    }
    case compareName(['ROM'], secName): {
      text = 'Fulfill Rental Orders Faster';
      icon = <DashboardIcons.ROM colors={iconColour} />;
      sideBarIcon = <FaRegRegistered size={20} className={className} />;
      break;
    }
    case compareName(['Field Service Operations'], secName): {
      text = 'Fulfill Service Orders Faster';
      icon = <DashboardIcons.FIELD_SERVICE_OPERATION colors={iconColour} />;
      sideBarIcon = <FieldServiceOperationIcon size={20} className={className} />;
      break;
    }
    case compareName(['Repair & Maintenance Management'], secName): {
      text = 'Repair & Maintain your product and services at ease';
      icon = <DashboardIcons.REPAIR_AND_MAINTENANCE_MANAGEMENT colors={iconColour} />;
      sideBarIcon = <HiOutlineWrenchScrewdriver size={18} className={className} />;
      break;
    }
    case compareName(['Admin Portal'], secName): {
      text = 'Build your own Template, Manage Roles and Entities';
      icon = <DashboardIcons.ADMIN_PORTAL colors={iconColour} />;
      sideBarIcon = <RiShieldUserLine size={20} className={className} />;
      break;
    }
    case compareName(['Accounts'], secName): {
      text = 'Customer and Supplier Account Management at your fingertips';
      icon = <DashboardIcons.ACCOUNTS colors={iconColour} />;
      sideBarIcon = <FaRegUser size={20} className={className} />;
      break;
    }
    case compareName(['Product Setup'], secName): {
      text = 'Product and Category Setup';
      icon = <DashboardIcons.PRODUCT_SETUP colors={iconColour} />;
      sideBarIcon = <ProductSetup size={20} className={className} />;
      break;
    }
    case compareName(['Dynamic Forms'], secName): {
      text = 'Setup Dynamic Forms & Templates';
      icon = <DashboardIcons.FORM_ICON colors={iconColour} />;
      sideBarIcon = <MdOutlineDynamicForm size={20} className={className} />;
      break;
    }
    case compareName(['Service Operations Management', 'Field Service Management'], secName): {
      text = 'Deploy, Track and Bill for field services efficiently';
      icon = <DashboardIcons.SERVICE_OPERATION_MANAGEMENT colors={iconColour} />;
      sideBarIcon = <ServiceOperationManagementIcon size={20} className={className} />;
      break;
    }
    case compareName(['Purchasing Management'], secName): {
      text = 'Manage working capital effectively';
      icon = <DashboardIcons.PURCHASING_MANAGEMENT colors={iconColour} />;
      sideBarIcon = <PurchasingManagementIcon size={20} className={className} />;
      break;
    }
    case compareName(['Planning & Forecasting', 'Forecasting & Planning'], secName): {
      text = 'Plan and Schedule your workforce productively';
      icon = <DashboardIcons.PLANNING_FORECASTING colors={iconColour} />;
      sideBarIcon = <MdOutlineEventAvailable size={20} className={className} />;
      break;
    }
    case compareName(['Brand Admin'], secName): {
      sideBarIcon = <FaRegUserCircle size={20} className={className} />;
      break;
    }
    case compareName(['Master Data'], secName): {
      sideBarIcon = <AiOutlineDatabase size={20} className={className} />;
      break;
    }
    case compareName(['Rental Management'], secName): {
      sideBarIcon = <FaRegRegistered size={20} className={className} />;
      break;
    }
    case compareName(['Service Management'], secName): {
      sideBarIcon = <ServiceManagementIcon size={18} className={className} />;
      break;
    }
    case compareName(['Setups & Administration'], secName): {
      sideBarIcon = <BiCog size={20} className={className} />;
      break;
    }
    case compareName(['Activities', 'Collaboration Tools', 'Workspace'], secName): {
      sideBarIcon = <CollaborationToolsIcon size={20} className={className} />;
      break;
    }
    case compareName(['Fleet Management'], secName): {
      sideBarIcon = <FleetManagementIcon size={20} className={className} />;
      icon = <DashboardIcons.FLEET_MANAGEMENT colors={iconColour} />;
      text = 'Optimize and Deploy your Asset Fleet simply';
      break;
    }
    case compareName(['iot'], secName): {
      sideBarIcon = <IOT size={20} className={className} />;
      icon = <DashboardIcons.IOT colors={iconColour} />;
      break;
    }
    case compareName(['hiii', 'Custom Forms'], secName): {
      sideBarIcon = <CustomForms size={18} className={className} />;
      icon = <DashboardIcons.CUSTOM_FORMS colors={iconColour} />;
      break;
    }
    case compareName(['Forecasting & Planning'], secName): {
      sideBarIcon = <ForeCastingAndPlanning size={18} className={className} />;
      icon = <DashboardIcons.FORECASTING_AND_PLANNING colors={iconColour} />;
      break;
    }
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
