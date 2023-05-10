import { makeStyles } from '@material-ui/core/styles';
import { Box, Tooltip, Typography } from '@material-ui/core';
// import { TreeView, TreeItem } from '@material-ui/lab';
import moment from 'moment';
import { displayDate } from 'src/constants/helpers';
import styles from './roadmap.module.scss';

// const useStyles = makeStyles((theme) => ({
//   label: {
//     paddingLeft: 0
//   },
//   iconContainer: {
//     display: 'none'
//   },
//   group: {
//     marginLeft: 0
//   },
//   calenderHighlights: {
//     color: 'white',
//     background: 'red',
//     borderRadius: '4px',
//     padding: '2px 5px',
//     display: 'flex',
//     alignItems: 'center',
//     overflow: 'hidden'
//   }
// }));

export default function CalendarList(props) {
  const { activity, expanded, selected, handleSelect, startDate, endDate, totalDay, calendarType } = props;
  // const classes = useStyles();

  // const getTreeNodes = (activity) => {
  //   return activity.map((data, index) => {
  //     let children = [];
  //     if (data.child && data.child.length) {
  //       children = getTreeNodes(data.child);
  //       children.push(<div></div>);
  //     }

  //     let label = (
  //       <Box width={'100%'} height={50} className="d-flex align-items-center">
  //         <Tooltip title={data.firstName + ' ' + data.lastName + ' - ' + displayDate(data.createDate)} placement="right">
  //           <Box
  //             minWidth={calendarType !== 'week' ? '100px' : ''}
  //             height={45}
  //             borderRadius="borderRadius"
  //             display="flex"
  //             style={{
  //               position: 'absolute',
  //               left: (100 * moment(data.startDate).diff(startDate, 'days')) / totalDay + '%',
  //               right: (100 * endDate.diff(moment(data.dueDate), 'days')) / totalDay + '%'
  //             }}
  //             bgcolor="secondary.main"
  //             color="white"
  //           ></Box>
  //         </Tooltip>
  //       </Box>
  //     );

  //     return (
  //       <TreeItem
  //         key={index}
  //         nodeId={data._id.toString()}
  //         label={label}
  //         children={children}
  //         classes={{
  //           group: classes.group,
  //           iconContainer: classes.iconContainer,
  //           label: classes.label
  //         }}
  //       />
  //     );
  //   });
  // };

  // let TreeNodes = getTreeNodes(activity);
  // return (
  //   <>
  //     <TreeView expanded={expanded} selected={selected} onNodeSelect={handleSelect}>
  //       {TreeNodes.map((node) => {
  //         return node;
  //       })}
  //     </TreeView>
  //   </>
  // );

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
                services={item.serviceOrders}
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

const getPos = (taskStartDate, taskEndDate, startDate, endDate, totalDay) => {
  return {
    left: (100 * moment(taskStartDate).diff(startDate, 'days')) / totalDay + '%',
    right: (100 * endDate.diff(moment(taskEndDate), 'days')) / totalDay + '%'
  } as React.CSSProperties;
};

const RenderServices = ({ name, startDate, endDate, services, handleSelect, totalDay, calendarType, createDate }) => {
  const getPriority = () => {
    const priority = ['low', 'medium', 'high'];
    return priority[Math.floor(Math.random() * priority.length)];
  };

  const getColorFromPriority = (priority) => {
    let color = { backgroundColor: '#EFF8FF' } as React.CSSProperties;
    if (priority === 'low') {
      color = { backgroundColor: '#EFF8FF' } as React.CSSProperties;
    }
    if (priority === 'medium') {
      color = { backgroundColor: '#FEF5D6' } as React.CSSProperties;
    }
    if (priority === 'high') {
      color = { backgroundColor: '#FFEEF3' } as React.CSSProperties;
    }
    return color;
  };

  return (
    <>
      {services?.map((service) => {
        const priority = getPriority();
        const bgColor = getColorFromPriority(priority);
        const pos = getPos(service.estimateStartDate, service.estimateEndDate, startDate, endDate, totalDay);
        return (
          <div
            className={`${styles.singleService} singlePriority`}
            style={{ ...bgColor, minWidth: '100px', minHeight: '50px', ...pos }}
            onClick={handleSelect}
          >
            <Tooltip
              title={
                <>
                  <p>{service?.serviceOrder?.fieldServiceOrderNumber}</p>
                </>
              }
              placement="top"
            >
              <div>
                <Typography variant="h6" className={styles.servicesText} title={service?.serviceDetail?.optionLabel}>
                  <span>{service?.serviceDetail?.optionLabel}</span>
                </Typography>
                <span className={`${styles.chip} ${styles[priority]}`}>
                  <Typography component={'span'}>{priority}</Typography>
                </span>
                {/* <span className={`${styles.chip} ${styles.success}`}>
                  <Typography component={'span'}>{service?.status}</Typography>
                </span> */}
              </div>
            </Tooltip>
          </div>
        );
      })}
    </>
  );
};
