import useManual from 'src/pages/UserManual/hooks/useManual';
import ManualFooter from 'src/pages/UserManual/ManualFooter';
import ManualLayout from 'src/pages/UserManual/ManualLayout';
import ManualNav from 'src/pages/UserManual/ManualNav';

const LayoutDocs = () => {
  const state = useManual();

  return (
    <div className="w-full  [--manual-head-height:60px] [--manual-sidebar-width:300px]">
      <ManualNav state={state} />
      <ManualLayout state={state} />
      <ManualFooter />
    </div>
  );
};

export default LayoutDocs;
