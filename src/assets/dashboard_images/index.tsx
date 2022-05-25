import hero from './eQuip-t_dashboard.svg';
import crm from './crm.svg';
import rom from './rom.svg';
import accounts from './accounts.svg';
import productSetup from './product_setup.svg';
import activities from './activities.svg';
import adminPortal from './admin_portal.svg';
import { FcViewDetails } from 'react-icons/fc';

import { HERO, CRM, ROM, ACCOUNTS, PRODUCT_SETUP, ACTIVITIES, ADMIN_PORTAL } from './constants/imageTypes';

export const IMAGE_HEIGHT = 56;
export const IMAGE_WIDTH = 56;

export const SVG = (name) => {
  switch (name) {
    case HERO:
      return hero;
    case CRM:
      return crm;
    case ROM:
      return rom;
    case ACCOUNTS:
      return accounts;
    case PRODUCT_SETUP:
      return productSetup;
    case ACTIVITIES:
      return activities;
    case ADMIN_PORTAL:
      return adminPortal;
    default:
      return;
  }
};
