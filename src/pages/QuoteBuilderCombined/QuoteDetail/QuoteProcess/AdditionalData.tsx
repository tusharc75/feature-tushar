import { useState, useContext, Fragment } from "react";
import { Box, Button, makeStyles } from "@material-ui/core";
import CustomAgGrid from "../../../../components/AgGridComponents/CustomAgGrid";
import AddIcon from "@material-ui/icons/Add";
import axiosInstance from "../../../../axios/axiosInstance";
import { termsAndCondition } from "../../../../constants/helpers";
import { CustomToastContext } from "../../../../StateProvider/CustomToastContext/CustomToastContext";
import ManageTermsAndCondition from "../../../TermsAndConditions/ManageTermsAndCondition";

const useStyles = makeStyles((theme) => ({
  termsBtn: {
    position: "absolute",
    top: "-16px",
    right: "0",
  },
}));

export default function AdditionalData({
  state,
  dispatch,
  allowedToEdit,
  handleVersionUpdateFromAdditionalData,
  fetchTNC }) {
  const toastConfig = useContext(CustomToastContext);
  const classes = useStyles();

  const [editRecordTNC, setEditRecordTNC] = useState(null);
  const [showManageAdditionalDataDialog, setShowManageAdditionalDataDialog] = useState(false);

  const [, setGridApi] = useState(null);
  const {
    dataRows,
    rowCount,
    loading,
    page,
    limit,
    pageSizes,
    selectedRecords,
  } = state;

  const [columns] = useState([
    {
      field: "name",
      rowDrag: allowedToEdit,
      headerName: "Name",
      cellRenderer: "nameRenderer",
      show: true,
    },
  ]);

  const handleCloseCreateDialog = () => {
    setShowManageAdditionalDataDialog(false);
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
            setShowManageAdditionalDataDialog(true);
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

  return (
    <Fragment>
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
            onClick={() => setShowManageAdditionalDataDialog(true)}
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
            handleVersionUpdateFromAdditionalData(
              newSelectedRecords
            );
          }}
          onRowDragEnd={(newSequence) => {
            dispatch({
              type: "selection",
              newSequence: newSequence,
            });
            handleVersionUpdateFromAdditionalData(
              newSequence
            );
          }}
        />
      </Box>
      {showManageAdditionalDataDialog && (
        <ManageTermsAndCondition
          termsAndCondition={termsAndCondition}
          open={showManageAdditionalDataDialog}
          handleClose={handleCloseCreateDialog}
          fetchData={() => {
            fetchTNC(null, true);
          }}
          editRecord={editRecordTNC}
          displayTitle={"Additional Data"}

        />
      )}
    </Fragment>
  )
}