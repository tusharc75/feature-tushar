import React, { useMemo } from 'react';
import { ReportType, UseReport } from 'src/pages/Reports/types';
import analytics from 'src/assets/newSvgs/analytics.svg';
import ReportsTable from 'src/pages/Reports/tables/ReportsTable';
import StandardReportsTable from 'src/pages/Reports/tables/StandardReportTable';
import { REPORT_LIST } from 'src/constants/helpers';
import { startCase } from 'lodash';

type ReportsContentProps = {
  state: UseReport;
  isSidebarOpen: boolean;
  isMobile: boolean;
};

const getTableComponent = (selectedReport) => {
  const type: ReportType | undefined = selectedReport?.type;
  const isStanderdCustomReport =
    selectedReport?.type === 'custom-report' &&
    selectedReport?.customReportData &&
    REPORT_LIST?.some((c) => c?.title === startCase(selectedReport?.customReportData?.resource) && c?.key === 'standardReport')
      ? true
      : false;

  switch (type) {
    case 'report':
      return ReportsTable;
    case 'standard-report':
      return StandardReportsTable;
    case 'custom-report':
      switch (isStanderdCustomReport) {
        case true:
          return StandardReportsTable;
        default:
          return ReportsTable;
      }
    default:
      return ReportsTable;
  }
};

const ReportsContent = ({ state, isSidebarOpen, isMobile }: ReportsContentProps) => {
  const { selectedReport } = state;
  let TableComponent = useMemo(() => getTableComponent(selectedReport), [selectedReport]);

  return (
    <>
      {selectedReport ? (
        <TableComponent state={state} key={selectedReport.route} isSidebarOpen={isSidebarOpen} isMobile={isMobile} />
      ) : (
        <div className="absolute bottom-0 left-4 right-4 top-[200px] text-center">
          <div className="mx-auto mb-[20px] h-[69px] w-[69px]">
            <img src={analytics} className="block h-auto w-full" alt="Please select a asset" />
          </div>
          <div className="mx-auto max-w-[617px]">
            <h6 className="mb-[5px] text-[16px] font-semibold leading-[21px]">Select Report</h6>
            <p className="text-[14px] font-normal leading-[23px] text-[#777575] dark:text-gray-500">
              Currently, no report has been chosen for display. In order to proceed, please select a report from the available list. Once selected,
              you will be able to view its contents and detailed information.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default ReportsContent;