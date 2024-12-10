import routes from 'src/components/Helpers/Routes';
import Section from 'src/pages/ReportsNew/SidebarContent/Section';
import { UseReport } from 'src/pages/ReportsNew/types';

type SidebarContentProps = {
  state: UseReport;
};
const SidebarContent = ({ state }: SidebarContentProps) => {
  const { filteredCustomReports, filteredReports } = state;
  return (
    <div className="space-y-4">
      <Section
        getTitle={(report) => (report.type === 'dynamic' ? routes[report.key]?.title : report.title)}
        items={filteredReports}
        onClick={() => {}}
        title="Reports"
      />

      <Section getTitle={(item) => item.customReportName} items={filteredCustomReports} onClick={() => {}} title="Custom Reports" />
    </div>
  );
};

export default SidebarContent;
