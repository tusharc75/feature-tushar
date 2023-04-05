import { LeftIcon } from './left';
import { RightIcon } from './right';

import { Add, Assign, Dispatch, Invoice, PostWork, Quote, RepairOrder, SerializedAsset, WorkOrder } from './svgIcon';
export interface stepIconInterface {
  icon: 'add' | 'assign' | 'dispatch' | 'invoice' | 'postWork' | 'quote' | 'repairOrder' | 'serializedAssets' | 'workOrder';
}

export const getIcon = (name: string) => {
  switch (true) {
    case name === 'add':
      return Add;
      break;
    case name === 'assign':
      return Assign;
      break;
    case name === 'dispatch':
      return Dispatch;
      break;
    case name === 'invoice':
      return Invoice;
      break;
    case name === 'postWork':
      return PostWork;
      break;
    case name === 'quote':
      return Quote;
      break;
    case name === 'repairOrder':
      return RepairOrder;
      break;
    case name === 'serializedAssets':
      return SerializedAsset;
      break;
    case name === 'workOrder':
      return WorkOrder;
      break;
    default:
      return SerializedAsset;
  }
};

export { LeftIcon, RightIcon };

export const stepColorPalette: [string, string][] = [
  ['#FAC94B', '#FF9B04'],
  ['#577BFC', '#1608BD'],
  ['#FC5757', '#C60707'],
  ['#3BE961', '#058D12'],
  ['#AD14F5', '#6203AC ']
];

export const getColorOficon = (index: number): [string, string] => {
  if (!index) return;
  const colorIndex = index % stepColorPalette.length;
  return stepColorPalette[colorIndex];
};
