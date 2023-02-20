import { Box, Button, Grid, IconButton, Menu, MenuItem } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import AddIcon from '@material-ui/icons/Add';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import routes from 'src/components/Helpers/Routes';
import { CHILD_RESOURCE, removeLocalStorage } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
import { genrateCustomTableColumns } from 'src/constants/columns';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import AddCostDialog from './AddCostDialog';
import ConfirmationDialogRaw from 'src/components/Helpers/ConfirmationDialog';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import useColumns from 'src/constants/useColumns';
import { isMobile, isTablet } from 'react-device-detect';
import DeleteIcon from '@material-ui/icons/Delete';
import { AiFillFilePdf } from 'react-icons/ai';
import { IoMdDownload } from 'react-icons/io';

const AddCost = ({ id, fieldTicketData, allowedToEdit }) => {
  const renderedFrom = camelCase(routes?.fieldTicket.title);
  const toastConfig = useContext(CustomToastContext);

  const [anchorEl, setAnchorEl] = useState(null);
  const {
    state: { permissions }
  }: any = useData();
  const [rowsData, setRowsData] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [columns, setColumns] = useState([]);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const [addDialog, setAddDialog] = useState({ open: false, data: null });
  const [allFields, setAllFields] = useState([]);
  const [downlodingFile, setDownlodingFile] = useState(null);
  const [generatingPdfFile, setGeneratingFile] = useState(false);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field/child?resource=${CHILD_RESOURCE.fieldTicketCost}`)
      .then(({ data: { data } }) => {
        data = CURReplaceByCurrencySingle(data, fieldTicketData?.currency || 'USD');
        setAllFields(data);
        const newColumns = genrateCustomTableColumns(data, fieldTicketData?.currency, renderedFrom);
        let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
        if (qtyIndex > -1) {
          newColumns[qtyIndex].accessor = 'qtyDisplay';
        }
        newColumns.forEach((element) => {
          if (element.accessor === 'qtyDisplay') {
            element['Footer'] = (info) => {
              const qtyTotal = info.rows
                .filter((f) => f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
                .reduce((sum, row) => row.values[element.accessor] + sum, 0);
              return <>{qtyTotal}</>;
            };
          }
        });
        let columns: any = [
          {
            accessor: 'index',
            Header: 'Index',
            width: 70,
            sticky: isMobile ? 'none' : 'left',
            Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
            Footer: () => {
              return <>Total</>;
            }
          }
        ];
        columns = [...columns, ...newColumns];
        columns.push({
          accessor: 'action',
          Header: 'Action',
          minWidth: 100,
          width: 100,
          sticky: 'right',
          disableFilters: true,
          canDrag: false,
          Cell: ({ row }) => (
            <Grid container spacing={1}>
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  setDeleteRecord(row.original);
                  setShowDeleteConfirmBox(true);
                }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Grid>
          )
        });
        setColumns(columns);
        fetchCostData();
      });
  };

  const fetchCostData = () => {
    axiosInstance()
      .get(`/field-ticket/${id}/cost`)
      .then(({ data }) => {
        let rows = data?.data.map((i, index) => {
          return { index: index + 1, ...i };
        });
        setRowsData(rows);
        setSelectedRecords([]);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`${routes?.fieldTicket?.path}/${id}/cost/remove`, { ids: ids })
      .then(({ data }) => {
        removeLocalStorage(localStorageSelectedRecords);
        fetchCostData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handlePDF = (type, PDFType) => {
  };

  const generateBase64forFile = (blobData, type) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data: any = reader.result;
      if (type === 'pdf') {
        const attachments = [
          {
            base64: base64data.substring(parseInt(base64data.indexOf(',') + 1)),
            contentType: base64data.split(';')[0].split(':')[1],
            name: `Invoice-${fieldTicketData.fieldTicektNumber}`
          }
        ];
      }
    };
  };

  useEffect(() => {
    fetchGridColumns();
  }, []);

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center">
          <Button
            variant={'outlined'}
            color="primary"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setAddDialog({ open: true, data: null })}
            aria-controls="add-menu"
          >
            {'Add Cost'}
          </Button>
        </Box>
        <Box display="flex">
          <Button
            variant="outlined"
            className="btn-outline-v1"
            color="primary"
            type="button"
            size="small"
            startIcon={isMobile && !isTablet ? '' : <AiFillFilePdf />}
            onClick={(e) => {
                handlePDF(downlodingFile, "Preview")
            }}
          >
            Preview
          </Button>
          <Box mx={0.5} />
          <Button
            className="btn-outline-v1"
            variant="outlined"
            color="primary"
            type="button"
            size="small"
            startIcon={<IoMdDownload />}
            onClick={(e) => {
                handlePDF(downlodingFile, "Download")
            }}
          >
           Downlaod
          </Button>
          <Box mx={0.5} />
          <Button
            disabled={selectedRecords.length ? false : true}
            variant={'outlined'}
            color="default"
            size="small"
            onClick={openActions}
            aria-controls="action-menu"
          >
            {'Actions'} <ExpandMore />
          </Button>
          <Menu
            anchorEl={anchorEl}
            keepMounted
            getContentAnchorEl={null}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            id="action-menu"
            open={Boolean(anchorEl)}
            onClose={closeActions}
          >
            <MenuItem
              disabled={!(selectedRecords?.length > 0 && selectedRecords?.length)}
              onClick={() => {
                closeActions();
                // eslint-disable-next-line no-lone-blocks
                {
                  selectedRecords.length === 1 && setDeleteRecord(selectedRecords[0]);
                }
                setShowDeleteConfirmBox(true);
              }}
            >
              Delete
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      {columns && rowsData ? (
        <Box p="6px" zIndex={5} width={'100%'}>
          <CustomReactTable
            height={'calc(100vh - 345px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
            onSelect={setSelectedRecords}
            childrenProperty="subRows"
            uniqueKey="_id"
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            hideSelection={false}
            hideAction={false}
          />
        </Box>
      ) : (
        <Box p={2} height={500} bgcolor="white">
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialogRaw
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete Cost  ${deleteRecord?.description || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {addDialog.open && (
        <AddCostDialog
          onClose={() => setAddDialog({ open: false, data: null })}
          onSuccess={() => {
            setAddDialog({ open: false, data: null });
            fetchCostData();
          }}
          fieldTicketData={fieldTicketData}
          costData={addDialog.data}
        />
      )}
    </Fragment>
  );
};

export default AddCost;
