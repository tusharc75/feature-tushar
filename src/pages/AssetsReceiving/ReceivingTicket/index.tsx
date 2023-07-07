import { Box, Button, CircularProgress, IconButton, Menu, MenuItem } from '@material-ui/core';
import { capitalize, isEqual, map, sortBy, uniq } from 'lodash';
import { useState, useEffect, useContext, Fragment } from 'react';
import { isMobile } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import DeleteIcon from '@material-ui/icons/Delete';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import { ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ASSETS_RECEIVING_STATUS, ASSET_STATUS, DELIVERY_FROM_TO_TYPE, DELIVERY_TICKET_REFERENCE_TYPE, DELIVERY_TICKET_STATUS, DELIVERY_TICKET_TYPE, deliveryTicket } from 'src/constants/helpers';
import ManageDeliveryTicket from 'src/pages/DeliveryTicket/ManageDeliveryTicket';
const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const ReceivingTicket = ({
  fetchAssetsReceivingData,
  assetsReceivingData,
  setNextStep,
  renderedFrom,
  stepFullScreen,
  allowedToEdit,
  allowedToDelete,
  updateNextStep
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [material, setMaterial] = useState([]);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const [showTicketDialog, setShowTicketDialog] = useState({ open: false, ticketType: '', data: {} });
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchFields();
  }, [assetsReceivingData]);

  useEffect(() => {
    fetchData();
  }, [columns]);
  const fetchFields = async () => {
    setColumns(null);
    const coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'type',
        Header: 'Type',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.type === 'serializedAsset' ? 'Asset' : capitalize(row.original.type)}</p>
      },
      {
        accessor: 'detail',
        Header: 'Details',
        width: 250,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <a
              className="link text-truncate"
              target="_blank"
              href={`${row.original.type === 'service'
                ? routes.serviceMasterDetail.path
                : row.original.type === 'product'
                  ? routes.productDetail.path
                  : row.original.type === 'serializedAsset'
                    ? routes.serializedAssetDetail.path
                    : routes.packagesDetail.path
                }/${row.original.materialId}`}
              rel="noreferrer"
            >
              {row.original.detail}
            </a>
            <Box ml={1} className="d-flex align-items-center">
              <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
              </span>
            </Box>
          </div>
        )
      },
      {
        accessor: 'productName',
        Header: 'Product',
        width: 200,
        Cell: ({ row }) => (
          <div className="d-flex gap-2 align-items-center">
            <p className="text-truncate" title={row.original?.productName}>
              {row.original?.productName ? (
                row.original?.productId ? (
                  <a className="link text-truncate" target="_blank" href={`${routes.productDetail.path}/${row.original?.productId}`} rel="noreferrer">
                    {row.original?.productName}
                  </a>
                ) : (
                  row.original?.productName
                )
              ) : (
                <NoDataCell />
              )}
            </p>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'receivingTicket',
        Header: 'Receiving Ticket',
        width: 150,
        Cell: ({ row }) =>
          row.original['receivingTicket'] ? (
            <a className="link text-truncate" href={`${routes.deliveryTicketDetail.path}/${row.original['receivingTicketId']}`} target="_blank" rel="noreferrer">
              {row.original['receivingTicket']}
            </a>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'receivingTicketStatus',
        Header: 'Receiving Ticket Status',
        width: 150,
        Cell: ({ row }) =>
          row.original['receivingTicketStatus'] ? (
            <p >
              {row.original['receivingTicketStatus']}
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 100,
        Cell: ({ row }) => (row.original['status'] ? <p> {row.original.status}</p> : <NoDataCell />)
      }
    ];

    coloum.forEach((element) => {
      if (element.accessor === 'qty') {
        element['Footer'] = (info) => {
          const qtyTotal = info.rows
            .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
            .reduce((sum, row) => row.values[element.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      }
    });
    setColumns(coloum);
  };

  const fetchData = async () => {
    setNextStep(false);

    var data: any = [];
    const response = await axiosInstance().get(`${routes.assetsReceiving.path}/material/${assetsReceivingData._id}/`);
    data = response?.data?.data;

    const result = await axiosInstance().get(
      `${deliveryTicket.api}/typewise?referenceType=${DELIVERY_TICKET_REFERENCE_TYPE.assetsReceiving}&referenceId=${assetsReceivingData._id}`
    );

    const ticketProductInventories = []
    result?.data?.data?.forEach((element) => {
      if (element.ticketType === DELIVERY_TICKET_TYPE.receiving && element?.productInventory && element?.productInventory?.length) {
        element?.productInventory?.forEach((ele) => {
          ticketProductInventories.push({
            ...ele,
            receivingTicketId: element._id,
            receivingTicket: element?.ticketName,
            receivingTicketStatus: element?.status
          });
        });
      }
    });



    setMaterial(JSON.parse(JSON.stringify(data.material)));

    const rows = data.material.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      const ticket = ticketProductInventories.find((e) => isEqual(e.optionValue, parent?.serializedAssetDetail?._id));
      if (ticket) {
        parent.receivingTicket = ticket?.receivingTicket || null;
        parent.receivingTicketStatus = ticket?.receivingTicketStatus;
        parent.receivingTicketId = ticket?.receivingTicketId;
      }
      parent.index = i + 1;
      parent.detail = `${parent.type === 'service'
        ? parent.serviceDetail?.serviceName
        : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'serializedAsset'
            ? parent.serializedAssetDetail.assetNumber
            : parent.packageDetail?.packageName
        }`;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
            ? parent?.productDetail?.productDescription || ''
            : parent.type === 'package'
              ? parent?.packageDetail?.packageDescription || ''
              : parent.type === 'serializedAsset'
                ? parent?.serializedAssetDetail?.product?.productDescription || ''
                : '';
      parent.productName = parent?.serializedAssetDetail?.product?.optionLabel || '';
      parent.productId = parent?.serializedAssetDetail?.product?.optionValue || '';
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.subRows = generateNestedData(data.material, parent, ticketProductInventories);
      parent.status = `${parent.type === 'service'
        ? parent.serviceDetail?.status
        : parent.type === 'product'
          ? parent?.productDetail?.status
          : parent.type === 'serializedAsset'
            ? parent?.serializedAssetDetail?.status
            : parent.packageDetail?.status
        }`;
    });

    setNextStep(false);
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const handleTicketDialog = (ticketType, deliveryToType) => {
    const data = {};
    data['ticketName'] = assetsReceivingData.assetsReceivingNumber;
    data['referenceId'] = assetsReceivingData._id;
    data['pickupFromType'] = DELIVERY_FROM_TO_TYPE.customer;
    data['pickupFrom'] = assetsReceivingData?.customerAccount?.optionValue;
    data['deliveryToType'] = deliveryToType;
    data['deliveryTo'] = assetsReceivingData?.warehouse?.optionValue;
    data['deliveryToAddress'] = assetsReceivingData?.warehouse?.address;
    data['pickupFromAddress'] = assetsReceivingData?.customerAccount?.shippingAddress[0];
    data['isPickupFromDisable'] = true;
    data['status'] = DELIVERY_TICKET_STATUS.indTransit;
    setShowTicketDialog({ open: ticketType === DELIVERY_TICKET_TYPE.receiving ? true : false, ticketType: ticketType, data: data });
    closeActions();
  };

  const generateNestedData = (material, parent, ticketProductInventories) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow, j) => {
      const ticket = ticketProductInventories.find((e) => isEqual(e.optionValue, _subRow?.serializedAssetDetail?._id));
      if (ticket) {
        parent.receivingTicket = ticket?.receivingTicket || null;
        parent.receivingTicketStatus = ticket?.receivingTicketStatus;
        parent.receivingTicketId = ticket?.receivingTicketId;
      }
      _subRow.index = parent.index + '.' + `${_subRow.type === 'service' ? alphabet[serviceIndex] : productIndex + 1}`;
      _subRow.detail = `${_subRow.type === 'service'
        ? _subRow.serviceDetail?.serviceName
        : _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'serializedAsset'
            ? _subRow.serializedAssetDetail.assetNumber
            : _subRow.packageDetail?.packageName
        }`;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.productName = _subRow?.serializedAssetDetail?.product?.optionLabel || '';
      _subRow.productId = _subRow?.serializedAssetDetail?.product?.optionValue || '';
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isValid = true;
      _subRow.hideSelection = true;
      _subRow.subRows = generateNestedData(material, _subRow, ticketProductInventories);
      _subRow.type === 'service' ? serviceIndex++ : productIndex++;
      parent.status = `${parent.type === 'service'
        ? parent.serviceDetail?.status
        : parent.type === 'product'
          ? parent.productDetail?.status
          : parent.type === 'serializedAsset'
            ? parent.serializedAssetDetail.status
            : parent.packageDetail?.status
        }`;
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return sortBy(subRows, ['type']);
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${routes.assetsReceiving.path}/material/${assetsReceivingData?._id}/delete`, { rows })
      .then(() => {
        setDeleting(false);
        fetchData();
        fetchAssetsReceivingData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handelProcessTickets = () => {
    setActionLoading(true)
    closeActions();
    let data = {};
    const receivingTicketId = uniq(map(selectedProducts, 'receivingTicketId'));
    const ticketIds: any = [];
    receivingTicketId?.forEach((e) => {
      if (e && e !== undefined) {
        ticketIds.push(e);
      }
    });
    if (ticketIds.length) {
      data['_ids'] = ticketIds;
      data['status'] = DELIVERY_TICKET_STATUS.delivered;
      data['signatures'] = [];
      data['warehouse'] = assetsReceivingData?.warehouse?.optionValue;
      axiosInstance()
        .post(`${deliveryTicket.api}/updatebulk`, data)
        .then(({ data: { data } }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: `Receiving Successfully`
          });
          axiosInstance().put(`${routes.assetsReceiving.path}/${assetsReceivingData._id}/process-status`, { status: ASSETS_RECEIVING_STATUS.complete })
          updateNextStep()
          if (
            receivingTicketId?.length &&
            selectedProducts?.filter((e) => e.type === 'serializedAsset')?.length
          ) {
            toastConfig.setToastConfig({
              open: true,
              type: 'success',
              message: 'Repair Order created for received assets'
            });
          }
          setActionLoading(false)
          setSelectedProducts([])
          fetchAssetsReceivingData();
          fetchData();
        })
        .catch((error) => {
          setActionLoading(false)
          toastConfig.setToastConfig(error);
        });
    }
  };


  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" flexWrap={'wrap'} gridGap={1} m={1}>
          <Box display="flex" flexWrap={'wrap'} />
          <Box display="flex">
            <Button
              variant="outlined"
              color="default"
              size="small"
              onClick={openActions}
              aria-controls="action-menu"
              disabled={selectedProducts.length === 0 || actionLoading}
              endIcon={<ExpandMore />}
              className="new-dropdown-v1"
            >
              Actions {actionLoading && <CircularProgress size={20} style={{ marginLeft: 10 }} />}
            </Button>
            <Menu
              anchorEl={anchorActionEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorActionEl)}
              onClose={closeActions}
            >
              <MenuItem
                disabled={selectedProducts?.filter((e) => e?.receivingTicket)?.length > 0 || actionLoading}
                onClick={() => {
                  handleTicketDialog(DELIVERY_TICKET_TYPE.receiving, DELIVERY_FROM_TO_TYPE.plant);
                }}
              >
                Create Receiving Ticket
              </MenuItem>
              <MenuItem
                disabled={selectedProducts?.filter((e) => e?.receivingTicket && e?.receivingTicketStatus === "Delivered")?.length > 0 || selectedProducts?.filter((e) => !e?.receivingTicket)?.length > 0 || actionLoading}
                onClick={() => {
                  handelProcessTickets();
                }}
              >
                Receive Assets
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      )}
      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            onSelect={setSelectedProducts}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            hideExpander={true}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}

      {showTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={showTicketDialog.ticketType}
          referenceType={DELIVERY_TICKET_REFERENCE_TYPE.assetsReceiving}
          referenceData={showTicketDialog.data}
          productInventory={[...selectedProducts?.map((i) => ({ ...i, _id: i.materialId }))]}
          products={[]}
          onClose={() => setShowTicketDialog({ open: false, ticketType: '', data: {} })}
          onSuccess={(data) => {
            setShowTicketDialog({ open: false, ticketType: '', data: {} });
            setSelectedProducts([])
            closeActions();
            fetchAssetsReceivingData();
            fetchData();
          }}
        />
      )}
    </Fragment>
  );
};

export default ReceivingTicket;
