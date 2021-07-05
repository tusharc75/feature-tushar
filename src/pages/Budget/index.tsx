import { Button } from "@material-ui/core";
import React, { useState } from "react";
import ManageBudgetDialog from "./ManageBudgetDialog";

function Budget() {
  const [showManageBudgetDialog, setShowManageBudgetDialog] = useState({ show: false, id: null });

  const onSuccess = () => {
    // Add code of getting grid data again
  }

  return <>
    {
      showManageBudgetDialog.show && (
        <ManageBudgetDialog
          open={showManageBudgetDialog.show}
          onSuccess={onSuccess}
          onClose={() => {
            setShowManageBudgetDialog({ show: false, id: null });
          }}
          budgetId={showManageBudgetDialog.id}
        />
      )
    }
  </>;
}


export default Budget;
