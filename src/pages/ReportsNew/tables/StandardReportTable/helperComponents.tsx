import { Warning } from '@material-ui/icons';
import { capitalize, isArray } from 'lodash';
import { Link } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import routes from 'src/components/Helpers/Routes';
import { cn } from 'src/constants/helpers';

export const ReferenceRenderer = (row) => {
  return (
    <div>
      {row?.original?.reference ? (
        row?.original?.referenceType === 'Purchase Order' ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.purchaseOrderDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === 'Transfer Inventory' ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.transferInventoryDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === 'Transfer Asset' ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.transferAssetDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === 'Sales Order' ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.salesOrderDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === 'Bulk Asset Creation' ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.bulkAssetCreationDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === 'Serialized Asset' ? (
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
        ) : row?.original?.referenceType === 'Work Order' ? (
          <Link className="link" target="_blank" title={row?.original?.reference} to={`${routes.workOrderDetail.path}/${row?.original?.referenceId}`}>
            {row?.original?.reference}
          </Link>
        ) : row?.original?.referenceType === 'Field Ticket' ? (
          <Link
            className="link"
            target="_blank"
            title={row?.original?.reference}
            to={`${routes.fieldTicketDetail.path}/${row?.original?.referenceId}`}
          >
            {row?.original?.reference}
          </Link>
        ) : (
          row?.original?.reference
        )
      ) : row?.original?.referenceType === 'Product Inventory' ? (
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

export const CreditDebitRenderer = (row) => {
  return (
    <div
      className={cn(
        row?.original?.type === 'credit' && 'bg-[#90ee90] dark:bg-[hsl(120_73%_40%_/_1)]',
        row?.original?.type === 'debit' && 'bg-[#FFCCCB] dark:bg-[hsl(1_100%_65%_/_1)]'
      )}
    >
      {row?.original?.qty ? (
        <h5 className="text-truncate" title={row?.original?.qty}>
          {row?.original?.type === 'debit' ? `-${row?.original?.qty}` : row?.original?.qty}
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
        <Link
          className="link"
          title={row?.original?.productName || row?.original?.product}
          to={`${routes.productDetail.path}/${row?.original?.materialId || row?.original?.productId || row?.original?._id}`}
          target="_blank"
        >
          {row?.original?.productName || row?.original?.product}
        </Link>
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
        <Link
          className="link"
          title={row?.original?.serviceName}
          to={`${routes.serviceMasterDetail.path}/${row?.original?.materialId || row?.original?.serviceId}`}
          target="_blank"
        >
          {row?.original?.serviceName}
        </Link>
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
        <Link
          className="link"
          title={row?.original?.packageName}
          to={`${routes.packagesDetail.path}/${row?.original?.materialId || row?.original?.packageId || row?.original?._id}`}
          target="_blank"
        >
          {row?.original?.packageName}
        </Link>
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
        <Link
          className="link"
          title={row?.original?.assetNumber}
          to={`${routes.serializedAssetDetail.path}/${row?.original?.materialId || row?.original?.asset?._id}`}
          target="_blank"
        >
          {row?.original?.assetNumber}
        </Link>
      ) : (
        <NoDataCell />
      )}
    </div>
  );
};
