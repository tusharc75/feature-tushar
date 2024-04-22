import routes from "src/components/Helpers/Routes";

export const ownerAndColaborator = 'You have to be either owner or collaborator to perform this action';

export const entityDisable = 'You do not have permission to update entity';

export const actionSelection = 'Select at least one line item to enable this button';

export const cloneDisable = 'You do not have permission to Clone/Create';
export const deleteDisable = 'You do not have permission to Delete';
export const editDisable = 'You do not have permission to Edit';
export const childDisable = 'You do not have permission to View Child';

export const quotationApprovedMessage = 'Quotation Approved you can not perform this action';

export const rentalManagementActions = {
    createLoadingTicket: 'Create Loading Ticket',
    deliveredToCustomer: 'Delivered to Customer',
    cancelInTransitLoadingTicket: 'Cancel In-Transit Loading Ticket',
    cancelLoadingTicket: 'Cancel Loading Ticket',
    replaceAsset: 'Replace Asset',
    createReceivingTicket: 'Create Receiving Ticket',
    createReturnTicket: 'Create Return Ticket',
    receiveItems: 'Receive Items',
    createSupplierDeliveryTicket: 'Create Supplier Delivery Ticket',
    cancelInTransitTicket: 'Cancel In-Transit Receiving Ticket',
    cancelReceivingReturnTicket: 'Cancel Receiving Return Ticket',
    createRepairJob: 'Create Repair Job',
    createRepairOrder: 'Create Repair Order',
    transferToAnotherRental: 'Transfer to another Rental',
    swapInUseAssets: 'Swap In-Use Assets'
};

export const rentalManagementMessage = {
    addProductPackage: 'Add Products or Packages to proceed',
    validPrice: 'Enter Price to proceed',
    addProductInPackage: 'Add Product in package to proceed',
    addServiceInPackage: 'Add Service in package to proceed',
    assignAssets: 'Assign Assets to proceed',
    loadingCreatedAndDelivered: 'Create and Deliver at least one Loading Ticket to proceed',
    loadingCreateToProceed: 'Create at least one Loading Ticket to proceed',
    changeStatusToInUse: 'Change Assets status In-Use to proceed',
    receivingCreateToProceed: 'Create at least one Receiving or Return Ticket to proceed',
    receivingCreatedAndDelivered: 'Create and Receive Receiving or Return Ticket to proceed',
    loadingAlreadyCreated: 'Loading Ticket is already created',
    loadingNotCreated: 'Loading Ticket is not created',
    loadingAlreadyDelivered: 'Loading Ticket is already delivered',
    loadingNotDelivered: 'Loading Ticket is not delivered',
    inTransitDeliveredLoadingTicket: 'Only In-Transit/Delivered tickets can be cancelled',
    receivingAlreadyCreated: 'Receiving Ticket is already created',
    receivingReturnNotCreated: 'Receiving/Return Ticket is not created',
    receivingAlreadyDelivered: 'Receiving Ticket is already delivered',
    receivingReturnNotDeliverd: 'Receiving/Return Ticket is not delivered',
    returnAlreadyCreated: 'Return Ticket is already created',
    returnAlreadyDelivered: 'Return Ticket is already delivered',
    receivingOrReturnNotCreated: 'Receiving or Return Ticket is not created',
    receivingOrReturnNotDelivered: 'Receiving or Return Ticket is not delivered',
    receivingNotProduct: `Receiving Ticket cannot be created for product(s)`,
    receivingNotValidStatus: `Ticket cannot be created as asset status is not valid`,
    ticketNotForLost: `Ticket cannot be created for lost assets`,
    onlySubleaseAsset: "Only Sublease assets can be selected for this action",
    notSubleaseAsset: "Sublease assets cannot be selected for this action",
    productsCanNotReplace: 'Product(s) cannot be replaced',
    loadingDeliveredForReplace: 'Loading Ticket must be delivered to replace assets',
    onlyReplaceInUse: 'Only In-Use assets can be replaced',
    cancelInTransitLineItems: 'Only In-Transit tickets can be cancelled',
    statusInUseCancelLoading: 'Receiving Ticket must be cancelled first',
    rentalStatusInUseCancelLoading: 'Receiving Ticket must be cancelled first',
    statusURForCancelReceiving: 'Receiving Ticket can be cancelled only for Under Review assets',
    rentalProductConsumed: 'Product already consumed',
    rentalStatusCompleteCancelReceiving: 'Receiving Ticket can only be canceled for assets/consumables that have Complete/Return Rental Asset Status',
    repairCanForThisAsset: 'Only Under Review, Need Repair, Need Recert and Scrap assets can be repaired',
    repairSameWarehouse: `Selected assets must be in same ${routes.warehouse.title} to perform this action`,
    transferRentalForAsset: 'Only In-Use, Available and Under Review assets can be transfered',
    transferRentalForAssetSame: 'Only all In-Use or Available/Under Review assets can be transfered at a time',
    onlySwapAssets: 'Only Assets can be swapped',
    onlySwapInUseAssets: 'Only In-Use assets can be swapped',
    onlyAssetsCanBeRepaired: 'Only assets can be repaired',
};

export const subleaseActions = {
    createLoadingTicket: 'Create Loading Ticket',
    deliveredToWarehouse: 'Delivered to Warehouse',
    createReceivingTicket: 'Create Receiving Ticket',
    receivedToWarehouse: 'Received at Warehouse',
};

export const subleaseMessage = {
    addProductPackage: 'Add Products or Packages to proceed',
    startSublease: 'Start Sublease to proceed',
    assignAssets: 'Assign Assets to proceed',
    subleaseProcessStep: 'Send to Supplier to proceed',
    deliverLoadingTicketStep: 'Create & Deliver Loading Ticket to proceed',
    deliverReceivingTicketStep: 'Create & Receive Receiving Ticket to proceed',

    loadingNotCreated: 'Loading Ticket is not created',
    loadingAlreadyDelivered: 'Loading Ticket is already delivered',
    loadingNotDelivered: 'Loading Ticket is not delivered',
    loadingAlreadyCreated: 'Loading Ticket Already Created',

    receivingNotCreated: 'Receiving Ticket is not created',
    receivingAlreadyDelivered: 'Receiving Ticket is already delivered',
    receivingNotDeliverd: 'Receiving Ticket is not delivered',
    receivingAlreadyCreated: 'Receiving Ticket Already Created',
    receivingStatus: 'Receiving Ticket is Only create for New,Available and Under Review assets',

    assetStatusSendSupplier: 'Only New,Available and Under Review asset status can send to supplier',
    assetsIsWithCustomer: 'Assets are at customer location',
    assetsAlradyReturned: 'Assets are already returned to supplier',
};
