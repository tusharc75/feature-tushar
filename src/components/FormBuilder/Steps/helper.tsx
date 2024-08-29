import { sidebarResource } from 'src/constants/helpers';

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
      }
    ]
  },
  {
    resource: sidebarResource.fieldTicket,
    policy: [
      {
        fieldName: 'showAddPackages',
        fieldLabel: 'Show Add Packages',
        type: 'checkBox',
        defaultValue: false
      },
      {
        fieldName: 'showRentalAddMaterial',
        fieldLabel: 'Show Rental Add Material',
        type: 'checkBox',
        defaultValue: false
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
            type: 'dropDown'
          },
          {
            fieldName: 'fields',
            fieldLabel: 'Fields',
            type: 'multiselect'
          },
          {
            fieldName: 'fieldsReset',
            fieldLabel: 'Fields Reset',
            type: 'multiselect'
          },
          {
            fieldName: 'products',
            fieldLabel: 'Products',
            type: 'multiselect',
            lookupResource: sidebarResource.product
          },
          {
            fieldName: 'sumDecimalField',
            fieldLabel: 'Sum(Decimal Field)',
            type: 'checkBox',
            defaultValue: false
          },
          {
            fieldName: 'autoIncrementDecimalField',
            fieldLabel: 'Auto Increment(Decimal Field)',
            type: 'checkBox',
            defaultValue: false
          }
        ],
        defaultValue: []
      }
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
    ]
  },
];
