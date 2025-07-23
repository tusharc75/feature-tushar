import { MATERIAL_TYPE, sidebarResource } from 'src/constants/helpers';

export const resourcePolicy = [
  {
    resource: sidebarResource.repairOrder,
    policy: [
      {
        fieldName: 'hideAddExistingServices',
        fieldLabel: 'Hide Add Existing Services',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'hideAddNewService',
        fieldLabel: 'Hide Add New Service',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'hideAssignTechnician',
        fieldLabel: 'Hide Assign Technician',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'hideAssignWorkstation',
        fieldLabel: 'Hide Assign Work Station',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'hideAddConsumables',
        fieldLabel: 'Hide Add Consumables',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'hideArrangeServices',
        fieldLabel: 'Hide Arrange Services',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'hideAutoCompleteWorkOrder',
        fieldLabel: 'Hide Auto Complete Work Order',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'hideCompleteSkipRevertService',
        fieldLabel: 'Hide Complete/Skip/Revert Service',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'showTransferAssets',
        fieldLabel: 'Show Transfer Assets',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'onlyConsumedConsumablesAddInCost',
        fieldLabel: 'Only Consumed Consumables Add In Cost',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'disableServiceAndConsumablesBreakdownInCost',
        fieldLabel: 'Disable Service & Consumables Breakdown In Cost',
        type: 'checkBox',
        defaultValue: false
      },
    ]
  },
  {
    resource: sidebarResource.fieldTicket,
    policy: [
      {
        fieldName: 'showRentalAddMaterial',
        fieldLabel: 'Show Rental Add Material',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'showQuotationAddMaterial',
        fieldLabel: 'Show Quotation Add Material',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'showFieldServiceOrderAddMaterial',
        fieldLabel: 'Show Field Service Order Add Material',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'showAddPackages',
        fieldLabel: 'Show Add Packages',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'hideInventoryConsume',
        fieldLabel: 'Hide Inventory Consume',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'packageMaterialAdd',
        fieldLabel: 'Package Material Add',
        type: 'multiSelect',
        option: [
          { optionValue: MATERIAL_TYPE.package, optionLabel: 'Package', order: 0 },
          { optionValue: MATERIAL_TYPE.product, optionLabel: 'Product', order: 1 },
          { optionValue: MATERIAL_TYPE.service, optionLabel: 'Service', order: 2 }
        ],
        defaultValue: []
      }
    ]
  },
  {
    resource: sidebarResource.serializedAsset,
    policy: [
      {
        fieldName: 'statusChangeFields',
        fieldLabel: 'Status Change Fields',
        type: 'multipleFields',
        fields: [
          {
            fieldName: 'status',
            fieldLabel: 'Status',
            type: 'dropDown',
            required: true
          },
          {
            fieldName: 'fields',
            fieldLabel: 'Fields',
            type: 'multiSelect',
            required: true
          },
          {
            fieldName: 'fieldsReset',
            fieldLabel: 'Fields Reset',
            type: 'multiSelect',
            required: false
          },
          {
            fieldName: 'products',
            fieldLabel: 'Products',
            type: 'multiSelect',
            lookupResource: sidebarResource.product,
            required: false
          },
          {
            fieldName: 'sumDecimalField',
            fieldLabel: 'Sum(Decimal Field)',
            type: 'checkBox',
            defaultValue: false,
            required: false
          },
          {
            fieldName: 'autoIncrementDecimalField',
            fieldLabel: 'Auto Increment(Decimal Field)',
            type: 'checkBox',
            defaultValue: false,
            required: false
          }
        ],
        defaultValue: []
      },
      {
        fieldName: 'dataChangeStatus',
        fieldLabel: 'Data Change Status',
        type: 'dropDown',
        fieldOption: 'status',
        required: false
      },
      {
        fieldName: 'dataChangeAssetLogFields',
        fieldLabel: 'Data Change Asset Log Fields',
        type: 'multiSelect',
        defaultValue: [],
        required: false
      },
      {
        fieldName: 'statusColor',
        fieldLabel: 'Status/Sub Status Color',
        type: 'multipleFields',
        fields: [
          {
            fieldName: 'status',
            fieldLabel: 'Status/Sub Status',
            type: 'multiSelect',
            required: true
          },
          {
            fieldName: 'colorCode',
            fieldLabel: 'Color Code',
            type: 'colorPicker',
            required: true
          }
        ],
        defaultValue: []
      },
      {
        fieldName: 'inUseSubStatus',
        fieldLabel: 'In-Use Sub Status',
        type: 'multiSelect',
        defaultValue: [],
        fieldOption: 'subStatus',
        required: false
      },
      {
        fieldName: 'statusChangeOnSubStatusRental',
        fieldLabel: 'Status Change On Sub Status Rental Receiving/Return',
        type: 'multipleFields',
        fields: [
          {
            fieldName: 'subStatus',
            fieldLabel: 'Sub Status',
            type: 'dropDown',
            required: true
          },
          {
            fieldName: 'status',
            fieldLabel: 'Status',
            type: 'dropDown',
            required: true
          }
        ],
        defaultValue: []
      },
    ]
  },
  {
    resource: sidebarResource.workOrder,
    policy: [
      {
        fieldName: 'showBom',
        fieldLabel: 'Show BOM',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'consumablesSerialNumberRequired',
        fieldLabel: 'Consumables Serial Number Required',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'enableServicesOnConsumables',
        fieldLabel: 'Enable Services On Consumables',
        type: 'checkBox',
        defaultValue: false
      }
    ]
  },
  {
    resource: sidebarResource.rentalManagement,
    policy: [
      {
        fieldName: 'showServiceOnFieldStep',
        fieldLabel: 'Show Service On-Field Step',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'hideAssetChangeStatus',
        fieldLabel: 'Hide Asset Change Status',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'customerAccountWisePackages',
        fieldLabel: 'Customer Account Wise Packages',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'hidePackageInInvoice',
        fieldLabel: 'Hide Package In Invoice',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'servicePriceRequired',
        fieldLabel: 'Service Price Required',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'nonSerializedProductReceivingTicket',
        fieldLabel: 'Non Serialized Product Receiving Ticket',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'showFieldJobs',
        fieldLabel: 'Show Field Jobs',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'showFieldTickets',
        fieldLabel: 'Show Field Tickets',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'allowOnFieldUpdateFieldJobTicket',
        fieldLabel: 'Allow On Field Update In Field Job/Ticket',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'subStatusDateWiseCapture',
        fieldLabel: 'Sub Status Date Wise Capture',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'loadingReceivingDefaultView',
        fieldLabel: 'Loading Receiving Default View',
        type: 'dropDown',
        option: [
          { optionValue: 'flat', optionLabel: 'Flat', order: 0 },
          { optionValue: 'parentChild', optionLabel: 'Parent Child', order: 1 }
        ],
        defaultValue: ''
      }
    ]
  },
  {
    resource: sidebarResource.invoice,
    policy: [
      {
        fieldName: 'rentalInvoiceFields',
        fieldLabel: 'Rental Invoice Fields',
        type: 'multiSelect',
        defaultValue: []
      },
      {
        fieldName: 'rentalInvoiceStatus',
        fieldLabel: 'Rental Invoice Status',
        type: 'dropDown',
        fieldOption: 'status'
      },
      {
        fieldName: 'fieldTicketInvoiceFields',
        fieldLabel: 'Field Ticket Invoice Fields',
        type: 'multiSelect',
        defaultValue: []
      },
      {
        fieldName: 'hideFieldTicketInvoiceCreateDialog',
        fieldLabel: 'Hide Field Ticket Invoice Create Dialog',
        type: 'checkBox',
        defaultValue: false
      }
    ]
  },
  {
    resource: sidebarResource.opportunity,
    policy: [
      {
        fieldName: 'outcomeFields',
        fieldLabel: 'Outcome Fields',
        type: 'multiSelect',
        defaultValue: []
      }
    ]
  },
  {
    resource: sidebarResource.address,
    policy: [
      {
        fieldName: 'countyFromTaxMaster',
        fieldLabel: 'County From Tax Master',
        type: 'checkBox',
        defaultValue: false
      }
    ]
  },
  {
    resource: sidebarResource.fieldServiceOrder,
    policy: [
      {
        fieldName: 'addServices',
        fieldLabel: 'Add Services',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'addTechnicians',
        fieldLabel: 'Add Technicians',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'addConsumables',
        fieldLabel: 'Add Consumables',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'showAddPackages',
        fieldLabel: 'Show Add Packages',
        type: 'checkBox',
        defaultValue: false
      }
    ]
  },
  {
    resource: sidebarResource.expenses,
    policy: [
      {
        fieldName: 'distanceUnit',
        fieldLabel: 'Distance Unit',
        type: 'dropDown',
        option: [
          { optionValue: 'km', optionLabel: 'km', order: 0 },
          { optionValue: 'mile', optionLabel: 'mile', order: 1 }
        ],
        defaultValue: ''
      },
      {
        fieldName: 'perUnitRate',
        fieldLabel: 'Per Unit Rate',
        type: 'number',
        defaultValue: ''
      }
    ]
  },
  {
    resource: sidebarResource.pricingCondition,
    policy: [
      {
        fieldName: 'hideMaterialAdd',
        fieldLabel: 'Hide Material Add',
        type: 'multiSelect',
        option: [
          { optionValue: MATERIAL_TYPE.product, optionLabel: 'Product', order: 0 },
          { optionValue: MATERIAL_TYPE.package, optionLabel: 'Package', order: 1 },
          { optionValue: MATERIAL_TYPE.service, optionLabel: 'Service', order: 2 },
          { optionValue: 'competency', optionLabel: 'Competency', order: 3 }
        ],
        defaultValue: []
      }
    ]
  },
  {
    resource: sidebarResource.serializedAssetsInspection,
    policy: [
      {
        fieldName: 'canCreateRepairOrder',
        fieldLabel: 'Can Create Repair Order',
        type: 'checkBox',
        defaultValue: false
      }
    ]
  },
  {
    resource: sidebarResource.workOrderTechnician,
    policy: [
      {
        fieldName: 'showWorkOrderPdfPreviewInTile',
        fieldLabel: 'Show Work Order Pdf Preview in Tile',
        type: 'checkBox',
        defaultValue: false
      }
    ]
  },
  {
    resource: sidebarResource.fieldServiceTechnician,
    policy: [
      {
        fieldName: 'showOnlyAssignedTickets',
        fieldLabel: 'Show only Assigned Tickets',
        type: 'checkBox',
        defaultValue: false
      }
    ]
  },
  {
    resource: sidebarResource.planningView,
    policy: [
      {
        fieldName: 'hideBackDatedPlanning',
        fieldLabel: 'Hide Back Dated Planning',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'hideAssetStatusForFutureDates',
        fieldLabel: 'Hide Asset Status For Future Dates',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'plannedAvailableCountFromCurrentDate',
        fieldLabel: 'Planned Available Count From Current Date',
        type: 'checkBox',
        defaultValue: false
      }
    ]
  },
  {
    resource: sidebarResource.salesOrder,
    policy: [
      {
        fieldName: 'restrictAutoDebitInventory',
        fieldLabel: 'Restrict Auto Debit Inventory',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'debitInventoryOnAveragePrice',
        fieldLabel: 'Debit Inventory On Average Price',
        type: 'checkBox',
        defaultValue: false
      }
    ]
  },
  {
    resource: sidebarResource.assemblyOrder,
    policy: [
      {
        fieldName: 'loadingTicket',
        fieldLabel: 'Loading Ticket',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'autoConvertInSameRentalJob',
        fieldLabel: 'Auto Convert In Same Rental Job',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'autoCreateFolderInDMS',
        fieldLabel: 'Auto Create Folder In DMS',
        type: 'checkBox',
        defaultValue: false
      }
    ]
  },
  {
    resource: sidebarResource.creditMemo,
    policy: [
      {
        fieldName: 'showNegativeSignInPdf',
        fieldLabel: 'Show Negative Sign in PDF',
        type: 'checkBox',
        defaultValue: false
      }
    ]
  },
];

export const DATE_VALUE = {
  currentDate: 'Current Date',
  custom: 'Custom'
}

export const RESOURCE_ACTION_TYPE = {
  actions: 'Actions',
  triggers: 'Triggers'
}