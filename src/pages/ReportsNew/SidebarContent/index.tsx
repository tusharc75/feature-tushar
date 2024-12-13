import { kebabCase } from 'lodash';
import routes from 'src/components/Helpers/Routes';
import Section from 'src/pages/ReportsNew/SidebarContent/Section';
import { UseReport } from 'src/pages/ReportsNew/types';

type SidebarContentProps = {
  state: UseReport;
};
const SidebarContent = ({ state }: SidebarContentProps) => {
  const { filteredCustomReports, filteredReports, setSelectedReport, selectedReport } = state;

  return (
    <div className="space-y-4">
      <Section
        getTitle={(report) => (report.type === 'dynamic' && routes[report.key]?.title ? routes[report.key]?.title : report.title)}
        items={filteredReports}
        onClick={(report) =>
          setSelectedReport({
            route: `/reports${report.type !== 'dynamic' ? `/${kebabCase(report.key)}/` + kebabCase(report.type) : routes[report.key]?.path}`,
            title: report.type === 'dynamic' && routes[report.key]?.title ? routes[report.key]?.title : report.title
          })
        }
        selectedTitle={selectedReport?.title}
        title="Reports"
      />

      <Section
        getTitle={(report) => report.customReportName}
        items={filteredCustomReports}
        onClick={(report) =>
          setSelectedReport({
            route: `/reports/custom-report/${report._id}`,
            title: report.customReportName
          })
        }
        selectedTitle={selectedReport?.title}
        title="Custom Reports"
      />
    </div>
  );
};

export default SidebarContent;
