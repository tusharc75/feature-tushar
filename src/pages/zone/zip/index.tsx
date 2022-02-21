import React from 'react';
import { Box, Button, IconButton } from '@material-ui/core';
import AddConfigurationDialog from '../../Product/ProductConfiguration/AddConfigurationDialog';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid } from '../../../constants/helpers';
import CarouselDialog from '../../../components/CarouselDialog';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import { Link, useParams } from "react-router-dom"
import { CommonRenderer } from "../../../components/AgGridComponents/CustomAgGridCellRenderers"
import { Delete, Edit } from '@material-ui/icons';
import CreateZip from "../CreateZip";
import { read, utils, writeFile } from "xlsx";
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import DeleteButton from '../../../components/Helpers/DeleteButton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../../constants/useColumns';

interface ConfigProps {
  id: string;
}

const Zipcode = (props: ConfigProps) => {
  const { id } = props;
  const { setToastConfig, toastConfig } = React.useContext(CustomToastContext)
  const [openDialog, setOpenDialog] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [showConfirmBox, setShowConfirmBox] = React.useState({
    open: false,
    zips: []
  });
  const [columns, setColumns] = React.useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = React.useState({});
  const localStorageSelectedRecords = `zip_selected`;
  const [carouselDialog, setCarouselDialog] = React.useState({
    open: false,
    images: [],
    index: 0
  });
  const [section, setSection] = React.useState(null);
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading: gridLoading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;


  React.useEffect(() => {
    fetchGridColumns();
    getZipData();
  }, [])

  const ActionRenderer = (params) => (
    <>
      <IconButton
        size="small"
        color="inherit"
        onClick={() => {
          setShowConfirmBox({
            open: true,
            zips: [params.data.zipCode]
          });
        }}
      >
        <Delete color="error" fontSize="small" />
      </IconButton>
    </>
  );


  const ZipNameRenderer = (params) => (
    <>
      {params.value}
    </>
  )



  const fetchGridColumns = () => {
    axiosInstance()
      .get('/field?resource=Zone')
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          zipNameRenderer: ZipNameRenderer,
          actionsRenderer: ActionRenderer,
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([{ field: 'zipCode', headerName: 'Zip Code', show: true, cellRenderer: 'zipNameRenderer' }]);
      });
  };


  const getZipData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes.zone.path}/${id}/zip`)
      .then(({ data: { data, count } }) => {
        setSection(data);
        const rows = data.map((d, index) => {
          let finalObject = prepareDataForGrid(d);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === d._id);
          finalObject['_id'] = index;

          return { ...finalObject };
        });
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: rows.length,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: rows.length,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
        }
        if (gridApi) {
          try {
            let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords)
              ? JSON.parse(localStorage.getItem(localStorageSelectedRecords))
              : [];
            if (oldSelectedRecords === null) {
              gridApi.forEachNode(function (node) {
                node.setSelected(oldSelectedRecords.some((o) => o === node.data.id));
              });
            }
          } catch (ex) {
            console.error('Error in getting selected records from local storage');
          }
        }
        dispatch({ type: 'initialize', data: rows, count: rows?.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };


  const AddZip = (newZipCode: Array<any>) => {
    let newValues = { zoneZips: newZipCode };
    axiosInstance()
      .post(`/zone/${id}/zip`, newValues)
      .then(({ data: { data } }) => {
        setToastConfig({
          open: true,
          type: 'success',
          message: 'Zip Code imported Successfully'
        });
        getZipData();
      })
      .catch((error) => {
        setToastConfig(error);
      });
  }

  const removeData = () => {
    setRemoving(true);
    axiosInstance()
      .put(`${routes.zone.path}/${id}/zip/remove`, {
        zips: showConfirmBox.zips
      })
      .then(() => {
        setShowConfirmBox({
          open: false,
          zips: []
        });
        getZipData();
        setRemoving(false);
        setToastConfig('Zipcode removed successfully');
      })
      .catch((err) => {
        setShowConfirmBox({
          open: false,
          zips: []
        });
        setRemoving(false);
        setToastConfig(err)
      });
  };

  const handleExportFields = () => {
    const header = ['Zip Code']
    var ws = utils.json_to_sheet(section);
    if (header.length) {
      utils.sheet_add_aoa(ws, [header]);
    }
    var wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Sheet1");
    writeFile(wb, `Zip Code.xlsx`);
  };

  const handleImportFields = (e) => {
    e.preventDefault();
    var files = e.target.files,
      f = files[0];
    var reader = new FileReader();
    reader.onload = function (e) {
      var data: any = e.target.result;
      let readedData = read(data, { type: "binary" });
      const wsname = readedData.SheetNames[0];
      const ws = readedData.Sheets[wsname];
      const dataParse = utils.sheet_to_json(ws, { header: 1 });
      let zipCode = dataParse.slice(1, dataParse?.length);
      let newZipCode = zipCode.map((item, i) => {
        return item[0]
      })
      AddZip(newZipCode)
    };
    reader.readAsBinaryString(f);
  };


  return (
    <Box>
      <Box display="flex" justifyContent="space-between" >
        <Box mr={2} component={'div'}>
          <Button style={{ marginTop: "20px",marginLeft:"20px" }} onClick={() => setOpenDialog(true)} size="small" variant="contained" color="primary" disableElevation>
            Add Zip Code
          </Button>

        </Box>
        <Box p={2} display="flex" justifyContent="space-between" style={{ marginLeft: "" }}>
          <Box mt={1}> <label style={{ color: "#0E49B5" }}>Import from Excel |
            <input
              onClick={(e: any) => (e.target.value = null)}
              id="importField"
              name="importField"
              onChange={handleImportFields}
              style={{
                opacity: "0",
                position: "absolute",
                zIndex: -1,
              }}
              type="file"
            /></label>
            <label style={{ color: "#0E49B5" }} onClick={handleExportFields}> Export to Excel</label> <a id="downloadAnchorElem" style={{ display: "none" }}></a></Box>

          <DeleteButton
            onClick={() => {
              setShowConfirmBox({
                open: true,
                zips: selectedRecords.map((s) => s.zipCode)
              });
            }}
            size="small"
            disabled={selectedRecords.length === 0}
            disableElevation
            text={'Delete'}
            style={{ marginLeft: '10px' }}
          />

        </Box>
      </Box>
      <Box>
        {Object.keys(frameWorkComponent).length > 0 && (
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameWorkComponent}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            actionWidth={150}
            loading={gridLoading}
            isClientSideGrid
            renderedFrom="zone"
            refreshGrid={getZipData}
          />
        )}
      </Box>
      {openDialog && (
        <CreateZip
          isUpdateDisaCreateProductCategorybled={false}
          zoneId={id}
          isClone={false}
          onClose={() => setOpenDialog(false)}
          onSuccess={() => {
            setOpenDialog(false)
            getZipData();
          }

          }
        />
      )}
      {carouselDialog.open && (
        <CarouselDialog
          index={carouselDialog.index}
          close={() => {
            setCarouselDialog({
              open: false,
              images: [],
              index: 0
            });
          }}
          images={carouselDialog.images}
        />
      )}
      {showConfirmBox.open && (
        <ConfirmationDialog
          open={true}
          okBtnLoading={removing}
          message={`Are you sure you want to delete?`}
          onClose={() => {
            setShowConfirmBox({
              open: false,
              zips: []
            });
          }}
          onOk={removeData}
        />
      )}
    </Box>
  );
};
export default Zipcode;
