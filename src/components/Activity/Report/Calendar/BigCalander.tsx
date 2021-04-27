import React, { useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import { Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useHistory } from "react-router-dom";
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import IconButton from '@material-ui/core/IconButton';
import moment from 'moment';
let dayname = moment.weekdaysShort();

const useStyles = makeStyles((theme) => ({
    fontBold: {
        fontWeight: 700
    },
    minusMargin: {
        margin: "-1px"
    },
    tdWidth: {
        maxWidth: "14.28%!important",
        minWidth: "14.28%!important"
    }
}));



const GetDays = function (month, year) {

    let blank_days = [];

    let preMonth = moment(year + "-" + month + "-01").subtract(1, 'months').format("MM");
    let nextMonth = moment(year + "-" + month + "-01").subtract(1, 'months').format("MM");
    let blankDay = parseInt(moment(year + "-" + month + "-01").startOf("month").format("d"));
    for (let i = 1; i <= blankDay; i++) {
        blank_days.push({ day: (parseInt(moment(year + "-" + preMonth + "-01").endOf("month").format("DD")) - (blankDay - i)), month: preMonth });
    }

    let days_in_month = [];
    for (let d = 1; d <= moment(year + "-" + month + "-01").daysInMonth(); d++) {
        days_in_month.push({ day: d, month: month });
    }
    var total_slot = [...blank_days, ...days_in_month];

    let rows = [];
    let cells = [];

    total_slot.forEach((row, i) => {
        if (i % 7 !== 0) {
            cells.push(row);
        } else {
            rows.push(cells);
            cells = [];
            cells.push(row);
        }
        if (i === total_slot.length - 1) {
            rows.push(cells);
        }
    });

    rows.forEach((row, i) => {
        if (i === rows.length - 1) {
            if (row.length < 7) {
                let NextMonthDays = 7 - row.length;
                for (let i = 1; i <= NextMonthDays; i++) {
                    row.push({ day: i, month: nextMonth });
                }
            }
        }
    })
    return rows;
};




export default function BigCalander({ type, activity }) {

    const history = useHistory();
    const [month, setMonth] = useState(moment().month() + 1);
    const [year, setYear] = useState(moment().year());

    const handlechange = (type) => {
        if (type === "next") {
            if (month === 12) {
                setMonth(1)
                setYear(year + 1)
            }
            else {
                setMonth(month + 1)
            }
        }
        else {
            if (month === 1) {
                setMonth(12)
                setYear(year - 1)
            }
            else {
                setMonth(month - 1)
            }
        }
    };


    const handleActivityOpen = (activityId) => {
        history.push({
            pathname: '/activity/' + type,
            search: '?activityType=' + type + '&activityId=' + activityId
        })
    }

    let days = GetDays(month, year);
    const classes = useStyles();

    return (<Box>
        <Box pt={1} display="flex" flexDirection="row">
            <Box>
                <IconButton aria-label="delete" onClick={() => handlechange("pre")} >
                    <ChevronLeftIcon />
                </IconButton>
                <IconButton aria-label="delete" onClick={() => handlechange("next")} >
                    <ChevronRightIcon />
                </IconButton>
            </Box>
            <Box display="block">
                <Box ml={2} mt={2}>
                    <Typography className={classes.fontBold}>{moment(month, 'MM').format('MMMM')} - {year}</Typography>
                </Box>
            </Box>
        </Box>

        <Box p={2}>
            <table style={{ width: "100%" }}>
                <thead>
                    <tr>
                        {dayname.map((day, key) => (
                            <td key={key} className={classes.tdWidth}>
                                <Box className={classes.minusMargin} border={1} borderColor="grey.300" p={2} bgcolor="grey.200" >
                                    <Typography className={classes.fontBold}>{day}</Typography>
                                </Box>
                            </td>
                        ))}
                    </tr>
                    {days.map((_days, key) => (
                        <tr key={key}>
                            {_days.map((_day, key) => (
                                <td key={key} className={classes.tdWidth}>
                                    <Box className={classes.minusMargin} border={1} borderColor="grey.300" minHeight={100} maxHeight={100} >
                                        <Box pl={1} pt={1}>
                                            <Typography className={_day.month == month ? classes.fontBold : ""}>{_day.day}</Typography>
                                        </Box>
                                        {(activity.filter((data) => moment(data.dueDate).format("YYYY-MM-DD") === (year + "-" + (_day.month.toString()).padStart(2, "0") + "-" + (_day.day.toString()).padStart(2, "0")))).map((_data, key) => (
                                            key === 0 && <Box style={{ cursor: "pointer" }} key={key} p={0.5} m={1} border={1} bgcolor="grey.100" borderColor="grey.300" onClick={() => handleActivityOpen(_data._id)}>
                                                <Typography >{_data.name}</Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </td>
                            ))}
                        </tr>
                    ))}
                </thead>
            </table>
        </Box>
    </Box>
    );
}