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
  ReceivingTicket,
  ManualEntry,
  Process,
  AssetIcon,
  SendToCustomerIcon,
  EndIcon,
  QuoteBuilderIcon,
  PriceBuilderIcon,
  ProductBuilderIcon,
  NegoTiatingIcon,
  ProposalIcon,
  ProspectingIcon,
  UnqualifiedIcon,
  QualifiedIcon,
  ClosedIcon
} from './svgIcon';
import StepCompleteIcon from './StepCompleteIcon';
export type StepIconType =
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
  | 'receivingTicket'
  | 'manualEntry'
  | 'process'
  | 'asset'
  | 'sendToCustomer'
  | 'endIcon'
  | 'quoteBuilder'
  | 'priceBuilder'
  | 'productBuilder'
  | 'negotiating'
  | 'proposal'
  | 'prospecting'
  | 'unqualified'
  | 'qualified'
  | 'closed';

export interface stepIconInterface {
  icon: StepIconType;
}

export const getIcon = (name: string) => {
  switch (true) {
    case name === 'add':
      return Add;
    case name === 'assign':
      return Assign;
    case name === 'dispatch':
      return Dispatch;
    case name === 'invoice':
      return Invoice;
    case name === 'postWork':
      return PostWork;
    case name === 'quote':
      return Quote;
    case name === 'repairOrder':
      return RepairOrder;
    case name === 'serializedAssets':
      return SerializedAsset;
    case name === 'workOrder':
      return WorkOrder;
    case name === 'ticket':
      return Ticket;
    case name === 'receiveProduct':
      return ReceiveProduct;
    case name === 'consumable':
      return Consumable;
    case name === 'doa':
      return DOA;
    case name === 'approval':
      return Approval;
    case name === 'end':
      return End;
    case name === 'startSublease':
      return StartSublease;
    case name === 'receivingTicket':
      return ReceivingTicket;
    case name === 'manualEntry':
      return ManualEntry;
    case name === 'process':
      return Process;
    case name === 'asset':
      return AssetIcon;
    case name === 'sendToCustomer':
      return SendToCustomerIcon;
    case name === 'endIcon':
      return EndIcon;
    case name === 'quoteBuilder':
      return QuoteBuilderIcon;
    case name === 'priceBuilder':
      return PriceBuilderIcon;
    case name === 'productBuilder':
      return ProductBuilderIcon;
    case name === 'negotiating':
      return NegoTiatingIcon;
    case name === 'proposal':
      return ProposalIcon;
    case name === 'prospecting':
      return ProspectingIcon;
    case name === 'unqualified':
      return UnqualifiedIcon;
    case name === 'qualified':
      return QualifiedIcon;
    case name === 'closed':
      return ClosedIcon;
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
