import Box from "@material-ui/core/Box/Box";
import { useState, useEffect, useReducer, useContext } from "react";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import CustomAgGrid, { intialState, reducer } from "../../components/AgGridComponents/CustomAgGrid";
import { CommonRenderer } from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import { Link } from 'react-router-dom'
import routes from "../../components/Helpers/Routes";
import Grid from "@material-ui/core/Grid/Grid";
import { Button, IconButton, Tooltip } from "@material-ui/core";
import { AiFillFilePdf } from "react-icons/ai";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { deliveryTicket, gridLoadingTimeout, rentalManagement, repairJob, repairJobStatus, sidebarResource } from "../../constants/helpers";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import { groupBy } from 'lodash';
import AddBoxRoundedIcon from '@material-ui/icons/AddBoxRounded';
import RemoveCircleRoundedIcon from '@material-ui/icons/RemoveCircleRounded';
import ManageDeliveryTicket from '../DeliveryTicket/ManageDeliveryTicket';
import { isMobile } from "react-device-detect";
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import HtmlTooltip from '../../components/CustomTooltipTitle';
import InfoIcon from "@material-ui/icons/Info";
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import CheckCircleIcon from '@material-ui/icons/CheckCircle';

const renderedFrom = "repairJob_delivery_ticket"

const RepairJobDeliveryTicket = ({ repairJobData, setNextButtonDisabled, setPreviousButtonDisabled, hideReceivingTicketStep }) => {
  const toastConfig = useContext(CustomToastContext);

  const [gridApi, setGridApi] = useState(null);
  const [assignedSerializedAsset, setAssignedSerializedAsset] = useState([]);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, selectedRecords } = state;
  const [downlodingFile, setDownlodingFile] = useState(false)
  const [showRemoveAssetFromLoadingTicketDialog, setShowRemoveAssetFromLoadingTicketDialog] = useState(false)
  const [okBtnLoading, setOkBtnLoading] = useState(false)
  const [showDeliveryTicketDialog, setShowDeliveryTicketDialog] = useState({ open: false, selectedAssets: [] });
  const [repairAssetDialog, setRepairAssetDialog] = useState({ open: false, assetId: null, assetName: null, assetIds: [] })

  const [showActions, setShowActions] = useState(repairJobData["typeOfRepair"] === "Internal" && repairJobData["plant"] !== repairJobData["repairPlant"])

  useEffect(() => {
    // if (productInventory.length > 0) {
    fetchRecords();
    // }
    // eslint-disable-next-line
  }, []);

  const handleDeliveryTicketDialog = (selectedAssets) => {
    setShowDeliveryTicketDialog({ open: true, selectedAssets: selectedAssets })
  }

  const fetchRecords = () => {
    if (gridApi) {
      gridApi.deselectAll();
    }

    localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));

    dispatch({
      type: "initialize", data: [], count: 0
    });

    axiosInstance().get(`${repairJob.repairJobApi}/${repairJobData._id}/get-assets`)
      .then(({ data }) => {
        setAssignedSerializedAsset(data.data)
        let tempProductInventory = data.data.map(u => ({ ...u, _id: u?.id, productName: u?.product?.optionLabel, repaired: u?.repaired ?? false, isDelivered: false }))

        if (repairJobData["typeOfRepair"] === "Internal" && repairJobData["plant"]?.optionValue !== repairJobData["repairPlant"]?.optionValue) {
          tempProductInventory.forEach((obj) => {
            obj["typeOfRepair"] = repairJobData["typeOfRepair"];
            obj["plant"] = obj["typeOfRepair"] === "Internal" ? repairJobData["plant"]?.optionValue : "";
            obj["repairPlant"] = obj["typeOfRepair"] === "Internal" ? repairJobData["repairPlant"]?.optionValue : "";
          })
        }

        dispatch({ type: "loading", loading: true });
        axiosInstance()
          .get(`${repairJob.repairJobApi}/${repairJobData._id}/delivery-ticket`)
          .then(({ data }) => {

            // let disableNextButtonIfNonDeliveredFound = true;

            // data.data.map(obj => {
            //   if (obj.ticketType === "Loading") {
            //     productAssets.map((d, index) => {
            //       if (obj?.productInventory?.some(p => d?._id === p?.optionValue)) {
            //         productAssets[index]["type"] = obj?.type
            //         productAssets[index]["deliveryTicket"] = obj?.ticketName
            //         productAssets[index]["deliveryTicketId"] = obj?._id
            //       }
            //     })
            //   }
            // })

            data.data.map(obj => {
              if (obj.ticketType === "Loading") {
                tempProductInventory.map((d, index) => {
                  if (obj?.productInventory?.some(p => d?._id === p?.optionValue)) {
                    tempProductInventory[index]["type"] = obj?.type
                    tempProductInventory[index]["deliveryTicket"] = obj?.ticketName;
                    tempProductInventory[index]["deliveryTicketId"] = obj?._id
                    tempProductInventory[index]["isDelivered"] = obj?.status === "Delivered";
                  }
                })
              }
            })

            setShowActions(!data.data.some(s => s["ticketType"] === "Receiving"));

            tempProductInventory.forEach((d) => {
              d["_id"] = d["id"];
              d["hideSelection"] = d.status === "In-Transit"; // || (d.hasOwnProperty("isDelivered") && d["isDelivered"] === true) || d["repaired"];
            })

            if (repairJobData["typeOfRepair"] === "Internal" && repairJobData["plant"]?.optionValue !== repairJobData["repairPlant"]?.optionValue && tempProductInventory.some(s => s["repaired"] === true)) {
              hideReceivingTicketStep(true);

              if (tempProductInventory.some(f => f["repaired"] === true)) {
                setNextButtonDisabled(!tempProductInventory.every(e => e.hasOwnProperty("isDelivered") && e.isDelivered === true && e.repaired === true));
              }


              // setNextButtonDisabled(!tempProductInventory.filter(f => f["repaired"] === false).every(e => e.hasOwnProperty("isDelivered") && e.isDelivered === true));
            } else {
              setNextButtonDisabled(!tempProductInventory.every(e => e.hasOwnProperty("isDelivered") && e.isDelivered === true));
            }

            // setNextButtonDisabled(tempProductInventory.some(s => ["Repair", "Scrap", "Lost"].indexOf(s.status) === -1));
            // setPreviousButtonDisabled(tempProductInventory.some(s => s["deliveryTicketId"]));

            dispatch({
              type: "initialize", data: [...tempProductInventory], count: tempProductInventory.length
            });
            setTimeout(() => {
              dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
          });
      }).catch((error) => {
        toastConfig.setToastConfig(error)
      });
  }

  const TicketRenderer = (params) => (
    params?.value ? (
      <Link className="link text-truncate" title={params.value} to={`${routes.deliveryTicketDetail.path}/${params.data.deliveryTicketId}`}>
        {params.value}
      </Link>
    ) : (
      <NoDataCell />
    )
  );

  const InventoryRenderer = (params) => (
    <span className="d-flex gap-2 align-items-center">
      <Link className="link text-truncate" title={params.value} to={`${routes.productInventoryDetail.path}/${params.data._id}`}>
        {params.value}
      </Link>

      {
        params.data.repaired && <HtmlTooltip title="Repaired">
          <CheckCircleIcon color="primary" fontSize="small" />
        </HtmlTooltip>
      }
    </span>
  );

  const ProductNameRenderer = (params) => (
    params.data?.product?.optionValue ? <Link className="link text-truncate" title={params.value} to={`${routes.productDetail.path}/${params.data?.product?.optionValue}`}>
      {params.value}
    </Link>
      : <NoDataCell />
  );

  const ActionsRenderer = (params) => {
    return params.data["isDelivered"] && !params.data["repaired"] && <HtmlTooltip title="Repair Asset">
      <IconButton
        size="small"
        aria-label="Repair Asset"
        color="primary"
        onClick={() => {
          setRepairAssetDialog({ open: true, assetId: params.data._id, assetName: params.data.assetNumber, assetIds: [] })
        }}
      >
        <CheckCircleOutlineIcon fontSize="small" />
      </IconButton>
    </HtmlTooltip>
  }

  const frameworkComponents = {
    inventoryRenderer: InventoryRenderer,
    ticketRenderer: TicketRenderer,
    productNameRenderer: ProductNameRenderer,
    commonRenderer: CommonRenderer,
    actionsRenderer: ActionsRenderer
  };

  const columns = [
    { field: "assetNumber", headerName: "Asset Number", show: true, cellRenderer: "inventoryRenderer" },
    { field: "serialNumber", headerName: "Serial Number", show: true, cellRenderer: "commonRenderer" },
    { field: "type", headerName: "Type", show: true, disabled: true, cellRenderer: "commonRenderer" },
    { field: "deliveryTicket", headerName: "Loading Ticket", show: true, cellRenderer: "ticketRenderer" },
    { field: "productName", headerName: "Product Description", show: true, disabled: true, cellRenderer: "productNameRenderer" },
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

  return (<>

    <Box display="flex" justifyContent="flex-end" className="gap-1 px-2">
      <Button
        onClick={() => {
          setDownlodingFile(true);

          axiosInstance().get(`/repair-job/${repairJobData._id}/pdf`)
            .then(({ data }) => {
              axiosInstance()
                .get(`user/download?fileName=${data.data.fileName}`, {
                  responseType: "blob",
                })
                .then(({ data }) => {
                  const file = new Blob([data], { type: "application/pdf" });
                  const fileURL = URL.createObjectURL(file);
                  const pdfWindow = window.open();
                  pdfWindow.location.href = fileURL;
                  toastConfig.setToastConfig({ open: true, type: "success", message: "Preview file downloaded successfully." })
                  setDownlodingFile(false);
                })
                .catch((err) => {
                  toastConfig.setToastConfig(err);
                  setDownlodingFile(false);
                });
            }).catch((err) => {
              toastConfig.setToastConfig(err);
              setDownlodingFile(false);
            })
        }}
        variant="outlined"
        color="primary"
        type="button"
        size="small"
        disabled={downlodingFile}
        startIcon={<AiFillFilePdf />}
      >
        {downlodingFile ? "Please wait..." : "Preview"}
      </Button>

      {
        showActions && <Button
          variant="contained"
          color="primary"
          type="button"
          size="small"
          disabled={selectedRecords.length === 0 || selectedRecords.some(s => s.repaired === true) || !selectedRecords.some(s => s["isDelivered"] && !s["repaired"])}
          onClick={() => {
            setRepairAssetDialog({ open: true, assetId: null, assetName: null, assetIds: [...selectedRecords.map(m => m._id)] })
          }}
        >
          Complete Repair
        </Button>
      }

      {
        repairJobData && repairJobData["status"] !== repairJobStatus[2] &&
        <IconButton
          disabled={selectedRecords.length === 0 || selectedRecords.some(f => f.hasOwnProperty("deliveryTicketId")) || selectedRecords.some(f => f.repaired === true)}
          onClick={() => {
            handleDeliveryTicketDialog(selectedRecords)
          }}
          color='primary'
          size="small"
        >
          <Tooltip
            title="Create Loading Ticket">
            <AddBoxRoundedIcon />
          </Tooltip>
        </IconButton>
      }

      {
        repairJobData && repairJobData["status"] !== repairJobStatus[2] &&
        <IconButton
          disabled={selectedRecords.length === 0 || selectedRecords.some(f => f.hasOwnProperty("isDelivered")) || selectedRecords.some(f => !f.hasOwnProperty("deliveryTicketId")) || selectedRecords.some(f => f.repaired === true)}
          onClick={() => {
            setShowRemoveAssetFromLoadingTicketDialog(true)
          }}
          color='primary'
          size="small"
        >
          <Tooltip
            title="Remove Assets From Loading Ticket(s)">
            <RemoveCircleRoundedIcon />
          </Tooltip>
        </IconButton>
      }

      {/* <Button
        variant="contained"
        color="primary"
        type="button"
        size="small"
        disabled={(selectedRecords.length === 0) || currentStep === 4 || (selectedRecords.some(f => !f.hasOwnProperty("deliveryTicketId")))}
        onClick={() => {
          setShowRemoveAssetFromLoadingTicketDialog(true)
        }}
      >
        Remove From Assigned Loading Tickets
      </Button> */}

    </Box>

    <Grid item xs={12} md={12} sm={12} className="mt-3">

      {columns ?
        isMobile ?
          <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={true}
            primaryField={columns?.find(d => d.field)}
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
                label: "Product Desc. : ",
                field: "productName",
              }
            ]}
            additionalDetails={[
              // {
              //   icon: <FaSuitcase size={18} />,
              //   field: "customerAccount"
              // },
            ]}
            owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
            onCreate={false}
            showClone={false}
            onClone={() => { }}
            renderedFrom={renderedFrom}
          /> :
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
            allowSelection={repairJobData && repairJobData["status"] === repairJobStatus[2] ? false : true}
            allowAction={showActions}
            loading={loading}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
          />
        : <Box p={2} height={500} bgcolor="white"><CommonSkeleton lenArray={[...Array(10).keys()]} /></Box>

      }
    </Grid>

    {
      showRemoveAssetFromLoadingTicketDialog && (
        <ConfirmationDialog
          open={showRemoveAssetFromLoadingTicketDialog}
          message={`Are you sure you want to remove selected records from ${sidebarResource.deliveryTicket}(s) ?`}
          onClose={() => {
            setShowRemoveAssetFromLoadingTicketDialog(false);
          }}
          onOk={() => {
            setOkBtnLoading(true);

            const groupByCalls = groupBy(selectedRecords, "deliveryTicketId");
            let apiCalls = [];

            Object.keys(groupByCalls).forEach((key) => {
              apiCalls.push(axiosInstance().put(`${deliveryTicket.deliveryTicketApi}/${key}/remove-assets`, { ids: groupByCalls[key].map(m => m._id) }));
            })

            Promise.all(apiCalls).then(() => {
              toastConfig.setToastConfig({ open: true, type: "success", message: `Selected records removed from assiged ${sidebarResource.deliveryTicket}(s)` });
              fetchRecords();
            }).catch((error) => {
              toastConfig.setToastConfig(error);
            }).finally(() => {
              setOkBtnLoading(false);
              setShowRemoveAssetFromLoadingTicketDialog(false);
            });

          }}
          okBtnLoading={okBtnLoading}
        />
      )
    }

    {
      showDeliveryTicketDialog.open &&
      <ManageDeliveryTicket
        ticketType="Loading"
        refrenceType="Repair Job"
        refrenceData={repairJobData}
        onClose={() => setShowDeliveryTicketDialog({ open: false, selectedAssets: [] })}
        productInventory={showDeliveryTicketDialog.selectedAssets}
        warehouseId={repairJobData?.plant?.optionValue ?? repairJobData?.warehouse?.optionValue}
        onSuccess={() => {
          setShowDeliveryTicketDialog({ open: false, selectedAssets: [] })
          fetchRecords();
        }}
      />
    }

    {
      repairAssetDialog.open && <ConfirmationDialog
        open={true}
        message={`Are you sure you want to complete repair of ${repairAssetDialog.assetId ? repairAssetDialog.assetName : "selected asset(s)"} ?`}
        onClose={() => {
          setRepairAssetDialog({ open: false, assetId: null, assetName: null, assetIds: [] })
        }}
        onOk={() => {
          setOkBtnLoading(true)
          axiosInstance().put(`${repairJob.repairJobApi}/${repairJobData._id}/assets-repaired`, { assets: repairAssetDialog.assetId ? [repairAssetDialog.assetId] : repairAssetDialog.assetIds, repaired: true }).then(({ data }) => {
            toastConfig.setToastConfig({
              open: true,
              type: "success",
              message: data.message,
            });
            setOkBtnLoading(false)
            setRepairAssetDialog({ open: false, assetId: null, assetName: null, assetIds: [] });
            fetchRecords();
          }).catch((error) => {
            toastConfig.setToastConfig(error);
            setOkBtnLoading(false)
          })
        }}
        okBtnLoading={okBtnLoading}
      />
    }

  </>
  );
}

export default RepairJobDeliveryTicket;

