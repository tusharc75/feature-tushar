import { useEffect, useState } from 'react'
import { Grid, Box, Checkbox, FormControlLabel, Typography } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { BsEnvelopeOpen, BsPhone, BsDisplay } from 'react-icons/bs'
import styles from "../profilePage.module.scss"

const useStyles = makeStyles((theme) => ({
    tableCell: {
        fontSize: "medium"
    },
    notificationIcon: {
        color: theme.palette.primary.light
    },
    preferenceOptions: {
        color: "primary",
        marginBottom: '12px',
        marginLeft: "5px",
    },
    label: {
        marginLeft: "1px"
    }
}));

let notificationPreferenceTitles = ['Activity in all unassigned conversation', 'Activity in any of your Teams',
    'Activity in conversations assigned to other teams or teammates', 'Any mentions of you in a conversation',
    'Activity on conversation started from messages you sent', 'Activity in anything assigned to you',
    'New conversation with Leads and users you own'
]

const RenderCheckBox = ({ name, val, id, onChange }) => (
    // <FormControlLabel
    //     control={<Checkbox size="small" checked={val}
    //         onChange={(e) => onChange(e.target.checked, id, name)} name={name} />}
    //     label={name}
    // />
    <Checkbox checked={val}
        onChange={(e) => onChange(e.target.checked, id, name)} name={name} />
)

const PreferenceOptions = ({ id, icon, heading, subtitle }) => (
    <Grid item key={id} sm={12} md={6} lg={4} container>
        <Grid item sm={3} style={{ marginTop: '7px' }}>
            {icon}
        </Grid>
        <Grid item sm={7} container>
            <Grid item xs container direction="column">
                <Grid item xs>
                    <Typography align="left" variant="h6">
                        <strong>{heading}</strong></Typography>
                    <Typography align="left" variant="body2" gutterBottom>{subtitle}</Typography>
                </Grid>
            </Grid>
        </Grid>
    </Grid>
)

export default function NotifiationPreference(props) {

    const [rows, setRows] = useState([])
    const [isAllPreference, setAllPreference] = useState({
        desktop: false,
        mobile: false,
        email: false
    })
    const classes = useStyles();

    useEffect(() => {
        let rows = notificationPreferenceTitles.map((str, i) => {
            return { id: "preference" + i, title: str, desktop: false, mobile: false, email: false }
        })
        setRows(rows)
    }, [])

    const handleChange = (isChecked, id, columnName) => {
        let tempRows = rows.map(obj => {
            if (obj.id === id) return { ...obj, [columnName]: isChecked }
            else return obj
        })
        setRows(tempRows)
    }

    const handleSelectAll = (columnName) => {
        setAllPreference(prevState => {
            return {
                ...prevState,
                [columnName]: !prevState[columnName]
            }
        })
        let tempRows = rows.map(obj => {
            return { ...obj, [columnName]: !isAllPreference[columnName] }
        })
        setRows(tempRows)
    }

    const options = [
        {
            icon: <BsDisplay size={60} className={classes.notificationIcon} />,
            heading: "Desktop",
            subtitle: "A banner in corner of your screen",
            id: "Desktop1"
        },
        {
            icon: <BsPhone size={60} className={classes.notificationIcon} />,
            heading: "Mobile",
            subtitle: "A Notification on your phone",
            id: "Mobil2"
        },
        {
            icon: <BsEnvelopeOpen size={50} className={classes.notificationIcon} />,
            heading: "Email",
            subtitle: "Conversation sent to your mail",
            id: "Email3"
        }
    ]
    return <>
        <div className={styles.preferenceHeader}>
            <Typography variant="h5">Your Notification Preference</Typography>
            {/* <Tooltip title="Save">
                <IconButton>
                    <SaveButton color="primary" variant="contained" onClick={handleSubmit}>Save</SaveButton>
                </IconButton>
            </Tooltip> */}
        </div>
        <Box style={{ padding: "8px" }}>
            <Box className={styles.preferenceOptionsBox}>
                <Grid container spacing={3} className={classes.preferenceOptions} >
                    {
                        options.map(curPreference => (
                            <PreferenceOptions
                                key={curPreference.id}
                                id={curPreference.id}
                                icon={curPreference.icon}
                                heading={curPreference.heading}
                                subtitle={curPreference.subtitle}
                            />
                        ))
                    }
                </Grid>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableRow>
                        <TableCell component="th" scope="row" className={classes.tableCell}>
                        </TableCell>
                        <TableCell padding="checkbox" >
                            <FormControlLabel
                                className={classes.label}
                                control={<Checkbox
                                    onChange={() => handleSelectAll("desktop")} title="Desktop" />}
                                label="Desktop"
                            />
                        </TableCell>
                        <TableCell padding="checkbox">
                            <FormControlLabel
                                className={classes.label}
                                control={<Checkbox
                                    onChange={() => handleSelectAll("mobile")} title="Mobile" />}
                                label="Mobile"
                            />
                        </TableCell>
                        <TableCell padding="checkbox">
                            <FormControlLabel
                                className={classes.label}
                                control={<Checkbox
                                    onChange={() => handleSelectAll("email")} title="Email" />}
                                label="Email"
                            />
                        </TableCell>
                    </TableRow>
                    <TableBody>
                        {rows.map((row) => (
                            <TableRow key={row?.id}>
                                <TableCell component="th" scope="row" className={classes.tableCell}>
                                    {row.title}
                                </TableCell>
                                <TableCell padding="checkbox" align="left">
                                    <RenderCheckBox name="desktop" val={row.desktop} id={row.id} onChange={handleChange} />
                                </TableCell>
                                <TableCell padding="checkbox" align="left">
                                    <RenderCheckBox name="mobile" val={row.mobile}
                                        onChange={handleChange} id={row.id} />
                                </TableCell>
                                <TableCell padding="checkbox" align="left">
                                    <RenderCheckBox name="email" val={row.email} onChange={handleChange} id={row.id} /></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    </>
}