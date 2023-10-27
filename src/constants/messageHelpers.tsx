import routes from "src/components/Helpers/Routes";

export const ownerAndColaborator = 'You have to be owner or colaborator to perform this!';

export const rentalManagementActions = {
    createLoadingTicket: 'Create Loading Ticket',
    deliveredToCustomer: 'Delivered to Customer',
    cancelInTransitLoadingTicket: 'Cancel In-Transit Loading Ticket',
    cancelDeliveredLoadingTicket: 'Cancel Delivered Loading Ticket',
    replaceAsset: 'Replace Asset',
    createReceivingTicket: 'Create Receiving Ticket',
    createReturnTicket: 'Create Return Ticket',
    receiveItems: 'Receive Items',
    createSupplierDeliveryTicket: 'Create Supplier Delivery Ticket',
    cancelInTransitReceivingTicket: 'Cancel In-Transit Receiving Ticket',
    cancelDeliveredReceivingTicket: 'Cancel Delivered Receiving Ticket',
    createRepairJob: 'Create Repair Job',
    createRepairOrder: 'Create Repair Order',
    transferToAnotherRental: 'Transfer to another Rental'
};

export const rentalManagementMessage = {
    addProductPackage: 'Add Products/Packages to proceed',
    assignAssets: 'Assign Assets to proceed',
    loadingCreatedAndDelivered: 'Loading Ticket Created And Delivered to proceed',
    receivingCreatedAndDelivered: 'Receiving/Return Ticket Created And Delivered to proceed',
    loadingAlreadyCreated: 'Loading Ticket Already Created',
    loadingNotCreated: 'Loading Ticket Not Created Yet',
    loadingAlreadyDelivered: 'Loading Ticket already delivered',
    loadingNotDelivered: 'Loading Ticket not delivered yet',
    receivingAlreadyCreated: 'Receiving Ticket Already Created',
    receivingNotCreated: 'Receiving  Ticket Not Created Yet',
    receivingAlreadyDelivered: 'Receiving Ticket already delivered',
    receivingNotDeliverd: 'Receiving  Ticket Not Deliverd Yet',
    returnAlreadyCreated: 'Return Ticket Already Created',
    returnAlreadyDelivered: 'Return Ticket already delivered',
    receivingOrReturnNotCreated: 'Receiving or Return Ticket Not Created Yet',
    receivingOrReturnNotDelivered: 'Receiving or Return Ticket Not Delivered Yet',
    receivingNotProduct: 'Can not create receiving Ticket for product',
    receivingNotValidStatus: 'Can not create receiving Ticket not valid asset status',
    ticketNotForLost: 'Can not create Ticket for lost assets',
    notSubleaseAsset: 'Not Sublease Asset',
    productsCanNotReplace: 'Can not replace Product',
    loadingDeliveredForReplace: 'loading Ticket delivered for repalce asset',
    onlyReplaceInUse: 'Only Replace InUse Assets',
    canNotReplaceInvoiceCreated: 'Invoice Created Can Not Replace',
    cancelInTransitLineItems: 'Only InTransit ticket Cancel',
    statusInUseCancelLoading: 'Asset Status InUse For Cancel Loading Ticket',
    rentalStatusInUseCancelLoading: 'Rental Asset Status InUse For Cancel Loading Ticket',
    statusURForCancelReceiving: 'Asset Status UnderReview For Cancel Receiving Ticket',
    rentalStatusCompleteCancelReceiving: 'Rental Asset Status Complete For Cancel Receiving Ticket',
    repairCanForThisAsset: 'Under Review,Need Repair,Need Recert,Scrap',
    repairSameWarehouse: `Repair can do for same ${routes.warehouse.title}`,
    transferRentalForAsset: 'In-Use,Available,Under Review',
};

export const subleaseActions = {
    createLoadingTicket: 'Create Loading Ticket',
    deliveredToPlant: 'Delivered to Plant',
    createReceivingTicket: 'Create Receiving Ticket',
    receiveAtPlant: 'Receive at Plant',
};

export const subleaseMessage = {
    addProductPackageStep: 'Add Products/Packages to proceed',
    assignAssetsStep: 'Assign Assets to proceed',
    deliverLoadingTicketStep: 'Create & Deliver Loading Ticket to proceed',
    subleaseProcessStep: 'There maybe some reasons that i dont konw',
    loadingAlreadyCreated: 'Loading Ticket Already Created',
    loadingNotCreated: 'Loading Ticket Not Created Yet',
    loadingAlreadyDelivered: 'Loading Ticket already delivered',
    loadingNotDelivered: 'Loading Ticket not delivered yet',
    receivingAlreadyCreated: 'Receiving Ticket Already Created',
    receivingOrReturnNotCreated: 'Receiving or Return Ticket Not Created Yet',
    receivingAlreadyDelivered: 'Receiving Ticket already delivered',
};
