import React from 'react';
import { Box, Button, IconButton } from '@material-ui/core';
import AddConfigurationDialog from '../../Product/ProductConfiguration/AddConfigurationDialog';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid } from '../../../constants/helpers';
import CarouselDialog from '../../../components/CarouselDialog';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import {Link} from "react-router-dom"
import {CommonRenderer} from "../../../components/AgGridComponents/CustomAgGridCellRenderers"
import { Delete, Edit } from '@material-ui/icons';
import CreateZip from "../CreateZip";
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import DeleteButton from '../../../components/Helpers/DeleteButton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import useColumns, { getStaticFields, getFrameworkComponents } from '../../../constants/useColumns';

interface ConfigProps {
  id: string;
}

  const Zipcode = (props: ConfigProps) => {
  const initialRender = React.useRef(true);
  const {id} = props;
  const {setToastConfig,toastConfig} = React.useContext(CustomToastContext)
  const [specFields, setSpecFields] = React.useState([]);
  const [configData, setConfigData] = React.useState([]);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [showConfirmBox, setShowConfirmBox] = React.useState({
    open: false,
    ids: []
  });
  const [columns, setColumns] = React.useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = React.useState({});
  const localStorageSelectedRecords = `${routes.productCategory.title}_selected`;
  const [carouselDialog, setCarouselDialog] = React.useState({
    open: false,
    images: [],
    index: 0
  });
  const [editConfig, setEditConfig] = React.useState({
    values: {},
    images: []
  });
  const { getColumnData } = useColumns();
  const [gridApi, setGridApi] = React.useState(null);
  const [state, dispatch] = React.useReducer(reducer, intialState);
  const { dataRows, rowCount, loading: gridLoading, page, limit, pageSizes, search, filters, sorting, selectedRecords,appendRows } = state;

  React.useEffect(()=> {
    fetchGridColumns();
      getZipData();
  },[])




  const ActionRenderer = (params) => (
    <>
      {/* <IconButton size="small" color="inherit" onClick={() => editData(params.data)}>
        <Edit fontSize="small" />
      </IconButton> */}
      <IconButton
        size="small"
        color="inherit"
        onClick={() => {
          setShowConfirmBox({
            open: true,
            ids: [params.data.id]
          });
        }}
      >
        <Delete color="error" fontSize="small" />
      </IconButton>
    </>
  );


  const ZipNameRenderer =(params) => (
    <>
    <Link className="link" to="/zip">  {params.value}</Link>
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

        setColumns([{field:'zipCode',headerName:'Zip Code',show:true,cellRenderer:'zipNameRenderer'}]);
      });
  };


  const getZipData = () => {
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes.zone.path}/${id}/zip`)
      .then(({ data: { data,count } }) => {
        
        // setConfigData(data)
        const rows = data.map((d,index) => {
          let finalObject = prepareDataForGrid(d);
          // finalObject['canDelete'] = permissions.productCategory.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === d._id);
          // finalObject['allowedToEdit'] = permissions.productCategory.isUpdate;
          finalObject['id'] = index;
          return {...finalObject};
        });

        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: count,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: count,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
        }

        if (gridApi) {
          try {
            let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords)
              ? JSON.parse(localStorage.getItem(localStorageSelectedRecords))
              : [];
            if (oldSelectedRecords.length > 0) {
              gridApi.forEachNode(function (node) {
                node.setSelected(oldSelectedRecords.some((o) => o === node.data._id));
              });
            }
          } catch (ex) {
            console.error('Error in getting selected records from local storage');
          }
        }
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };



  const removeData = () => {
    setRemoving(true);
    axiosInstance()
      .put(`${routes.zone.path}/${id}/zip/remove`, {
        zips: showConfirmBox.ids
      })
      .then(() => {
        setShowConfirmBox({
          open: false,
          ids: []
        });
        getZipData();
        setRemoving(false);
      })
      .catch((err) => {
        setShowConfirmBox({
          open: false,
          ids: []
        });
        setRemoving(false);
        setToastConfig(err)
      });
  };

  return (
    <Box>
      <Box p={2} display="flex" justifyContent="space-between">
        <div />
        <Box display="flex">
          <Box mr={2} component={'div'}>
            <DeleteButton
              onClick={() => {
                setShowConfirmBox({
                  open: true,
                  ids: selectedRecords.map((s) => s.id)
                });
              }}
              size="small"
              disabled={selectedRecords.length === 0}
              disableElevation
              text={'Delete'}
            />
          </Box>
          <Button onClick={() => setOpenDialog(true)} size="small" variant="contained" color="primary" disableElevation>
            Add Zipcode
          </Button>
        </Box>
      </Box>
      <Box>
        {Object.keys(frameWorkComponent).length > 0 && (
          <CustomAgGrid
            allowSelection={true}
            allowAction={true}
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
              ids: []
            });
          }}
          onOk={removeData}
        />
      )}
    </Box>
  );
};

export default Zipcode;
