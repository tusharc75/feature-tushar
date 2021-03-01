import React, { useState, useEffect } from "react";
import clsx from "clsx";
import {
    Box,
    useTheme,
    makeStyles,
    Button,
    CircularProgress
} from "@material-ui/core";
import { useHistory, useLocation } from "react-router-dom";
import _ from "lodash";
import Container from "../../components/Container";
import { GetFields } from '../../axios/index';
import FullScreenDialog from "../../components/Helpers/FullScreenDialog";
import CustomToast from "../../components/Helpers/CustomToast";
import Layout from "../../components/Layout";
import BrandHeader from "../../components/BrandHeader";
import { accountPage } from '../../routes/Accounts'
import { craeteAccount, getAccountData } from '../../axios/accounts'
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
                if (Array.isArray(values[fd.fieldName]) && values[fd.fieldName].length) {
                    values[fd.fieldName].forEach(v => {
                        if (v.optionLabel) val = val ? val + "," + v.optionLabel : v.optionLabel
                    })
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

    return (
        <>
            <Layout>
                <div>
                    <BrandHeader heading="Roles"
                        style={{ marginTop: "150px", minHeight: "200px" }}
                        showHeading={false}>

                        <Box component="span" marginX={1} />
                        <Button
                            variant="contained"
                            color="primary"
                        >
                            Add
                  </Button>
                        <Box component="span" marginX={1} />
                        <Button
                            variant="contained"
                            color="primary"
                        >
                            Edit
                  </Button>
                        <Box component="span" marginX={1} />
                        <Button
                            variant="contained"
                            color="primary"
                        >
                            Delete
                  </Button>
                    </BrandHeader>
                    <Container >
                        <div style={{ width: "100%" }}>
                            {
                                loading ? <Box style={{ textAlign: 'center' }}>
                                    <span >  <CircularProgress /> Fetching Data</span>
                                </Box> :
                                    <DetailPage
                                        data={data}
                                    />
                            }
                        </div>
                    </Container>
                    <FullScreenDialog heading={"AccountDetails"}>

                    </FullScreenDialog>


                </div>
            </Layout>
        </>
    );
};

export default Roles;
