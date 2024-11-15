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
import salesManagement from './salesManagement.svg';
import rentalManagement from './rentalManagement.svg';
import ecommerceIcon from './ecommerce.svg';
import repairMaintenanceManagement from './repairMaintenanceManagement.svg';
import serviceManagement from './serviceManagement.svg';

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
    case IconConst.CRM:
      return crm;
    case IconConst.ROM:
      return rom;
    case IconConst.ACCOUNTS:
      return accounts;
    case IconConst.PRODUCT_SETUP:
      return productSetup;
    case IconConst.ACTIVITIES:
      return activities;
    case IconConst.ADMIN_PORTAL:
      return adminPortal;
    case IconConst.FORM_ICON:
      return formIcon;
    case IconConst.INVENTORY_MANAGEMENT:
      return invIcon;
    case IconConst.GEN_ICON:
      return genIcon;
    case IconConst.HERO_TEXT_ICON:
      return heroTextIcon;
    case IconConst.SIDEBAR_COG_ICON:
      return sidebarCogIcon;

    case IconConst.SALES_MANAGEMENT:
      return salesManagement;
    case IconConst.RENTAL_MANAGEMENT:
      return rentalManagement;
    case IconConst.ECOMMERCE:
      return ecommerceIcon;
    case IconConst.REPAIR_AND_MAINTENANCE_MANAGEMENT:
      return repairMaintenanceManagement;
    case IconConst.SERVICE_MANAGEMENT:
      return serviceManagement;

    default:
      return crm;
  }
};
