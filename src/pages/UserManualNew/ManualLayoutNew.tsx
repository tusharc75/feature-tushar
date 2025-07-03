import { ComponentCommonProps } from 'src/pages/UserManual/type';
import { ManualContentNew } from 'src/pages/UserManualNew/ManualContentNew';
import ManualSidebarNew from 'src/pages/UserManualNew/ManualSidebarNew';

const ManualLayoutNew = ({ state }: ComponentCommonProps) => {
  return (
    <div className="flex w-full flex-grow">
      <ManualSidebarNew state={state} />
      <ManualContentNew state={state} />
    </div>
  );
};

export default ManualLayoutNew;
