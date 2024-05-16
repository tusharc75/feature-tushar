import { sidebarResource } from "src/constants/helpers";

export const resourcePolicy = [
    {
        resource: sidebarResource.repairOrder,
        policy: [
            {
                fieldName: "hideAddExistingServices",
                fieldLabel: "Hide Add Existing Services",
                type: "checkBox",
                defaultValue: false
            },
            {
                fieldName: "hideAddNewService",
                fieldLabel: "Hide Add New Service",
                type: "checkBox",
                defaultValue: false
            },
            {
                fieldName: "hideAssignTechnician",
                fieldLabel: "Hide Assign Technician",
                type: "checkBox",
                defaultValue: false
            },
            {
                fieldName: "hideAssignWorkstation",
                fieldLabel: "Hide Assign Work Station",
                type: "checkBox",
                defaultValue: false
            },
            {
                fieldName: "hideAddConsumables",
                fieldLabel: "Hide Add Consumables",
                type: "checkBox",
                defaultValue: false
            },
            {
                fieldName: "hideArrangeServices",
                fieldLabel: "Hide Arrange Services",
                type: "checkBox",
                defaultValue: false
            },
            {
                fieldName: "hideAutoCompleteWorkOrder",
                fieldLabel: "Hide Auto Complete Work Order",
                type: "checkBox",
                defaultValue: false
            },
            {
                fieldName: "hideCompleteSkipRevertService",
                fieldLabel: "Hide Complete/Skip/Revert Service",
                type: "checkBox",
                defaultValue: false
            }
        ]
    },
    {
        resource: sidebarResource.fieldTicket,
        policy: [
            {
                fieldName: "showAddPackages",
                fieldLabel: "Show Add Packages",
                type: "checkBox",
                defaultValue: false
            },
            {
                fieldName: "showRentalAddMaterial",
                fieldLabel: "Show Rental Add Material",
                type: "checkBox",
                defaultValue: false
            }
        ]
    },
    {
        resource: sidebarResource.serializedAsset,
        policy: [
            {
                fieldName: "statusChangeFields",
                fieldLabel: "Status Change Fields",
                type: "multipleFields",
                fields: [{
                    fieldName: "status",
                    fieldLabel: "Status",
                    type: "dropdown"
                },
                {
                    fieldName: "fields",
                    fieldLabel: "Fields",
                    type: "multiselect"
                },
                {
                    fieldName: "sumDecimalField",
                    fieldLabel: "Sum(Decimal Field)",
                    type: "checkBox",
                    defaultValue: false
                }],
                defaultValue: []
            },
        ]
    }
]
