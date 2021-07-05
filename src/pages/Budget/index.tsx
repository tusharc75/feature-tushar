import { Button } from "@material-ui/core";
import React, { useState } from "react";
import ManageBudgetDialog from "./ManageBudgetDialog";

function Budget() {
  const [showManageBudgetDialog, setShowManageBudgetDialog] = useState({ show: false, id: null });

  const onSuccess = () => {
    // Add code of getting grid data again

    setShowManageBudgetDialog({ show: false, id: null });
  }

  return <>
    <Button onClick={() => { setShowManageBudgetDialog({ show: true, id: "60e2f1ae8408d190c913f6ad" }) }} >Edit</Button>

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
