import Box from '@material-ui/core/Box/Box';
import { useState, useEffect, useContext } from 'react';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import routes from '../../../components/Helpers/Routes';
import Grid from '@material-ui/core/Grid/Grid';
import axiosInstance from 'src/axios/axiosInstance';
import { prepareDataForGrid } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { Button, IconButton, Menu, MenuItem, Tab, Tabs, TextField } from '@material-ui/core';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import DeleteIcon from '@material-ui/icons/Delete';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import { useData } from 'src/StateProvider/Provider';
import { BiChevronDown } from 'react-icons/bi';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile } from 'react-device-detect';
import { flattenArray } from 'src/constants/columns';
import { Autocomplete } from '@material-ui/lab';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import Technicians from './Technicians';

const Consumables = ({ id, allowedToEdit, services, stepFullScreen = false, fieldTicketData }) => {
  const toastConfig = useContext(CustomToastContext);
  const [dataRows, setDataRows] = useState(null);
  const [columns, setColumns] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [consumablesDialog, setConsumablesDialog] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [serviceOption, setServiceOption] = useState(null);
  const [selectedServiceOption, setSelectedServiceOption] = useState(null);

  useEffect(() => {
    setServiceOption([{ optionLabel: 'All', optionValue: 'All' },
    ...services?.map((s) => {
      return {
        optionLabel: s?.detail,
        optionValue: s?.materialId,
        _id: s?._id
      };
    })]);
    if (!services?.some((s) => s?.materialId === selectedServiceOption?.optionValue)) {
      setSelectedServiceOption(null);
    }
  }, [services]);

  const {
    state: { user }
  }: any = useData();

  useEffect(() => {
    fetchColumns();
  }, [id]);

  useEffect(() => {
    if (columns) {
      fetchData();
    }
  }, [columns, services, selectedServiceOption]);

  const fetchColumns = async () => {
    const column = [];
    const {
      data: { data }
    } = await axiosInstance().put(`/field/find-field-labels`, {
      fields: [
        {
          resource: 'Product',
          fieldNames: ['productName', 'productNumber', 'productDescription']
        }
      ]
    });
    const productFields = data?.find((e) => e.resource === 'Product')?.fieldNames || [];
    productFields?.forEach((e) => {
      if (e?.fieldName === 'productName') {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          primaryField: true,
          Cell: ({ row }) => {
            return row.original[e?.fieldName] ? (
              <a className="link text-truncate" href={`${routes.productDetail.path}/${row.original?.materialId}`} target="_blank">
                {row.original[e?.fieldName]}
              </a>
            ) : (
              <NoDataCell />
            );
          }
        });
      } else {
        column.push({
          accessor: e?.fieldName,
          Header: e?.fieldLabel,
          width: 200,
          Cell: ({ row }) => {
            return row.original[e?.fieldName] ? <p className="text-truncate">{row.original[e?.fieldName]}</p> : <NoDataCell />;
          }
        });
      }
    });

    const extracolumns: any = [
      {
        accessor: 'service',
        Header: 'Service',
        width: 200,
        Cell: ({ row }) =>
          row?.original?.service ? (
            <p className="text-truncate" title={row?.original?.service}>
              <a className="link text-truncate" href={`${routes.serviceMasterDetail.path}/${row.original.serviceId}`} target="_blank">
                {row.original.service}
              </a>
            </p>
          ) : (
            <NoDataCell />
          )
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        primaryField: true,
        editable: allowedToEdit,
        width: 150,
        Cell: ({ row }) => <p className="text-truncate">{row?.original?.qty || <NoDataCell />}</p>,
        Footer: (info) => {
          const total = info.rows
            .filter((f) => f.values.hasOwnProperty('qty') && !isNaN(f.values['qty']))
            .reduce((sum, row) => parseInt(row.values['qty']) + sum, 0);
          return <>{total}</>;
        }
      },
      {
        accessor: 'action',
        Header: 'Action',
        width: 150,
        minWidth: 150,
        sticky: 'right',
        disableFilters: true,
        canDrag: false,
        Cell: ({ row }: any) => (
          <HtmlTooltip title={'Delete'}>
            <span>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={!allowedToEdit}
                onClick={() => {
                  setDeleteData([{ id: row.original._id }]);
                }}
              >
                <DeleteIcon fontSize="small" color={allowedToEdit ? 'error' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        )
      }
    ];

    setColumns([
      {
        accessor: 'srno',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      ...column,
      ...extracolumns
    ]);
  };

  const fetchData = async () => {
    setDataRows(null);
    let api = `/field-ticket/${id}/material?type=product`;
    if (selectedServiceOption && selectedServiceOption?.optionValue !== 'All') {
      api = `${api}&serviceId=${selectedServiceOption?.optionValue}`;
    }
    axiosInstance()
      .get(api)
      .then(({ data: { data } }) => {
        let rows = data?.material?.map((u, i) => {
          let res: any = {
            ...prepareDataForGrid(u)
          };
          res.srno = i + 1;
          res.productName = u?.productDetail?.productName;
          res.productDescription = u?.productDetail?.productDescription;
          res.productNumber = u?.productDetail?.productNumber;
          return res;
        });
        setDataRows(rows);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSubmit = async (rows) => {
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = 'product';
      element.qty = d.qty ? parseFloat(d.qty) : 1;

      material.push(element);
    });

    axiosInstance()
      .post(`/field-ticket/${id}/material`, { material })
      .then(() => {
        setConsumablesDialog(false);
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = async (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`/field-ticket/${id}/material/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    rows.forEach((element) => {
      element.pricingCondition = element.pricingCondition?.optionValue ? element.pricingCondition?.optionValue : element.pricingCondition; // temporary fix
      element.service = element.serviceId;
      delete element.srno;
      delete element.productDescription;
      delete element.productName;
      delete element.productNumber;
      delete element.serviceId;
    });
    // setUpdating(true);
    axiosInstance()
      .put(`/field-ticket/${id}/material`, { material: rows })
      .then(() => {
        fetchData();
        if (saveAndNext) {
          const rowIndex = dataRows?.findIndex((d) => d._id === rows[0]?._id);
          // setIsServiceEdit({ open: true, data: rowsData[rowIndex + 1], showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false });
        } else {
          // setIsServiceEdit({ open: false, data: null, showSaveAndNext: false });
        }
        // setUpdating(false);
        // setIsBulkEdit(false);
      })
      .catch((error) => {
        // setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const dataRow = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    if (parseInt(inputField.qty) === 0) {
      toastConfig.setToastConfig({
        open: true,
        type: 'error',
        message: 'Qty can not be 0'
      });
      return;
    }
    let rows: any = [{ ...dataRow, ...updatedData }];
    inputField.qty = parseInt(inputField.qty);
    handleSaveData(rows);
  };

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      {allowedToEdit && serviceOption?.length > 0 && (
        <Box style={{ maxWidth: '400px' }} mb={3}>
          <Autocomplete
            size="small"
            style={{ minWidth: '300px' }}
            fullWidth
            options={serviceOption ? serviceOption : []}
            autoHighlight
            value={selectedServiceOption ? selectedServiceOption : { optionLabel: 'All', optionValue: 'All' }}
            getOptionLabel={(option: any) => option?.optionLabel || ''}
            getOptionSelected={(option, val) => (option ? option?.optionLabel === val?.optionLabel : false)}
            onChange={(_, val) => setSelectedServiceOption(val)}
            renderInput={(params) => <TextField {...params} label={'Select Service'} variant="outlined" />}
          />
        </Box>
      )}
      <CustomTabs value={tabValue} onChange={handleMainTabChange} style={{ marginBottom: -1 }}>
        <CustomTab index={0} label={'Products/Consumables'} value={0} primaryColor={true} />
        <CustomTab index={1} label={'Technicians'} value={1} primaryColor={true} />
      </CustomTabs>

      <TabPanel value={tabValue} index={0}>
        <Box className="container-with-border" p={2} style={{ WebkitBorderTopLeftRadius: 0, borderTopRightRadius: 0 }}>
          {allowedToEdit && (
            <Box display="flex" justifyContent="space-between" mb={2}>
              <Box display="flex" gridGap={'8px'} flexWrap={'wrap'}>
                <Button variant="outlined" color="primary" size="small" onClick={() => setConsumablesDialog(true)}>
                  Add
                </Button>
              </Box>
              <Box display="flex" ml={1}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="small"
                  id="demo-positioned-button"
                  onClick={handleClick}
                  disabled={!Boolean(selectedRecords?.length)}
                  endIcon={<BiChevronDown />}
                  className="new-dropdown-v1"
                >
                  Actions
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  keepMounted
                  open={open}
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
                  <HtmlTooltip title={Boolean(selectedRecords.length) ? 'Delete selected records' : 'Select records to delete'}>
                    <MenuItem
                      disabled={isDeleting}
                      onClick={() => {
                        setDeleteData(
                          selectedRecords?.map((d) => {
                            return {
                              id: d?._id
                            };
                          })
                        );
                        handleClose();
                      }}
                    >
                      Delete
                    </MenuItem>
                  </HtmlTooltip>
                </Menu>
              </Box>
            </Box>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} md={12} sm={12}>
              {columns && dataRows ? (
                <CustomReactTable
                  height={stepFullScreen ? 'calc(100vh - 440px)' : '278px'}
                  columns={columns}
                  data={dataRows}
                  onSelect={setSelectedRecords}
                  childrenProperty="subRows"
                  uniqueKey="_id"
                  onSaveEdit={onSaveInlineEdit}
                  renderedFrom={'fieldTicket_consumables'}
                  isClientSideGrid={true}
                  hideExpander={true}
                  hideSelection={!allowedToEdit}
                  hideAction={!allowedToEdit}
                />
              ) : (
                <Box p={2} height={500}>
                  <CommonSkeleton lenArray={[...Array(10).keys()]} />
                </Box>
              )}
            </Grid>
          </Grid>
        </Box>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Technicians id={id} allowedToEdit={allowedToEdit} stepFullScreen={stepFullScreen} fieldTicketData={fieldTicketData} selectedService={selectedServiceOption} />
      </TabPanel>

      {consumablesDialog && (
        <AssignProductDialog
          productsDialogOpen={consumablesDialog}
          productId={id}
          reference={'fieldTicket'}
          handleCloseDialog={() => setConsumablesDialog(false)}
          assignedProducts={dataRows?.map((d) => d?.materialId)}
          onSuccess={(rows) => {
            handleSubmit(rows);
          }}
          serialized={false}
        />
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
    </>
  );
};

export default Consumables;
