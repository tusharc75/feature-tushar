import { useEffect, useState } from "react";
import SelectionConfirmationDialog from "src/components/Helpers/SelectionConfirmationDialog";
import { bulkUpdate, calculateRowsField } from "src/components/RentalManagment/helper";
import { MATERIAL_TYPE, sidebarResource } from "src/constants/helpers";
import { useData } from "src/StateProvider/Provider";
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const MaterialUpdateActions = ({ resource, values, referenceData, allFields, material, rowData, handleUpdateData, handleClose, isBulkedit = false, selectedRecords = [] }) => {

  const {
    state: { user }
  }: any = useData();

  const [showConfirmationDialog, setShowConfirmationDialog] = useState({ open: false, type: '' });
  const [showSelectionConfirmationDialog, setShowSelectionConfirmationDialog] = useState({ open: false, type: '' });

  useEffect(() => {
    handleSubmit()
  }, []);

  const handleSubmit = async () => {
    let currency = referenceData?.currency?.toLowerCase()
    if (isBulkedit) {
      let rentalPackagePriceMaterialWise = false
      if (resource === sidebarResource.rentalManagement) {
        rentalPackagePriceMaterialWise = user?.user?.brandPolicy?.rentalPackagePriceMaterialWise && user?.user?.brandPolicy?.rentalPackagePriceMaterialWise?.length
      }
      if (values[`price_${currency}`] && selectedRecords?.find((e) => !e.parentId) && !selectedRecords?.every((e) => !e.parentId) && !rentalPackagePriceMaterialWise) {
        setShowSelectionConfirmationDialog({ open: true, type: '' });
      }
      else {
        let childMatrialUpdate = []
        if (rentalPackagePriceMaterialWise) {
          childMatrialUpdate = [...user?.user?.brandPolicy?.rentalPackagePriceMaterialWise, MATERIAL_TYPE.package]
        }
        const rows = bulkUpdate(values, selectedRecords, material, allFields, referenceData?.currency, false, childMatrialUpdate);
        handleUpdateData(rows);
      }
    } else {
      let childResetAlert = false;
      const child = material?.filter((e) => e.parentId === rowData?._id);
      if (child?.length && !rowData.parentId) {
        if (child?.find((e) => e[`finalPrice_${currency}`]) && values[`finalPrice_${currency}`] !== rowData[`finalPrice_${currency}`]) {
          if (values[`qty`] === rowData[`qty`]) {
            childResetAlert = true;
          }
        }
      }
      if (childResetAlert && !showConfirmationDialog.open) {
        setShowConfirmationDialog({ open: true, type: 'child' });
      } else {
        const rows = await calculateRowsField(
          material,
          values,
          allFields,
          rowData,
          referenceData?.currency);
        handleUpdateData(rows);
        setShowConfirmationDialog({ open: false, type: '' });
      }
    }
  }

  const handleUpdateBulk = async (values, type) => {
    const rows = bulkUpdate(values, selectedRecords, material, allFields, referenceData?.currency, type === 'Parent' ? true : false);
    handleUpdateData(rows);
    setShowSelectionConfirmationDialog({ open: false, type: '' });
  }


  return (
    <>
      {showConfirmationDialog.open && (
        <ConfirmationDialog
          open={showConfirmationDialog.open}
          message={showConfirmationDialog.type === 'child' ?
            "This action will remove the child line items pricing. Any field update that changes final price will remove the child line items pricing" : ""}
          onOk={() => {
            handleSubmit();
          }}
          onClose={() => {
            setShowConfirmationDialog({ open: false, type: '' });
            handleClose()
          }}
        />
      )}
      {showSelectionConfirmationDialog.open && (
        <SelectionConfirmationDialog
          open={showSelectionConfirmationDialog.open}
          message={"Would you like to apply the price at the parent level or the child level?"}
          onOk={(type) => {
            handleUpdateBulk(values, type)
          }}
          onClose={() => {
            setShowSelectionConfirmationDialog({ open: false, type: '' });
            handleClose()
          }}
          selection1={'Parent'}
          selection2={'Child'}
        />
      )}
    </>
  );
};

export default MaterialUpdateActions;
