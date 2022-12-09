import hero from './eQuip-t_dashboard.svg';
import crm from './crm.svg';
import rom from './rom.svg';
import accounts from './accounts.svg';
import productSetup from './product_setup.svg';
import activities from './activities.svg';
import adminPortal from './admin_portal.svg';
import formIcon from './form_icon.svg';
import genIcon from './gen_icon.svg';
import invIcon from './inventoryManagement.svg';
import heroTextIcon from './heroTextIcon.svg';
import sidebarCogIcon from './sidebarCogIcon.svg';
import colabIcon from './colab.svg';
import setupsIcon from './setups.svg';

import salesManagement from './salesManagement.svg';
import rentalManagement from './rentalManagement.svg';
import ecommerceIcon from './ecommerce.svg';
import repairMaintenanceManagement from './repairMaintenanceManagement.svg';
import serviceManagement from './serviceManagement.svg';

import { FcViewDetails } from 'react-icons/fc';

export const IconConst = {
  HERO: 'Hero',
  CRM: 'CRM +',
  ROM: 'ROM',
  ACCOUNTS: 'Accounts',
  PRODUCT_SETUP: 'Product Setup',
  ACTIVITIES: 'Activities',
  ADMIN_PORTAL: 'Admin Portal',
  FORM_ICON: 'Dynamic Forms',
  INVENTORY_MANAGEMENT: 'Inventory Management',
  GEN_ICON: 'GenIcon',
  HERO_TEXT_ICON: 'HeroTextIcon',
  SIDEBAR_COG_ICON: 'SidebarCog',
  COLABORATION_TOOL: 'Collaboration Tools',
  SETUPS_ICON: 'Setups',
  SALES_MANAGEMENT: 'Sales Management',
  RENTAL_MANAGEMENT: 'Rental Management',
  ECOMMERCE: 'eCommerce',
  REPAIR_AND_MAINTENANCE_MANAGEMENT: 'Repair & Maintenance Management',
  SERVICE_MANAGEMENT: 'Service Management'
};

export const IMAGE_HEIGHT = 50;
export const IMAGE_WIDTH = 50;

export const SVGImages = (name) => {
  switch (name) {
    case IconConst.HERO:
      return hero;
      break;
    case IconConst.CRM:
      return crm;
      break;
    case IconConst.ROM:
      return rom;
      break;
    case IconConst.ACCOUNTS:
      return accounts;
      break;
    case IconConst.PRODUCT_SETUP:
      return productSetup;
      break;
    case IconConst.ACTIVITIES:
      return activities;
      break;
    case IconConst.ADMIN_PORTAL:
      return adminPortal;
      break;
    case IconConst.FORM_ICON:
      return formIcon;
      break;
    case IconConst.INVENTORY_MANAGEMENT:
      return invIcon;
      break;
    case IconConst.GEN_ICON:
      return genIcon;
      break;
    case IconConst.HERO_TEXT_ICON:
      return heroTextIcon;
      break;
    case IconConst.SIDEBAR_COG_ICON:
      return sidebarCogIcon;
      break;
    case IconConst.COLABORATION_TOOL:
      return colabIcon;
      break;
    case IconConst.SETUPS_ICON:
      return setupsIcon;
      break;
    case IconConst.SALES_MANAGEMENT:
      return salesManagement;
      break;
    case IconConst.RENTAL_MANAGEMENT:
      return rentalManagement;
      break;
    case IconConst.ECOMMERCE:
      return ecommerceIcon;
      break;
    case IconConst.REPAIR_AND_MAINTENANCE_MANAGEMENT:
      return repairMaintenanceManagement;
      break;
    case IconConst.SERVICE_MANAGEMENT:
      return serviceManagement;
      break;
    default:
      return crm;
  }
};
