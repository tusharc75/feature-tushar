import React from 'react';
import { Box, Button, IconButton } from '@material-ui/core';
import AddConfigurationDialog from './AddConfigurationDialog';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { gridLoadingTimeout, prepareDataForGrid, product } from '../../../constants/helpers';
import CarouselDialog from '../../../components/CarouselDialog';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { Delete, Edit } from '@material-ui/icons';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import DeleteButton from '../../../components/Helpers/DeleteButton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider'
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

interface ConfigProps {
  productFields: any[];
  productData: any | {};
  id: string;
  renderedFrom: string;
}

const ProductConfiguration = (props: ConfigProps) => {
  const initialRender = React.useRef(true);
  const { state: { permissions } }: any = useData();
  const { productData, id, renderedFrom } = props;
  const { setToastConfig } = React.useContext(CustomToastContext)
  const [specFields, setSpecFields] = React.useState([]);
  const [configData, setConfigData] = React.useState([]);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [showConfirmBox, setShowConfirmBox] = React.useState({
    open: false,
    ids: []
  });
  const [carouselDialog, setCarouselDialog] = React.useState({
    open: false,
    images: [],
    index: 0
  });
  const [editConfig, setEditConfig] = React.useState({
    values: {},
    images: []
  });
  const { generateColumns } = useColumns();
  const [columns, setColumns] = React.useState([]);
  const { state, dispatch } = useTableReducer();
  const { selectedRecords } = state;

  React.useEffect(() => {
    if (productData) {
      getTemplateFields();
    }
    if (initialRender) {
      getConfigurationData();
      initialRender.current = false;
    }
  }, [productData]);

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 110,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
         <IconButton size="small" color="inherit" onClick={() => editData(row?.original)}>
        <Edit fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        color="inherit"
        onClick={() => {
          setShowConfirmBox({
            open: true,
            ids: [row?.original?.id]
          });
        }}
      >
        <Delete color="error" fontSize="small" />
      </IconButton>
      </>)
  };

  const editData = (data) => {
    const { images, ...rest } = data;
    setEditConfig({
      values: rest,
      images: images
    });
    setOpenDialog(true);
  };

  const getTemplateFields = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.productTemplate.path}/fields/${productData.productTemplate}`);
      const { fields } = data;
      setSpecFields(fields);
      const newColumns = generateColumns(renderedFrom, fields, routes.product.path, true);
      setColumns([...newColumns, ActionsRenderer]);
    } catch (err) {
      setToastConfig(err);
    }
  };

  const getConfigurationData = () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });
    axiosInstance()
      .get(`${routes.product.path}/${id}/images`)
      .then(({ data: { data } }) => {
        setConfigData(data);
        const rows = data.map((d) => {
          let finalObject = prepareDataForGrid(d.productConfiguration);
          finalObject['images'] = d.images;
          finalObject['id'] = d._id;
          finalObject['_id'] = d._id;

          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: rows.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        setToastConfig(err)
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const removeData = () => {
    setRemoving(true);
    axiosInstance()
      .put(`${routes.product.path}/${id}/images/remove`, {
        ids: showConfirmBox.ids
      })
      .then(() => {
        setShowConfirmBox({
          open: false,
          ids: []
        });
        getConfigurationData();
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
      {permissions?.product?.isUpdate &&
        <Box p={1} pt={2} pb={2} display="flex" justifyContent="space-between">
          <Button
            onClick={() => setOpenDialog(true)}
            size="small"
            variant="contained"
            color="primary" disableElevation>
            Add Images
          </Button>
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
      }
      <Box>
      {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={()=>{}}
            isClientSideGrid = {true}
            hideAction = {!(permissions?.product)}
            hideSelection = {!(permissions?.product?.isUpdate)}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {openDialog && (
        <AddConfigurationDialog
          fields={specFields}
          data={Object.values(editConfig.values).length > 0 ? editConfig : null}
          close={() => setOpenDialog(false)}
          id={id}
          fetchData={getConfigurationData}
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

export default ProductConfiguration;
