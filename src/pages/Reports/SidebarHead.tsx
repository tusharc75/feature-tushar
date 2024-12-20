import SearchBox from 'src/components/Helpers/SearchBox';
import { UseReport } from 'src/pages/Reports/types';

type SidebarHeadProps = {
  state: UseReport;
};

const SidebarHead = ({ state }: SidebarHeadProps) => {
  const { searchedValue, setSearchedValue } = state;
  return (
    <div className="">
      <h6>Reports Center</h6>
      <SearchBox
        onChange={(e) => {
          const value = e.target.value;
          setSearchedValue(value);
        }}
        value={searchedValue}
      />
    </div>
  );
};

export default SidebarHead;
