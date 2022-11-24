import hero from './eQuip-t_dashboard.svg';
import crm from './crm.svg';
import rom from './rom.svg';
import accounts from './accounts.svg';
import productSetup from './product_setup.svg';
import activities from './activities.svg';
import adminPortal from './admin_portal.svg';
import formIcon from './form_icon.svg';
import genIcon from './gen_icon.svg';
import invIcon from './inv_icon.svg';
import heroTextIcon from './heroTextIcon.svg';
import sidebarCogIcon from './sidebarCogIcon.svg';
import colabIcon from './colab.svg';
import { FcViewDetails } from 'react-icons/fc';

export const IconConst = {
  HERO: 'Hero',
  CRM: 'ROM',
  ROM: 'CRM',
  ACCOUNTS: 'Accounts',
  PRODUCT_SETUP: 'PorductSetup',
  ACTIVITIES: 'Activities',
  ADMIN_PORTAL: 'adminPortal',
  FORM_ICON: 'FormIcon',
  INV_ICON: 'InvIcon',
  GEN_ICON: 'GenIcon',
  HERO_TEXT_ICON: 'HeroTextIcon',
  SIDEBAR_COG_ICON: 'SidebarCog',
  COLABORATION_TOOL: 'Colab'
};

export const IMAGE_HEIGHT = 56;
export const IMAGE_WIDTH = 56;

export const SVG = (name) => {
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
    case IconConst.INV_ICON:
      return invIcon;
    case IconConst.GEN_ICON:
      return genIcon;
    case IconConst.HERO_TEXT_ICON:
      return heroTextIcon;
    case IconConst.SIDEBAR_COG_ICON:
      return sidebarCogIcon;
    case IconConst.COLABORATION_TOOL:
      return colabIcon;
    default:
      return;
  }
};
