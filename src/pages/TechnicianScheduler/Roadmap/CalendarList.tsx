import { Tooltip, Typography } from '@material-ui/core';
import styles from './roadmap.module.scss';
import { getPriority, getColorFromPriority, getPositionOfDate } from './helperFunctions';

export default function CalendarList(props) {
  const { activity, handleSelect, startDate, endDate, totalDay, calendarType } = props;

  return (
    <>
      <div className={styles.roadmapContainer}>
        {activity.map((item) => {
          const name = item.firstName + ' ' + item.lastName;
          const createDate = item.createDate;
          return (
            <div className={styles.singleUserRoadmap}>
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
        const pos = getPositionOfDate(service.estimateStartDate, service.estimateEndDate, startDate, endDate, totalDay);
        return (
          <div
            className={`${styles.singleService} singlePriority`}
            style={{ ...bgColor, minWidth: '100px', minHeight: '50px', ...pos }}
            onClick={handleSelect}
          >
            <Tooltip
              title={
                <>
                  <p>{service?.fieldTicket[0]?.fieldTicketNumber}</p>
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
            </Tooltip>
          </div>
        );
      })}
    </>
  );
};
