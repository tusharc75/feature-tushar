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
      {filteredReports.map((data) => {
        if (data.reports.length === 0) return null;
        return (
          <Section
            getTitle={(report) => report.label}
            items={data.reports}
            onClick={(report) =>
              setSelectedReport({
                route: `/reports${report.type !== 'dynamic' ? `/${kebabCase(report.key)}/` + kebabCase(report.type) : routes[report.key]?.path}`,
                title: report.label
              })
            }
            selectedTitle={selectedReport?.title}
            title={data.section}
          />
        );
      })}

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
