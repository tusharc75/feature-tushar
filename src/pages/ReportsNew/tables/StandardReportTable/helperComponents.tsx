import { IconButton } from '@material-ui/core';
import { Warning } from '@material-ui/icons';
import { capitalize, isArray } from 'lodash';
import { FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { cn, sidebarResource } from 'src/constants/helpers';

export const ReferenceRenderer = (row) => {
  return (
    <div>
      {row?.original?.reference ? (
        row?.original?.referenceType === sidebarResource.purchaseOrder ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.purchaseOrderDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === sidebarResource.transferInventory ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.transferInventoryDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === sidebarResource.transferAsset ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.transferAssetDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === sidebarResource.salesOrder ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.salesOrderDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === sidebarResource.bulkAssetCreation ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.bulkAssetCreationDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === sidebarResource.serializedAsset ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.serializedAssetDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === 'Rental Job' ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.rentalManagementDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === sidebarResource.workOrder ? (
          <Link className="link" target="_blank" title={row?.original?.reference} to={`${routes.workOrderDetail.path}/${row?.original?.referenceId}`}>
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === sidebarResource.fieldTicket ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.fieldTicketDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === sidebarResource.subcontractAssembly ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.subcontractAssemblyDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : (
          row?.original?.reference
        )
      ) : row?.original?.referenceType === sidebarResource.productInventory ? (
        <h5 className="text-truncate">Manual Entry</h5>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
};

export const UnitNameRenderer = (row) => {
  return (
    <div>
      <Link className="link text-truncate" title={row?.original?.unitNumber} to={`${routes.unitDetail.path}/${row?.original?._id}`} target="_blank">
        {row?.original?.unitNumber}
      </Link>
      {row?.original?.unitInOtherDeal && (
        <div className="ml-2">
          <HtmlTooltip title={'Unit is assigned to multiple active contracts'} placement="top" arrow>
            <Warning style={{ fontSize: '16px' }} fontSize="small" color="error" />
          </HtmlTooltip>
        </div>
      )}
    </div>
  );
};

export const CreditDebitTypeRenderer = (row) => {
  return <div>{row?.original?.type ? <span>{capitalize(row?.original?.type)}</span> : <NoDataCell />}</div>;
};

export const SerialNumberRenderer = (row) => {
  return (
    <div>
      {row.original?.serialNumber && isArray(row.original.serialNumber) && row.original.serialNumber?.length ? (
        row?.original?.serialNumber?.map((e) => e?.serialNumber)?.toString()
      ) : (
        <NoDataCell />
      )}
    </div>
  );
};

export const CreditDebitRenderer = (row, key) => {
  return (
    <div
      className={cn(
        row?.original?.type?.toLowerCase() === 'credit' && 'bg-[#90ee90] dark:bg-[hsl(120_73%_40%_/_1)]',
        row?.original?.type?.toLowerCase() === 'debit' && 'bg-[#FFCCCB] dark:bg-[hsl(1_100%_65%_/_1)]'
      )}
    >
      {row?.original?.qty ? (
        <h5 className="text-truncate" title={row?.original?.[key]}>
          {row?.original?.type?.toLowerCase() === 'debit' ? `-${row?.original?.[key]}` : row?.original?.[key]}
        </h5>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
};

export const ProductRenderer = (row) => {
  return (
    <div>
      {row?.original?.productName || row?.original?.product ? (
        <div className="flex items-center gap-1">
          <p>{row?.original?.productName || row?.original?.product}</p>
          <IconButton
            size="small"
            onClick={() => {
              window.open(`${routes.productDetail.path}/${row?.original?.materialId || row?.original?.productId || row?.original?._id}`);
            }}
          >
            <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
          </IconButton>
        </div>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
};

export const ServiceRenderer = (row) => {
  return (
    <div>
      {row?.original?.serviceName ? (
        <div className="flex items-center gap-1">
          <p>{row?.original?.serviceName}</p>
          <IconButton
            size="small"
            onClick={() => {
              window.open(`${routes.serviceMasterDetail.path}/${row?.original?.materialId || row?.original?.serviceId}`);
            }}
          >
            <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
          </IconButton>
        </div>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
};

export const PackageRenderer = (row) => {
  return (
    <div>
      {row?.original?.packageName ? (
        <div className="flex items-center gap-1">
          <p>{row?.original?.packageName}</p>
          <IconButton
            size="small"
            onClick={() => {
              window.open(`${routes.packagesDetail.path}/${row?.original?.materialId || row?.original?.packageId || row?.original?._id}`);
            }}
          >
            <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
          </IconButton>
        </div>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
};

export const SerializedAssetRenderer = (row) => {
  return (
    <div>
      {row?.original?.assetNumber ? (
        <div className="flex items-center gap-1">
          <p>{row?.original?.assetNumber}</p>
          <IconButton
            size="small"
            onClick={() => {
              window.open(`${routes.serializedAssetDetail.path}/${row?.original?.materialId || row?.original?._id}`);
            }}
          >
            <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
          </IconButton>
        </div>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
};
