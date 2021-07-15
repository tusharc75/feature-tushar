import { Box, Button, makeStyles } from "@material-ui/core";
import CustomAgGrid, {
    reducer,
    intialState,
  } from "../../../../components/AgGridComponents/CustomAgGrid";
  import AddIcon from "@material-ui/icons/Add";
import { useEffect, useReducer, useState, useContext } from "react";
import axiosInstance from "../../../../axios/axiosInstance";
import { gridLoadingTimeout, termsAndCondition } from "../../../../constants/helpers";
import { CustomToastContext } from "../../../../StateProvider/CustomToastContext/CustomToastContext";

const useStyles = makeStyles((theme) => ({
    termsBtn: {
        position: "absolute",
        top: "-16px",
        right: "0",
      },
}));


export default function AdditionalData({  allowedToEdit }) {
    const toastConfig = useContext(CustomToastContext);
    const classes = useStyles();

  const [editRecordTNC, setEditRecordTNC] = useState(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const {
    dataRows,
    rowCount,
    loading,
    page,
    limit,
    pageSizes,
    search,
    filters,
    sorting,
    selectedRecords,
  } = state;
  const [columns, setColumns] = useState([]);
    
  useEffect(() => {
    setColumns([
      {
        field: "name",
        rowDrag: allowedToEdit,
        headerName: "Name",
        cellRenderer: "nameRenderer",
        show: true,
      },
    ])
  }, [allowedToEdit]);

  useEffect(() => {
    fetchTermsAndConditions()
  }, []);

  const handleCloseCreateDialog = () => {
        setShowCreateDialog(false);
        if (editRecordTNC) {
          setEditRecordTNC(null);
        }
      };
      
      const NameRenderer = (params) => (
        allowedToEdit ? <p
          className="cursor-pointer link"
          title={params.value}
          onClick={() => {
            axiosInstance().get(`${termsAndCondition.api}/${params.data._id}`)
              .then(({ data: { data } }) => {
                setEditRecordTNC(data);
                setShowCreateDialog(true);
              }).catch(error => {
                toastConfig.setToastConfig(error);
              });
          }}
        >
          {params.value}
        </p> : params.value
      );
    
      const frameworkComponents = {
        nameRenderer: NameRenderer,
      };

      const fetchTermsAndConditions = (selectedTermsAndConditions = null, updateVersionStatus = false) => {
        dispatch({ type: "loading", loading: true });
    
        if (gridApi) {
          // gridApi.setRowData([]);
        }
    
        axiosInstance()
          .get(`${termsAndCondition.api}?limit=0`)
          .then(({ data: { data, count } }) => {
            let selectedRows = [];
            const onlyTermsAndConditionsIds = selectedTermsAndConditions ? selectedTermsAndConditions.map(d => d._id) : selectedRecords.map(d => d._id);
    
            let rows = data.map((tnc) => {
              if (onlyTermsAndConditionsIds.indexOf(tnc._id) >= 0) {
                selectedRows.push(tnc);
              }
              return {
                ...tnc,
                id: tnc._id,
                name: tnc.TACName,
              };
            });
            dispatch({
              type: "initialize",
              data: rows,
              count: count,
            });
            dispatch({ type: "selection", selectedRecords: selectedRows });
    
            if (updateVersionStatus) {
            //   handleVersionUpdate(
            //     "",
            //     visibleColumns,
            //     versionStatus,
            //     selectedRows
            //   );
            }
    
            setTimeout(() => {
              dispatch({ type: "loading", loading: false });
            }, gridLoadingTimeout);
          })
          .catch((err) => {
            toastConfig.setToastConfig(err);
            dispatch({ type: "loading", loading: false });
          });
      };
    

    return (
        <Box className="m-3">
        <div className="position-relative">
          <h4
            className="form-label-style"
            title="Add Additional Data"
          >
            Additional Data
          </h4>
          <Button
            disabled={!allowedToEdit}
            onClick={() => setShowCreateDialog(true)}
            variant="contained"
            size="small"
            color="primary"
            className={classes.termsBtn}
            startIcon={<AddIcon />}
          >
            Add Additional Data
          </Button>
        </div>
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
          actionWidth={150}
          allowSelection={allowedToEdit}
          allowAction={false}
          isClientSideGrid={true}
          allowPagination={false}
          selectedRecords={selectedRecords}
          loading={loading}
          onSelection={(newSelectedRecords) => {
            dispatch({ type: "selection", selectedRecords: newSelectedRecords });
            // handleVersionUpdate(
            //   "",
            //   visibleColumns,
            //   versionStatus,
            //   newSelectedRecords
            // );
          }}
          onRowDragEnd={(newSequence) => {
            dispatch({
              type: "selection",
              newSequence: newSequence,
            });

            // handleVersionUpdate(
            //   "",
            //   visibleColumns,
            //   versionStatus,
            //   newSequence
            // );
          }}
        />
      </Box>
    )

}