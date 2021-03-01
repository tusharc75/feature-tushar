import React, { useState, useEffect } from "react";
import clsx from "clsx";
import {
    Box,
    useTheme,
    makeStyles,
    Button,
    Grid,
    CircularProgress,
    Typography
} from "@material-ui/core";
import { useHistory, useLocation } from "react-router-dom";
import _ from "lodash";
import Container from "../../components/Container";
import { GetFields } from '../../axios/index';
import FullScreenDialog from "../../components/Helpers/FullScreenDialog";
import CustomToast from "../../components/Helpers/CustomToast";
import Layout from "../../components/Layout";
import CustomHeader from "./CustomHeader";
import { accountPage } from '../../routes/Accounts'
import { craeteAccount, getAccountData } from '../../axios/accounts'
import { CheckBoxOutlineBlankRounded, DeviceHubOutlined } from '@material-ui/icons'
import { Link, withRouter } from "react-router-dom";
import { getErrorMessage } from '../../services/util'
import DetailPage from './DetailPage'

const Roles = () => {
    const history = useHistory();
    const { pathname } = useLocation();
    const [alertData, setAlertData] = useState({})
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({})
    useEffect(() => {
        if (history?.location?.state?.accountId) {
            fetchAccountData()
        }
    }, [history]);

    const fetchAccountData = async () => {
        setLoading(true)
        let accId = history.location.state.accountId
        try {
            let data = await getAccountData(accId)
            if (data.status === 200 && Object.keys(data.data)) {
                let initialVal = data.data
                getAccountFields(undefined, initialVal)
            }
        }
        catch (err) {
            let errMes = getErrorMessage(err)
            if (errMes) {
                handleSnackbar(errMes, 'error', true)
            }
        }
    }

    const getAccountFields = (brandId, values) => {
        GetFields('Account', brandId).then(({ data }) => {
            const td = {};
            data.map((_f) => {
                let fd = _f.fieldData

                let val = ""
                if (typeof values[fd.fieldName] === "object" && values[fd.fieldName].optionLabel) {
                    val = values[fd.fieldName].optionLabel
                }
                else if (Array.isArray(values[fd.fieldName]) && values[fd.fieldName].length) {
                    values[fd.fieldName].forEach(v => {
                        if (v.optionLabel) val = val ? val + "," + v.optionLabel : v.optionLabel
                    })
                }
                else {
                    val = values[fd.fieldName]
                }


                if (td[fd.sectionName]) {
                    td[fd.sectionName] = {
                        ...td[fd.sectionName],
                        [fd.fieldLabel]: val
                    }
                }
                else {
                    td[fd.sectionName] = {}
                    td[fd.sectionName] = {
                        [fd.fieldLabel]: val
                    }
                }
            });
            setData(td)
            setLoading(false)
        });
    };

    const handleSnackbar = (msg, type, isOpen) => {
        setAlertData({
            errorMsg: msg,
            type: type,
            open: isOpen
        })
    };

    const goToBackPage = () => {
        history.push({
            pathname: accountPage.path
        })
    }

    const tabs = ["Table", "Users"];
    const quickLinks = [
        {
            label: "Account Heirarchy",
            count: 0
        },
        {
            label: "Projects",
            count: 0
        },
        {
            label: "Opportunity",
            count: 0
        },
        {
            label: "Qoutes",
            count: 0
        },
        {
            label: "Accounts Teams",
            count: 0
        },
        {
            label: "Contacts",
            count: 0
        },
    ]
    return (
        <>
            <Layout>
                <div>
                    <CustomHeader
                        heading="Account"
                        style={{ marginTop: "150px", minHeight: "200px" }}
                        showHeading={true}>
                        <Box component="span" marginX={1} />
                        <Button
                            variant="outlined"
                            color="primary"
                            style={{ backgroundColor: 'aliceblue' }}
                        >
                            Delete
                  </Button>
                    </CustomHeader>

                    <Container style={{ width: "100%", backgroundColor: 'aliceblue' }}>
                        <Grid container spacing={5}>
                            <Grid item sm={8} md={8} lg={8}>
                                <div style={{ backgroundColor: 'white' }}>
                                    {
                                        loading ? <Box style={{ textAlign: 'center' }}>
                                            <span >  <CircularProgress /> Fetching Data</span>
                                        </Box> :
                                            <DetailPage
                                                data={data}
                                            />
                                    }
                                </div>
                            </Grid>
                            <Grid item sm={4} md={4} lg={4} style={{ backgroundColor: 'aliceblue' }}  >
                                <div style={{ backgroundColor: 'white', marginBottom: '10px' }}>
                                    {
                                        quickLinks && quickLinks.length ?
                                            quickLinks.map(k => {
                                                return <><Link>{k.label || ''}({k.count || 0})</Link><br /></>
                                            }) :
                                            null
                                    }
                                </div>
                                <div style={{ backgroundColor: 'white' }}>
                                    <Typography>Related Contacts</Typography>
                                </div>
                            </Grid>
                        </Grid>
                    </Container>
                </div>
            </Layout>
        </>
    );
};

export default Roles;
