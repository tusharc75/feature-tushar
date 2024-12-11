import * as lucid from 'react-icons/lu';
import * as boxIcon from 'react-icons/bi';
import * as circumicons from 'react-icons/ci';
import * as radix from 'react-icons/rx';
import { IconBaseProps } from 'react-icons';
import React from 'react';
import { setDataBySectionName } from 'src/pages/Home/helpers';

const LucidIconList = Object.keys(lucid);
const BoxIconList = Object.keys(boxIcon);
const CircumiconsList = Object.keys(circumicons);
const RadixIconList = Object.keys(radix);

export const defaultIcons = [
  'CRM +',
  'Sales Management',
  'Production Order Management',
  'eCommerce',
  'eCommerce Operations Management',
  'Inventory Management',
  'Rental Operations Management',
  'Rental Jobs Management',
  'ROM',
  'Field Service Operations',
  'Repair & Maintenance Management',
  'Admin Portal',
  'Accounts',
  'Product Setup',
  'Dynamic Forms',
  'Service Operations Management',
  'Field Service Management',
  'Purchasing Management',
  'Planning & Forecasting',
  'Forecasting & Planning',
  'Brand Admin',
  'Master Data',
  'Rental Management',
  'Service Management',
  'Setup & Administration',
  'Activities',
  'Collaboration Tools',
  'Fleet Management',
  'iot',
  'hiii',
  'Custom Forms',
  'Forecasting & Planning'
];

export const AllSidebarIconList = defaultIcons.concat(LucidIconList, BoxIconList, CircumiconsList, RadixIconList);

export const DynamicIcon = (iconName: string | undefined | null, props?: IconBaseProps) => {
  if (!iconName || iconName === '') return null;

  if (defaultIcons.includes(iconName)) {
    return setDataBySectionName(iconName, 0, props?.className).sideBarIcon;
  }
  if (iconName.startsWith('Lu')) {
    if (lucid[iconName] === undefined) return null;
    return React.createElement(lucid[iconName], props);
  }
  if (iconName.startsWith('Bi')) {
    if (boxIcon[iconName] === undefined) return null;
    return React.createElement(boxIcon[iconName], props);
  }
  if (iconName.startsWith('Ci')) {
    if (circumicons[iconName] === undefined) return null;
    return React.createElement(circumicons[iconName], props);
  }
  if (iconName.startsWith('Rx')) {
    if (radix[iconName] === undefined) return null;
    return React.createElement(radix[iconName], props);
  }
  return null;
};
