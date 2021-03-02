import React, { useState, useEffect } from "react";
import clsx from "clsx";
import {
    Box,
    Button,
    Grid,
    Typography
} from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import _ from "lodash";
import Container from "../../components/Container";
import { GetFields } from '../../axios/index';
import Layout from "../../components/Layout";
import CustomHeader from "./CustomHeader";
import { accountPage } from '../../routes/Accounts'
import { getAccountData } from '../../axios/accounts'
import { Link } from "react-router-dom";
import { getErrorMessage } from '../../services/util'
import DetailPage from './DetailPage'
import Loader from '../../components/Loader'
import CustomToast from '../../components/Helpers/CustomToast'
import "./account.css";

const Roles = () => {
    const history = useHistory();
    const [alertData, setAlertData] = useState({})
    const [loading, setLoading] = useState(false)
    const [data, setData] = useState({})
    const [mainPoints, setMainPoints] = useState({})
    let { id } = useParams();
    useEffect(() => {
        if (id) {
            fetchAccountData()
        }
    }, [id]);

    const fetchAccountData = async () => {
        setLoading(true)
        try {
            let data = await getAccountData(id)
            if (data.status === 200) {
                let initialVal = data.data
                getAccountFields(undefined, initialVal)
            }
        }
        catch (err) {
            setLoading(false)
            let errMes = getErrorMessage(err)
            if (errMes) {
                handleSnackbar(errMes, 'error', true)
            }
        }
    }

    const getAccountFields = (brandId, values) => {
        GetFields('Account', brandId).then(({ data }) => {
            const td = {}, mainPoints = {}
            data.map((_f) => {
                let fd = _f.fieldData

                let val = ""
                if (typeof values[fd.fieldName] === "object" && values[fd.fieldName].optionLabel) {
                    if ("parentAccount" == fd.fieldName) {
                        mainPoints[fd.fieldName] = values[fd.fieldName].optionLabel
                    }
                    val = values[fd.fieldName].optionLabel
                }
                else if (Array.isArray(values[fd.fieldName]) && values[fd.fieldName].length) {
                    values[fd.fieldName].forEach(v => {
                        if (v.optionLabel) val = val ? val + "," + v.optionLabel : v.optionLabel
                    })
                }
                else {
                    if (["accountName", "phone"].indexOf(fd.fieldName) >= 0) {
                        mainPoints[fd.fieldName] = values[fd.fieldName]
                    }
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
            setMainPoints(mainPoints)
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
                {
                    alertData ? <CustomToast
                        open={alertData.open || false}
                        close={() => handleSnackbar('', '', false)}
                        errorMsg={alertData.errorMsg || ''}
                        type={alertData.type || ''}
                    /> : null
                }
                <div>
                    <CustomHeader
                        heading="Account"
                        mainPoints={mainPoints}
                        style={{ marginTop: "150px", minHeight: "200px" }}
                        showHeading={true}
                        subHeading={mainPoints.accountName || ''}
                    >
                        <Box component="span" marginX={1} />
                        <Button
                            variant="outlined"
                            color="primary"
                            style={{ backgroundColor: 'aliceblue' }}
                        >
                            Delete
                  </Button>
                    </CustomHeader>

                    <Container className="detailPageContainer">
                        <Grid container spacing={3}>
                            <Grid item sm={8} md={8} lg={8}>
                                <div className="detailPageDiv1" >
                                    {
                                        loading ? <Loader text="Fetching Data" style={{ marginTop: 100 }} /> :
                                            <DetailPage
                                                data={data}
                                            />
                                    }
                                </div>
                            </Grid>
                            <Grid item sm={4} md={4} lg={4} className="customGrid" >
                                <div className="detailPageDiv2">
                                    {
                                        quickLinks && quickLinks.length ?
                                            quickLinks.map(k => {
                                                return <><Link className="customLink">{k.label || ''}({k.count || 0})</Link><br /></>
                                            }) :
                                            null
                                    }
                                </div>
                                <div className="detailPageDiv3" >
                                    <Typography color="primary" variant="h6">Related Contacts</Typography>
                                    <Box className="customBox1">

                                    </Box>
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
