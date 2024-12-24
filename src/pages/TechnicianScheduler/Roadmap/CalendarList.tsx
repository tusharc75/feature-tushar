import { Typography } from '@mui/material';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { getColorFromPriority, getPositionOfDate, getPriority } from './helperFunctions';
import styles from './roadmap.module.scss';

export default function CalendarList(props) {
  const { activity, handleSelect, startDate, endDate, totalDay, calendarType } = props;

  return (
    <>
      <div className={styles.roadmapContainer}>
        {activity.map((item) => {
          const name = item.firstName + ' ' + item.lastName;
          const createDate = item.createDate;

          return (
            <div className={styles.singleUserRoadmap} key={item._id}>
              <RenderServices
                createDate={createDate}
                name={name}
                startDate={startDate}
                endDate={endDate}
                services={item?.fieldTicket || []}
                handleSelect={handleSelect}
                totalDay={totalDay}
                calendarType={calendarType}
              />
            </div>
          );
        })}
      </div>
    </>
  );
}

const RenderServices = ({ name, startDate, endDate, services, handleSelect, totalDay, calendarType, createDate }) => {
  return (
    <>
      {services?.map((service) => {
        const priority = getPriority(service.status);
        const bgColor = getColorFromPriority(priority);
        const pos = getPositionOfDate(service.startDate, service.endDate, startDate, endDate, totalDay);
        return (
          <div
            className={`${styles.singleService} singlePriority ${bgColor}`}
            style={{ minHeight: '50px', ...pos }}
            onClick={() => {
              handleSelect(null, { _id: service?.technician, technicianHistoryId: service?._id }, '');
            }}
          >
            <HtmlTooltip
              title={
                <>
                  <p>{service?.fieldTicket[0]?.fieldTicketNumber ?? service?.rentalJob[0]?.rentalJobName}</p>
                </>
              }
              placement="top"
            >
              <div>
                <Typography variant="h6" className={styles.servicesText} title={service?.serviceDetail?.serviceName}>
                  <span>{service?.serviceDetail?.serviceName}</span>
                </Typography>
                <span className={`${styles.chip} ${styles[priority]}`}>
                  <Typography component={'span'}>{service.status}</Typography>
                </span>
              </div>
            </HtmlTooltip>
          </div>
        );
      })}
    </>
  );
};
