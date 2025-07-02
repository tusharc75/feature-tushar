import ManualFooter from "src/pages/UserManual/ManualFooter";
import ManualNav from "src/pages/UserManual/ManualNav";
import useManualNew from "src/pages/UserManualNew/hooks/useManualNew";
import ManualLayoutNew from "src/pages/UserManualNew/ManualLayoutNew";

const UserManualNew = () => {
  const state = useManualNew();

  return (
    <div className="w-full min-h-screen flex flex-col [--manual-head-height:60px] [--manual-sidebar-width:300px]">
      <ManualNav state={state} />
      <ManualLayoutNew state={state} />
      <ManualFooter />
    </div>
  );
}

export default UserManualNew;