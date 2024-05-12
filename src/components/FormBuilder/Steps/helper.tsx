import { sidebarResource } from "src/constants/helpers";

export const resourcePolicy = [
    {
        resource: sidebarResource.repairOrder,
        policy: [
            {
                fieldName: "hideAddExistingServices",
                fieldLabel: "Hide Add Existing Services",
                type: "checkBox"
            },
            {
                fieldName: "hideAddNewService",
                fieldLabel: "Hide Add New Service",
                type: "checkBox"
            },
            {
                fieldName: "hideAssignTechnician",
                fieldLabel: "Hide Assign Technician",
                type: "checkBox"
            },
            {
                fieldName: "hideAssignWorkstation",
                fieldLabel: "Hide Assign Work Station",
                type: "checkBox"
            },
            {
                fieldName: "hideAddConsumables",
                fieldLabel: "Hide Add Consumables",
                type: "checkBox"
            },
            {
                fieldName: "hideArrangeServices",
                fieldLabel: "Hide Arrange Services",
                type: "checkBox"
            },
            {
                fieldName: "hideAutoCompleteWorkOrder",
                fieldLabel: "Hide Auto Complete Work Order",
                type: "checkBox"
            },
            {
                fieldName: "hideCompleteSkipRevertService",
                fieldLabel: "Hide Complete/Skip/Revert Service",
                type: "checkBox"
            }
        ]
    },
    {
        resource: sidebarResource.fieldTicket,
        policy: [
            {
                fieldName: "showAddPackages",
                fieldLabel: "Show Add Packages",
                type: "checkBox"
            },
            {
                fieldName: "showRentalAddMaterial",
                fieldLabel: "Show Rental Add Material",
                type: "checkBox"
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
                }]
            },
        ]
    }
]
