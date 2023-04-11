import { LeftIcon } from './left';
import { RightIcon } from './right';

import {
  Add,
  Assign,
  Dispatch,
  Invoice,
  PostWork,
  Quote,
  RepairOrder,
  SerializedAsset,
  WorkOrder,
  Ticket,
  ReceiveProduct,
  Consumable,
  DOA,
  Approval,
  End,
  StartSublease,
  ReceivingTicket
} from './svgIcon';
import StepCompleteIcon from './StepCompleteIcon';
export interface stepIconInterface {
  icon:
    | 'add'
    | 'assign'
    | 'dispatch'
    | 'invoice'
    | 'postWork'
    | 'quote'
    | 'repairOrder'
    | 'serializedAssets'
    | 'workOrder'
    | 'ticket'
    | 'receiveProduct'
    | 'consumable'
    | 'doa'
    | 'approval'
    | 'end'
    | 'startSublease'
    | 'receivingTicket';
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
    case name === 'ticket':
      return Ticket;
      break;
    case name === 'receiveProduct':
      return ReceiveProduct;
      break;
    case name === 'consumable':
      return Consumable;
      break;
    case name === 'doa':
      return DOA;
      break;
    case name === 'approval':
      return Approval;
      break;
    case name === 'end':
      return End;
      break;
    case name === 'startSublease':
      return StartSublease;
      break;
    case name === 'receivingTicket':
      return ReceivingTicket;
      break;
    default:
      return SerializedAsset;
  }
};

export { LeftIcon, RightIcon, StepCompleteIcon };

export const stepColorPalette: [string, string][] = [
  ['#FAC94B', '#FF9B04'],
  ['#577BFC', '#1608BD'],
  ['#FC5757', '#C60707'],
  ['#3BE961', '#058D12'],
  ['#AD14F5', '#6203AC '],
  ['#3BE961', '#058D12']
];

export const getColorOficon = (index: number): [string, string] => {
  if (!index) return;
  const colorIndex = index % stepColorPalette.length;
  return stepColorPalette[colorIndex];
};
