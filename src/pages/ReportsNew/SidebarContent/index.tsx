import Section from 'src/pages/ReportsNew/SidebarContent/Section';
import { UseReport } from 'src/pages/ReportsNew/types';

type SidebarContentProps = {
  state: UseReport;
};
const SidebarContent = ({ state }: SidebarContentProps) => {
  const { filteredCustomReports, filteredReports, setSelectedReport, selectedReport, favouriteReports, setUserFavourites, isFavourite } = state;

  return (
    <div className="space-y-4">
      {favouriteReports.length > 0 && (
        <Section
          getTitle={(report) => report.label}
          items={favouriteReports}
          onClick={(report) =>
            setSelectedReport({
              route: report.route,
              title: report.label
            })
          }
          isFilled={() => true}
          onButtonClick={(item) => setUserFavourites(item, false)}
          selectedTitle={selectedReport?.title}
          title={'Favourites'}
        />
      )}
      {filteredReports.map((data) => {
        if (data.reports.length === 0) return null;
        return (
          <Section
            getTitle={(report) => report.label}
            items={data.reports}
            onClick={(report) =>
              setSelectedReport({
                route: report.route,
                title: report.label
              })
            }
            onButtonClick={(item) => setUserFavourites(item, !isFavourite(item))}
            selectedTitle={selectedReport?.title}
            title={data.section}
            key={data.section}
            isFilled={(item) => isFavourite(item)}
          />
        );
      })}

      {filteredCustomReports.length > 0 && (
        <Section
          getTitle={(report) => report.customReportName}
          items={filteredCustomReports}
          onClick={(report) =>
            setSelectedReport({
              route: report.route,
              title: report.customReportName
            })
          }
          onButtonClick={(item) => setUserFavourites(item, !isFavourite(item))}
          selectedTitle={selectedReport?.title}
          title="Custom Reports"
          isFilled={(item) => isFavourite(item)}
        />
      )}
    </div>
  );
};

export default SidebarContent;
