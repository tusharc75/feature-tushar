import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useReducer, useContext } from 'react';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import CustomAgGrid, { intialState, reducer } from '../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import { Link, useHistory } from 'react-router-dom';
import routes from '../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import { Button, IconButton, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { AiFillFilePdf } from 'react-icons/ai';
import axiosInstance from '../../axios/axiosInstance';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import NoDataCell from '../../components/Helpers/NoDataCell';
import {
  deliveryTicket,
  gridLoadingTimeout,
  repairJob,
  REPAIR_JOB_STATUS,
  sidebarResource,
  INVENTORY_STATUS,
  DELIVERY_TICKET_TYPE,
  DELIVERY_TICKET_REFRENCE_TYPE
} from '../../constants/helpers';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import { groupBy } from 'lodash';
import ManageDeliveryTicket from '../DeliveryTicket/ManageDeliveryTicket';
import { isMobile, isTablet } from 'react-device-detect';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';
import AssetScrapRepairDialog from '../../components/AssetScrapRepairDialog/AssetScrapRepairDialog';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import { GiAutoRepair } from 'react-icons/gi';
import { RiExchangeFundsLine } from 'react-icons/ri';

const renderedFrom = 'repairJob_delivery_ticket';

const RepairJobDeliveryTicket = ({ repairJobData, setNextButtonDisabled, setPreviousButtonDisabled, hideReceivingTicketStep }) => {
  const toastConfig = useContext(CustomToastContext);

  const history = useHistory();
  const [gridApi, setGridApi] = useState(null);
  const [assignedSerializedAsset, setAssignedSerializedAsset] = useState([]);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false);
  const [showRemoveAssetFromLoadingTicketDialog, setShowRemoveAssetFromLoadingTicketDialog] = useState(false);
  const [okBtnLoading, setOkBtnLoading] = useState(false);
  const [showDeliveryTicketDialog, setShowDeliveryTicketDialog] = useState({ open: false, selectedAssets: [] });
  const [repairAssetDialog, setRepairAssetDialog] = useState({ open: false, assetId: null, assetName: null, assetIds: [] });

  // const [showActions, setShowActions] = useState(
  //   repairJobData['typeOfRepair'] === 'Internal' && repairJobData['plant'] !== repairJobData['repairPlant']
  // );

  const [anchorEl, setAnchorEl] = useState(null);
  const [statusToUpdate, setStatusToUpdate] = useState({ open: false, isUpdating: false, status: '', message: '' });

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  useEffect(() => {
    // if (productInventory.length > 0) {
    fetchRecords();
    // }
    // eslint-disable-next-line
  }, []);

  const handleDeliveryTicketDialog = (selectedAssets) => {
    setShowDeliveryTicketDialog({ open: true, selectedAssets: selectedAssets });
  };

  const fetchRecords = () => {
    if (gridApi) {
      gridApi.deselectAll();
    }

    localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));

    dispatch({
      type: 'initialize',
      data: [],
      count: 0
    });

    axiosInstance()
      .get(`${repairJob.repairJobApi}/${repairJobData._id}/get-assets`)
      .then(({ data }) => {
        setAssignedSerializedAsset(data.data);
        let tempProductInventory = data.data.map((u) => ({
          ...u,
          _id: u?.id,
          productName: u?.product?.optionLabel,
          repaired: u?.repaired ?? false,
          isDelivered: false
        }));
        if (repairJobData['typeOfRepair'] === 'Internal' && repairJobData['plant']?.optionValue !== repairJobData['repairPlant']?.optionValue) {
          tempProductInventory.forEach((obj) => {
            obj['typeOfRepair'] = repairJobData['typeOfRepair'];
            obj['plant'] = obj['typeOfRepair'] === 'Internal' ? repairJobData['plant']?.optionValue : '';
            obj['repairPlant'] = obj['typeOfRepair'] === 'Internal' ? repairJobData['repairPlant']?.optionValue : '';
          });
        }
        dispatch({ type: 'loading', loading: true });
        axiosInstance()
          .get(`${routes.deliveryTicket.path}/typewise?refrenceType=Repair Job&refrenceId=${repairJobData._id}`)
          .then(({ data }) => {
            data.data.map((obj) => {
              if (obj.ticketType === 'Loading') {
                tempProductInventory.map((d, index) => {
                  if (obj?.productInventory?.some((p) => d?._id === p?.optionValue)) {
                    tempProductInventory[index]['type'] = obj?.type;
                    tempProductInventory[index]['deliveryTicket'] = obj?.ticketName;
                    tempProductInventory[index]['deliveryTicketId'] = obj?._id;
                    tempProductInventory[index]['isDelivered'] = obj?.status === 'Delivered';
                  }
                });
              }
            });
            tempProductInventory.forEach((d) => {
              if (!d.hasOwnProperty('isDelivered')) {
                d['isDelivered'] = false;
              }
            });
            //setShowActions(!data.data.some((s) => s['ticketType'] === 'Receiving'));
            tempProductInventory.forEach((d) => {
              d['_id'] = d['id'];
              d['hideSelection'] = d.status === INVENTORY_STATUS.indTransit || d.status === INVENTORY_STATUS.lost; // || (d.hasOwnProperty("isDelivered") && d["isDelivered"] === true) || d["repaired"];
            });

            if (
              repairJobData['typeOfRepair'] === 'Internal' &&
              repairJobData['plant']?.optionValue !== repairJobData['repairPlant']?.optionValue &&
              tempProductInventory.some((s) => s['repaired'] === true)
            ) {
              hideReceivingTicketStep(true);
              if (tempProductInventory.some((f) => f['repaired'] === true)) {
                setNextButtonDisabled(
                  !tempProductInventory
                    .filter((f) => f.status !== 'Lost')
                    .some((e) => e.hasOwnProperty('isDelivered') && e.isDelivered === true && e.repaired === true)
                );
              }
            } else {
              setNextButtonDisabled(
                !tempProductInventory.filter((f) => f.status !== 'Lost').some((e) => e.hasOwnProperty('isDelivered') && e.isDelivered === true)
              );
            }
            dispatch({
              type: 'initialize',
              data: [...tempProductInventory],
              count: tempProductInventory.length
            });
            setTimeout(() => {
              dispatch({ type: 'loading', loading: false });
            }, gridLoadingTimeout);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const TicketRenderer = (params) =>
    params?.value ? (
      <Link className="link text-truncate" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.deliveryTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  const InventoryRenderer = (params) => (
    <span className="d-flex gap-2 align-items-center">
      <Link className="link text-truncate" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
        {params.value}
      </Link>

      {params.data.repaired && (
        <HtmlTooltip title="Repaired">
          <CheckCircleIcon color="primary" fontSize="small" />
        </HtmlTooltip>
      )}
    </span>
  );

  const ProductNameRenderer = (params) =>
    params.data?.product?.optionValue ? (
      <Link className="link text-truncate" title={params.value} to={`${routes.productDetail.path}/${params.data?.product?.optionValue}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    );

  // const ActionsRenderer = (params) => {
  //   return (
  //     params.data['isDelivered'] &&
  //     !params.data['repaired'] && (
  //       <HtmlTooltip title="Repair Asset">
  //         <IconButton
  //           size="small"
  //           aria-label="Repair Asset"
  //           color="primary"
  //           onClick={() => {
  //             setRepairAssetDialog({ open: true, assetId: params.data._id, assetName: params.data.assetNumber, assetIds: [] });
  //           }}
  //         >
  //           <CheckCircleOutlineIcon fontSize="small" />
  //         </IconButton>
  //       </HtmlTooltip>
  //     )
  //   );
  // };

  const frameworkComponents = {
    inventoryRenderer: InventoryRenderer,
    ticketRenderer: TicketRenderer,
    productNameRenderer: ProductNameRenderer,
    commonRenderer: CommonRenderer,
    //actionsRenderer: ActionsRenderer
  };

  const columns = [
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "inventoryRenderer" },
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
    { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "deliveryTicket", headerName: "Loading Ticket", show: true, cellRenderer: "ticketRenderer" },
    { field: "productName", headerName: "Product Type", show: true, disabled: true, cellRenderer: "productNameRenderer" },
    { field: "status", headerName: "Status", show: true, cellRenderer: "commonRenderer" },
  ];

  const columnState = JSON.parse(localStorage.getItem(renderedFrom));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  return (
    <>
      <Box display="flex" justifyContent="flex-end" pt={1}>
        <Box display="flex" alignItems="center">
          <Button
            onClick={() => {
              setDownlodingFile(true);
              axiosInstance()
                .get(`/repair-job/${repairJobData._id}/pdf`)
                .then(({ data }) => {
                  axiosInstance()
                    .get(`user/download?fileName=${data.data.fileName}`, {
                      responseType: 'blob'
                    })
                    .then(({ data }) => {
                      const file = new Blob([data], { type: 'application/pdf' });
                      const fileURL = URL.createObjectURL(file);
                      const pdfWindow = window.open();
                      pdfWindow.location.href = fileURL;
                      toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
                      setDownlodingFile(false);
                    })
                    .catch((err) => {
                      toastConfig.setToastConfig(err);
                      setDownlodingFile(false);
                    });
                })
                .catch((err) => {
                  toastConfig.setToastConfig(err);
                  setDownlodingFile(false);
                });
            }}
            variant={isMobile && !isTablet ? 'text' : 'outlined'}
            color="primary"
            type="button"
            size="small"
            style={isMobile && !isTablet ? { color: 'var(--info-dark)' } : {}}
            disabled={downlodingFile}
            startIcon={isMobile && !isTablet ? '' : <AiFillFilePdf />}
          >
            {isMobile && !isTablet ? <AiFillFilePdf size={18} /> : downlodingFile ? 'Please wait...' : 'Preview'}
          </Button>
          <Box mx={1} />
          {/* {showActions && (
            <Button
              variant={isMobile && !isTablet ? 'text' : 'contained'}
              color="primary"
              type="button"
              size="small"
              style={isMobile && !isTablet ? { color: '#FFFF5C' } : {}}
              disabled={
                selectedRecords.length === 0 ||
                selectedRecords.some((s) => s.repaired === true) ||
                !selectedRecords.some((s) => s['isDelivered'] && !s['repaired'])
              }
              onClick={() => {
                setRepairAssetDialog({ open: true, assetId: null, assetName: null, assetIds: [...selectedRecords.map((m) => m._id)] });
              }}
            >
              {isMobile && !isTablet ? <GiAutoRepair size={18} /> : 'Complete Repair'}
            </Button>
          )} 
          <Box mx={1} />
          */}
          {repairJobData && repairJobData['status'] !== REPAIR_JOB_STATUS.completed && (
            <Button
              variant={isMobile && !isTablet ? 'text' : 'outlined'}
              color="primary"
              aria-controls="simple-menu"
              aria-haspopup="true"
              style={isMobile && !isTablet ? { color: "var(--warning-darken)" } : {}}
              disabled={selectedRecords.length === 0}
              size="small"
              onClick={handleClick}
              endIcon={<ArrowDropDownIcon />}
            >
              {isMobile && !isTablet ? <RiExchangeFundsLine size={20} /> : 'Change Status'}
            </Button>
          )}
          <Menu
            id="simple-menu"
            anchorEl={anchorEl}
            keepMounted
            open={Boolean(anchorEl)}
            onClose={handleClose}
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: 'Scrap', message: '' });
              }}
            >
              Scrap
            </MenuItem>
            <MenuItem
              onClick={() => {
                setAnchorEl(null);
                setStatusToUpdate({ open: true, isUpdating: false, status: 'Lost', message: '' });
              }}
            >
              Lost
            </MenuItem>
          </Menu>
          {repairJobData && repairJobData['status'] !== REPAIR_JOB_STATUS.completed && (
            <IconButton
              disabled={
                selectedRecords.length === 0 ||
                selectedRecords.some((f) => f.hasOwnProperty('deliveryTicketId')) ||
                selectedRecords.some((f) => f.repaired === true) ||
                selectedRecords.some((f) => f.status === 'Lost')
              }
              onClick={() => {
                handleDeliveryTicketDialog(selectedRecords);
              }}
              color="primary"
              size="small"
            >
              <Tooltip title="Create Loading Ticket">
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  disabled={
                    selectedRecords.length === 0 ||
                    selectedRecords.some((f) => f.hasOwnProperty('deliveryTicketId')) ||
                    selectedRecords.some((f) => f.repaired === true) ||
                    selectedRecords.some((f) => f.status === 'Lost')
                  }
                >
                  Create Loading Ticket
                </Button>
              </Tooltip>
            </IconButton>
          )}
          {repairJobData && repairJobData['status'] !== REPAIR_JOB_STATUS.completed && (
            <IconButton
              disabled={
                selectedRecords.length === 0 ||
                selectedRecords.some((f) => f.hasOwnProperty('deliveryTicketId') === false) ||
                selectedRecords.some((f) => f.isDelivered === true)
              }
              onClick={() => {
                setShowRemoveAssetFromLoadingTicketDialog(true);
              }}
              color="primary"
              size="small"
            >
              <Tooltip title="Remove Assets From Loading Ticket(s)">
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  disabled={
                    selectedRecords.length === 0 ||
                    selectedRecords.some((f) => f.hasOwnProperty('deliveryTicketId') === false) ||
                    selectedRecords.some((f) => f.isDelivered === true)
                  }
                >
                  Remove Assets
                </Button>
              </Tooltip>
            </IconButton>
          )}
        </Box>
      </Box>
      <Grid item xs={12} md={12} sm={12} className="mt-3">
        {columns ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={true}
              primaryField={columns?.find((d) => d.field)}
              onClick={() => {
                // history.push(`${routes.rentalManagementDetail.path}/${data._id}`)
              }}
              dataRows={dataRows}
              selectedRecords={true}
              dispatch={dispatch}
              onEdit={() => {
                // history.push(`${routes.rentalManagementDetail.path}/${data._id}?openEdit=true`)
              }}
              extraParamsToCheckDelete={true}
              onDelete={() => {
                // setSingleRentalManagementDelete({
                //   show: true,
                //   id: data._id,
                //   rentalJobName: `${data.rentalJobName}`,
                // })
              }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              chips={[
                {
                  label: 'Status: ',
                  field: 'status'
                },
                {
                  label: 'Loading Ticket : ',
                  field: 'deliveryTicket',
                  onClick: (data) => history.push(`${routes.deliveryTicketDetail.path}/${data.deliveryTicketId}`)
                }
              ]}
              additionalDetails={
                [
                  // {
                  //   icon: <FaSuitcase size={18} />,
                  //   field: "customerAccount"
                  // },
                ]
              }
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={false}
              onClone={() => { }}
              renderedFrom={renderedFrom}
            />
          ) : (
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameworkComponents}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              allowSelection={repairJobData && repairJobData['status'] === REPAIR_JOB_STATUS.completed ? false : true}
              allowAction={false}
              loading={loading}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              rowClassRules={{
                'red-data-row': function (params) {
                  return [INVENTORY_STATUS.scrap, INVENTORY_STATUS.lost].some((s) => s === params.data.status);
                }
              }}
            />
          )
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Grid>
      {showRemoveAssetFromLoadingTicketDialog && (
        <ConfirmationDialog
          open={showRemoveAssetFromLoadingTicketDialog}
          message={`Are you sure you want to remove selected records from ${sidebarResource.deliveryTicket}(s) ?`}
          onClose={() => {
            setShowRemoveAssetFromLoadingTicketDialog(false);
          }}
          onOk={() => {
            setOkBtnLoading(true);

            const groupByCalls = groupBy(selectedRecords, 'deliveryTicketId');
            let apiCalls = [];

            Object.keys(groupByCalls).forEach((key) => {
              apiCalls.push(
                axiosInstance().put(`${deliveryTicket.deliveryTicketApi}/${key}/remove-assets`, { ids: groupByCalls[key].map((m) => m._id) })
              );
            });

            Promise.all(apiCalls)
              .then(() => {
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: `Selected records removed from assiged ${sidebarResource.deliveryTicket}(s)`
                });
                fetchRecords();
              })
              .catch((error) => {
                toastConfig.setToastConfig(error);
              })
              .finally(() => {
                setOkBtnLoading(false);
                setShowRemoveAssetFromLoadingTicketDialog(false);
              });
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {showDeliveryTicketDialog.open && (
        <ManageDeliveryTicket
          ticketType={DELIVERY_TICKET_TYPE.loading}
          refrenceType={DELIVERY_TICKET_REFRENCE_TYPE.repairJob}
          refrenceData={repairJobData}
          onClose={() => setShowDeliveryTicketDialog({ open: false, selectedAssets: [] })}
          productInventory={showDeliveryTicketDialog.selectedAssets}
          warehouseId={repairJobData?.plant?.optionValue ?? repairJobData?.warehouse?.optionValue}
          onSuccess={() => {
            setShowDeliveryTicketDialog({ open: false, selectedAssets: [] });
            fetchRecords();
          }}
        />
      )}
      {repairAssetDialog.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to complete repair of ${repairAssetDialog.assetId ? repairAssetDialog.assetName : 'selected asset(s)'} ?`}
          onClose={() => {
            setRepairAssetDialog({ open: false, assetId: null, assetName: null, assetIds: [] });
          }}
          onOk={() => {
            setOkBtnLoading(true);
            axiosInstance()
              .put(`${repairJob.repairJobApi}/${repairJobData._id}/assets-repaired`, {
                assets: repairAssetDialog.assetId ? [repairAssetDialog.assetId] : repairAssetDialog.assetIds,
                repaired: true
              })
              .then(({ data }) => {
                toastConfig.setToastConfig({
                  open: true,
                  type: 'success',
                  message: data.message
                });
                setOkBtnLoading(false);
                setRepairAssetDialog({ open: false, assetId: null, assetName: null, assetIds: [] });
                fetchRecords();
              })
              .catch((error) => {
                toastConfig.setToastConfig(error);
                setOkBtnLoading(false);
              });
          }}
          okBtnLoading={okBtnLoading}
        />
      )}
      {statusToUpdate.open && (
        <AssetScrapRepairDialog
          statusToUpdate={statusToUpdate}
          setStatusToUpdate={setStatusToUpdate}
          selectedRecords={selectedRecords}
          id={repairJobData._id}
          onClose={() => {
            setStatusToUpdate((prevState) => ({ ...prevState, open: false }));
          }}
          onSuccess={() => {
            fetchRecords();
          }}
        />
      )}
    </>
  );
};

export default RepairJobDeliveryTicket;
