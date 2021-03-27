import React, { useState, useEffect } from "react";
import {
    Box,
    Button,
    Grid,
    Typography,
    IconButton,
} from "@material-ui/core";
import { useHistory, useParams } from "react-router-dom";
import _ from "lodash";
import { Skeleton } from "@material-ui/lab";
import Container from "../../components/Container";
import Layout from "../../components/Layout";
import DetailsPageHeader from '../../components/DetailsPageHeader'
import { accountPage } from '../../routes/Accounts'
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog'
import { useData } from '../../StateProvider/Provider';
import DetailsPage from '../../components/Shared/DetailsPage'
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import routes from '../../components/Helpers/Routes';
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import BoxWithBorder from "../../components/BoxWithBorder";
import RelatedContactsBox from './RelatedContacts'
import axiosInstance from './../../axios/axiosInstance'
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import AccountHierarchy from './AccountHierarchy';
import OpportunityTab from './OpportunityTab'
import Activity from "../../components/Activity";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import ControlPointIcon from '@material-ui/icons/ControlPoint';
import accountClass from "./account.module.scss"
import UpdateDetailsDialog from "../../components/Shared/UpdateDetailsDialog";
import MuiAccordion from "@material-ui/core/Accordion";
import MuiAccordionSummary from "@material-ui/core/AccordionSummary";
import MuiAccordionDetails from "@material-ui/core/AccordionDetails";
import { opportunityPage } from '../../routes/Opportunity'
import { withStyles } from "@material-ui/core/styles";
import CreateOpportunity from '../Opportunities/CreateOpportunity'
import CreateContact from '../Contact/CreateContact/CreateContact';
import DeleteButton from '../../components/Helpers/DeleteButton'
import { makeStyles } from "@material-ui/core/styles";
import { removeEmptyKeys, getObjKeysWithValues, formValidation } from "../../constants/helpers";
import { CustomEventEmitter } from './../../axios/events';
import { Link } from "react-router-dom";
import ManageAccount from "./ManageAccount/ManageAccount";

const Accordion = withStyles({
    root: {
        border: "1px solid rgba(0, 0, 0, .125)",
        boxShadow: "none",
        "&:not(:last-child)": {
            borderBottom: 0,
        },
        "&:before": {
            display: "none",
        },
        "&$expanded": {
            margin: "auto",
        },
        borderRadius: "10px",
    },
    expanded: {},
})(MuiAccordion);

const AccordionSummary = withStyles({
    root: {
        backgroundColor: "rgba(0, 0, 0, .03)",
        borderBottom: "1px solid rgba(0, 0, 0, .125)",
        marginBottom: -1,
        minHeight: 56,
        "&$expanded": {
            minHeight: 56,
        },
    },
    content: {
        "&$expanded": {
            margin: "12px 0",
        },
    },
    expanded: {},
})(MuiAccordionSummary);

const AccordionDetails = withStyles((theme) => ({
    root: {
        padding: theme.spacing(1),
        display: "block",
    },
}))(MuiAccordionDetails);


const useStyles = makeStyles((theme) => ({
    container: {
        padding: "0px",
        minHeight: "auto"
    },
    opportunityTab: {
        marginTop: '10px'
    }
}));

const Roles = () => {
    const history = useHistory();
    const classes = useStyles();
    const { state: { user } }: any = useData();
    const [headingLbl, setHeadingLbl] = useState('')
    const [isUpdating, setUpdating] = useState(false);
    const [accountData, setAccountData] = useState<any>({})
    const [relatedContacts, setRelatedContacts] = useState([])
    const [loading, setLoading] = useState(false)
    const [showConfirmBox, setShowConfirmBox] = useState(false);
    const [showApproveDisapproveConfirmBox, setShowApproveDisapproveConfirmBox] = useState(false);
    const [accountFields, setAccountFields] = useState([])
    const [mainPoints, setMainPoints] = useState({})
    const [customizedRoutes, setCustomizedRoutes] = useState<any>([]);
    const [currentTabIndex, setCurrentTabIndex] = useState(0);
    const [accountHierarchyData, setAccountHierarchyData] = useState([]);
    const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
    const [relatedContactsLoading, setRelatedContactsLoading] = useState(false)
    const [expanded, setExpanded] = React.useState({
        opportunity: false
    });
    const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState(false);
    const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);
    const [canEdit, setCanEdit] = useState(false)

    let { id } = useParams();

    const [accountPermissions, setAccountPermissions] = useState({ isCreate: false, isUpdate: false, isRead: false, isDelete: false, approveAccount: false });

    // const [refresh, setRefresh] = useState(true);

    // const handleActivityRefresh = () => {
    //     setRefresh(false)
    //     setRefresh(true)
    // }

    useEffect(() => {
        const data = user.role?.sideBar;

        if (data) {
            const hasAccountPermission = data.find(d => d.name == "Account");
            if (hasAccountPermission) {
                setAccountPermissions(
                    {
                        isCreate: hasAccountPermission.isCreate,
                        isUpdate: hasAccountPermission.isUpdate,
                        isRead: hasAccountPermission.isRead,
                        isDelete: hasAccountPermission.isDelete,
                        approveAccount: user.user?.permissions?.approveAccount
                    });
            }
        }
    }, [user]);

    useEffect(() => {
        if (id) {
            fetchAccountData()
        }
    }, [id]);

    useEffect(() => {
        if (accountData._id && relatedContacts.length === 0) {
            fetchRelatedContacts()
        }
    }, [accountData])

    const fetchAccountData = async () => {
        setLoading(true)

        axiosInstance().get(`/account/${id}`).then(({ data: { data } }) => {
            setCustomizedRoutes([routes.account, { title: data.accountName }]);

            setHeadingLbl(data.accountName || '')
            handleMainPonts(data)
            setAccountData(data)
            setCanEdit([...data?.collaborator, data?.owner].some(obj => obj.optionValue === user.user._id))

            if (data.parentHierarchy && data.parentHierarchy.length > 0) {

                let accounts = data.parentHierarchy;
                const { parentHierarchy, ...rest } = data;
                accounts.push({ ...rest, current: true });

                let newData = [];

                accounts.map(account => {
                    const updatedAccount = {
                        _id: account._id,
                        accountName: `${account.accountName}`,
                        typeOfAccount: account.typeOfAccount?.optionLabel,
                        industry: account.industry?.optionLabel,
                        typeOfBusiness: account.typeOfBusiness,
                        phone: account.phone,
                        type: "child"
                    };

                    if (account.parentAccount) {
                        updatedAccount["parentAccountText"] = account.parentAccount.optionLabel;
                        updatedAccount["parentAccountId"] = account.parentAccount.optionValue;
                        updatedAccount["type"] = "parent";
                    }

                    newData.push(updatedAccount);
                })

                setAccountHierarchyData([...newData]);

            } else {
                setAccountHierarchyData([
                    {
                        _id: data._id,
                        accountName: data.accountName,
                        typeOfAccount: data.typeOfAccount?.optionLabel,
                        industry: data.industry?.optionLabel,
                        typeOfBusiness: data.typeOfBusiness,
                        // parentAccount: data.parentAccount,
                        phone: data.phone
                    }
                ])
            }

            if (accountFields.length === 0) {
                getAccountFields()
            }
            else {
                setLoading(false)
            }
        }).catch(() => {
            setLoading(false)
        })
    }

    const handleMainPonts = (data) => {
        let mainPoints = {
            Phone: data.phone || ''
        }
        if (data?.parentAccount?.optionLabel) {
            mainPoints["Parent Account"] = data.parentAccount.optionLabel
        }
        if (data?.owner?.optionLabel) {
            mainPoints["Primary Owner"] = data.owner.optionLabel
        }
        setMainPoints(mainPoints)
    }

    const getAccountFields = () => {
        axiosInstance().get(`/field?resource=Account`).then(({ data: { data } }) => {
            setAccountFields(data.filter(d => d.isUpdate || d.isRead))
            setLoading(false)
        });
    };

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
            label: "Quotes",
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

    const handleDeleteAcc = () => {
        if (accountData?._id) {
            axiosInstance().put(`/account/remove`, { ids: [accountData._id] }).then(({ data }) => {
                CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: data.message });
                goBackToListing()
                setShowConfirmBox(false)
            }).catch(err => {
                setShowConfirmBox(false)
            })
        }
        else {
            setShowConfirmBox(false)
        }
    }

    const handleApproveDisapprove = () => {
        axiosInstance().post(`/account/approve`, { ids: [accountData._id], approved: !accountData.static?.approved })
            .then(() => {
                fetchAccountData()
                setShowApproveDisapproveConfirmBox(false);
            }).catch(() => {
                setShowApproveDisapproveConfirmBox(false);
            })
    }

    // const handleUpdateAccount = async (setTouched, values, setValues, setErrors, saveAndNew = false, resetForm) => {
    //     const errors = formValidation(values, _.cloneDeep(entityData.fields));
    //     if (Object.keys(errors).length) {
    //         entityData.fields.forEach((input) => {
    //             if (input.required) {
    //                 setTouched(input.fieldName, true);
    //             }
    //         });
    //     } else {
    //         // handleLoading(true, saveAndNew)
    //         setUpdating(true);
    //         // values = removeEmptyKeys(values)
    //         // if (values.employees) {
    //         //     values.employees = parseInt(values.employees)
    //         // }

    //         const updatedData = {
    //             ...values,
    //             _id: accountData._id,
    //         };

    //         axiosInstance().put('/account', removeEmptyKeys(updatedData))
    //             .then(() => {
    //                 fetchAccountData()
    //                 CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: "Successfully saved" });
    //                 setUpdating(false);
    //                 setOpenUpdateDialog(false)
    //             })
    //             .catch((err) => {
    //                 setUpdating(false);
    //             });
    //         setErrors({});
    //     }
    // }

    const onUpdateAccount = (values) => {
        setUpdating(true);

        const updatedData = {
            ...values,
            _id: accountData._id,
        };

        axiosInstance().put('/account', removeEmptyKeys(updatedData))
            .then(() => {
                fetchAccountData()
                CustomEventEmitter.dispatch("show-toast", { type: "success", errorMsg: "Successfully saved" });
                setUpdating(false);
                setOpenUpdateDialog(false)
            })
            .catch((err) => {
                setUpdating(false);
            });
    };

    const goBackToListing = () => {
        history.push({
            pathname: accountPage.path
        });
    }

    const fetchRelatedContacts = () => {
        setRelatedContactsLoading(true)
        axiosInstance().get(`/contact/related-contact/${accountData._id}`)
            .then(({ data: { data } }) => {
                setRelatedContacts(data)
                setRelatedContactsLoading(false)
            }).catch(err => {
                setRelatedContactsLoading(false)
            })
    }

    const handlePanelChange = (curActive) => {
        let tempData = { ...expanded }
        tempData[curActive] = tempData[curActive] ? false : true
        setExpanded(tempData)
    };
    const handleOpneUpdateDialog = () => {
        setOpenUpdateDialog(true);
    };

    const closeUpdateDIalog = () => {
        setOpenUpdateDialog(false);
    };

    const handleViewAll = (path, state) => {
        history.push({
            pathname: path,
            state: {
                ...state
            },
        });
    };
    const handleCreateNewOpp = () => {
        setShowCreateOpportunityDialog(true);
    }
    const handleCreateContact = () => {
        setShowCreateContactDialog(true);
    }
    return (
        <>
            <Layout>
                <Grid container direction="row">
                    <CustomBreadCrumbs routes={customizedRoutes} />
                </Grid>
                <div>
                    {
                        <DetailsPageHeader
                            loading={loading}
                            heading={headingLbl}
                            logo={accountData?.accountLogo ? accountData.accountLogo : undefined}
                            mainPoints={mainPoints}
                            showHeading={true}
                        >
                            {
                                accountPermissions.isUpdate && canEdit ?
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={handleOpneUpdateDialog}
                                    >
                                        Edit
                                    </Button> : null
                            }

                            <Box component="span" marginX={1} />
                            {
                                accountPermissions.isDelete && accountData?.owner?.optionValue && user?.user?._id &&
                                    accountData.owner.optionValue === user.user._id ?
                                    <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />
                                    : null
                            }
                        </DetailsPageHeader>
                    }

                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={12} md={8} lg={8}>
                            <Container padding="8px">
                                <BoxWithBorder padding="8px">
                                    {loading ? (
                                        <Grid container spacing={2}>
                                            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                                                <Grid item sm={6} md={6}>
                                                    <Skeleton variant="text" width="100px" height="16px" />
                                                    <Box marginY={1} />
                                                    <Skeleton width="100%" height="50px" />
                                                </Grid>
                                            ))}
                                        </Grid>
                                    ) : (
                                        <Box>
                                            <>
                                                <Tabs
                                                    className="mb-4"
                                                    value={currentTabIndex}
                                                    onChange={(index, newValue) => { setCurrentTabIndex(newValue) }}
                                                    indicatorColor="primary"
                                                    textColor="primary"
                                                    aria-label="icon tabs example"
                                                >
                                                    <Tab label="Details" aria-controls="a11y-tabpanel-0" id="a11y-tab-0" />
                                                    <Tab label="Account Hierarchy" aria-controls="a11y-tabpanel-1" id="a11y-tab-1" />
                                                </Tabs>
                                                <Box hidden={currentTabIndex !== 0}>
                                                    <DetailsPage data={accountData} fields={accountFields} />
                                                </Box>

                                                <Box hidden={currentTabIndex !== 1}>
                                                    <AccountHierarchy data={accountHierarchyData} currentAccountId={accountData._id} />
                                                </Box>

                                            </>

                                        </Box>
                                    )}
                                </BoxWithBorder>
                                <Box marginY={2} />

                                <Container styles={{ padding: "0px", minHeight: "auto" }}>
                                    {/* onChange={handleChange('panel1')} */}
                                    <Accordion square expanded={expanded["opportunity"]}>
                                        <AccordionSummary
                                            aria-controls="user-panel-content"
                                            id="user-panel-header"
                                        >
                                            <Grid container>
                                                <Grid item xs={8}>
                                                    <Box display="flex">
                                                        <Box>
                                                            <IconButton
                                                                size="small"
                                                                onClick={(event) => handlePanelChange('opportunity')} >
                                                                {expanded["opportunity"] === true ? (
                                                                    <ExpandLessIcon />
                                                                ) : (
                                                                    <ExpandMoreIcon />
                                                                )}
                                                            </IconButton>
                                                        </Box>
                                                        <Box padding="5px">
                                                            <Typography variant="subtitle2">
                                                                Opportunity ({10})
                                                     </Typography>
                                                        </Box>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={4} container justify="flex-end">
                                                    <IconButton
                                                        color="primary"
                                                        size="small"
                                                        onClick={handleCreateNewOpp}
                                                    >
                                                        <ControlPointIcon />
                                                    </IconButton>
                                                </Grid>
                                            </Grid>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            {loading ? (
                                                <CommonSkeleton lenArray={[...Array(4).keys()]} />
                                            ) : (
                                                <>
                                                    {
                                                        expanded['opportunity'] ?
                                                            <>
                                                                <Grid container spacing={2}>
                                                                    <Grid item md={12}>

                                                                        <div className={classes.opportunityTab} >
                                                                            <OpportunityTab data={[]} />
                                                                        </div>
                                                                    </Grid>
                                                                    <Grid item md={12} sm={12} xs={12}>
                                                                        <Button
                                                                            variant="outlined"
                                                                            onClick={() => handleViewAll(opportunityPage.path, {})}
                                                                            fullWidth
                                                                        >
                                                                            View All
                                                                        </Button>
                                                                    </Grid>
                                                                </Grid>
                                                            </> : null
                                                    }
                                                </>
                                            )}
                                        </AccordionDetails>
                                    </Accordion>
                                </Container>
                            </Container>
                        </Grid>
                        <Grid item xs={12} sm={12} md={4} lg={4}
                            className={`${accountClass.account_activities_div}`} >
                            <Container styles={{ padding: "8px", minHeight: "auto", width: '100%' }} >
                                <Grid container>
                                    <Grid item xs={12}>
                                        {
                                            accountData && <div>
                                                <Activity relatedTo={[
                                                    { type: "account", referenceId: accountData._id, access: true }
                                                ]} handleActivityRefresh={() => { }} />
                                            </div>
                                        }
                                    </Grid>
                                    {/* <Grid item xs={12}>
                                        <div className={`${accountClass.detail_page_div2}`}>
                                            {
                                                quickLinks && quickLinks.length ?
                                                    quickLinks.map((k, index) => {
                                                        return <Link key={index} to={k}
                                                            className={`${accountClass.custom_link}`}>{k.label || ''}({k.count || 0})</Link>
                                                    }) :
                                                    null
                                            }
                                        </div>
                                    </Grid> */}

                                    <Grid item xs={12}>
                                        <BoxWithBorder style={{ marginTop: "3%", padding: '0px' }}>
                                            <div className={`${accountClass.detail_page_div3}`}>
                                                <div className={`${accountClass.related_contacts}`}>
                                                    <Typography color="primary"
                                                        variant="h6"
                                                        style={{ margin: "0 10px" }} >Related Contacts</Typography>
                                                    <span>
                                                        <IconButton
                                                            onClick={handleCreateContact}
                                                            color="primary"
                                                            size="small" >
                                                            <ControlPointIcon />
                                                        </IconButton> </span>
                                                </div>
                                                {
                                                    relatedContactsLoading ? (
                                                        <CommonSkeleton lenArray={[...Array(4).keys()]} />
                                                    ) : <>
                                                        <Box className={`${accountClass.custom_box1}`}>
                                                            <RelatedContactsBox
                                                                contacts={relatedContacts}
                                                            />
                                                        </Box>
                                                        <div className={`${accountClass.view_all_btn}`}>
                                                            <Button
                                                                variant="outlined"
                                                                className={`${accountClass.btn}`}
                                                            >View All</Button></div>
                                                    </>
                                                }
                                            </div>
                                        </BoxWithBorder>
                                    </Grid>
                                </Grid>
                            </Container>
                        </Grid>


                    </Grid>
                    {
                        showConfirmBox ? (
                            <ConfirmationDialog
                                open={showConfirmBox}
                                message={`Are you sure you want to delete this Account ${accountData.accountName || ''}`}
                                onClose={() => setShowConfirmBox(false)}
                                onOk={handleDeleteAcc}
                            />
                        ) : null
                    }
                    {
                        showApproveDisapproveConfirmBox ? (
                            <ConfirmationDialog
                                open={showApproveDisapproveConfirmBox}
                                message={`Are you sure you want to ${accountData.static?.approved ? 'disapprove' : "approve"} this Account ?`}
                                onClose={() => setShowApproveDisapproveConfirmBox(false)}
                                onOk={handleApproveDisapprove}
                            />
                        ) : null
                    }
                    {openUpdateDialog && (
                        <ManageAccount
                            isNew={false}
                            open={openUpdateDialog}
                            onClose={closeUpdateDIalog}
                            entityData={{ fields: accountFields.map((f) => { return f.fieldData }), initialValues: getObjKeysWithValues(accountData, accountFields.map((f) => { return f.fieldData })) }}
                            loading={loading}
                            handleSubmit={onUpdateAccount}
                        />
                        // <UpdateDetailsDialog
                        //     title={`Editing  ${accountData?.accountName ?? ''}`}
                        //     openDialog={openUpdateDialog}
                        //     onClose={closeUpdateDIalog}
                        //     data={accountData}
                        //     fields={accountFields}
                        //     isUpdating={isUpdating}
                        //     handleUpdate={handleUpdateAccount}
                        // />
                    )}

                    {
                        showCreateOpportunityDialog && <CreateOpportunity
                            open={showCreateOpportunityDialog}
                            onClose={() => setShowCreateOpportunityDialog(false)}
                            onSuccess={() => {
                                setShowCreateOpportunityDialog(false);
                                // fetchOpportunities()
                            }}
                        />
                    }
                    {
                        showCreateContactDialog && <CreateContact
                            open={showCreateContactDialog}
                            onClose={() => setShowCreateContactDialog(false)}
                            onSuccess={() => {
                                setShowCreateContactDialog(false);
                                fetchRelatedContacts()
                            }}
                        // entityDetails={createContactEntityDetails}
                        />
                    }
                </div>
            </Layout >
        </>
    );
};

export default Roles;
