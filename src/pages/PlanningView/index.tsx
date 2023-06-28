import React, { useEffect, useCallback, useMemo, useState, useContext } from 'react'
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { Box, Tabs, Tab } from '@material-ui/core';
import TabPanel from '../../components/TabPanel';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { sidebarResource } from 'src/constants/helpers';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import { useData } from 'src/StateProvider/Provider';
import { FaWpforms } from 'react-icons/fa';
import { BiFoodMenu } from 'react-icons/bi';
import CalendarView from './Calendar';
import ListView from './List';

const PLANNING_RESOURCE = [
    {
        key: 'rentalManagement',
        resource: sidebarResource.rentalManagement,
        title: routes.rentalManagementDetail.title,
        path: routes.rentalManagementDetail.path,
        fieldName: 'rentalJobName',
        start: 'estimateStartDate',
        end: 'estimateEndDate',
    },
    {
        key: 'planning',
        resource: sidebarResource.planning,
        title: routes.planningDetail.title,
        path: routes.planningDetail.path,
        fieldName: 'planningNumber',
        start: 'startDate',
        end: 'endDate'
    },
    {
        key: 'demandOrder',
        resource: sidebarResource.demandOrder,
        title: routes.demandOrderDetail.title,
        path: routes.demandOrderDetail.path,
        fieldName: 'demandOrderNumber',
        start: 'createDate',
        end: 'estimateDeliveryDate'
    },
    {
        key: 'productionOrder',
        resource: sidebarResource.productionOrder,
        title: routes.productionOrderDetail.title,
        path: routes.productionOrderDetail.path,
        fieldName: 'productionOrderNumber',
        start: 'createDate',
        end: 'estimateDeliveryDate'
    },
    {
        key: 'purchaseRequisition',
        resource: sidebarResource.purchaseRequisition,
        title: routes.purchaseRequisitionDetail.title,
        path: routes.purchaseRequisitionDetail.path,
        fieldName: 'purchaseRequisitionNumber',
        start: 'createDate',
        end: 'estimateDeliveryDate'
    },
    {
        key: 'purchaseOrder',
        resource: sidebarResource.purchaseOrder,
        title: routes.purchaseOrderDetail.title,
        path: routes.purchaseOrderDetail.path,
        fieldName: 'purchaseOrderNumber',
        start: 'purchaseOrderDate',
        end: 'deliveryDate'
    },
    {
        key: 'repairJob',
        resource: sidebarResource.repairJob,
        title: routes.repairJobDetail.title,
        path: routes.repairJobDetail.path,
        fieldName: 'repairJobName',
        start: 'startDate',
        end: 'expectedCompletionDate'
    },
    {
        key: 'sublease',
        resource: sidebarResource.sublease,
        title: routes.subleaseDetail.title,
        path: routes.subleaseDetail.path,
        fieldName: 'subleaseName',
        start: 'estimateStartDate',
        end: 'estimateEndDate'
    },
    {
        key: 'projectSales',
        resource: sidebarResource.projectSales,
        title: routes.projectSalesDetail.title,
        path: routes.projectSalesDetail.path,
        fieldName: 'projectName',
        start: 'startDate',
        end: 'endDate'
    },
    {
        key: 'fieldServiceOrder',
        resource: sidebarResource.fieldServiceOrder,
        title: routes.fieldServiceOrderDetail.title,
        path: routes.fieldServiceOrderDetail.path,
        fieldName: 'fieldServiceOrderNumber',
        start: 'estimateStartDate',
        end: 'estimateEndDate'
    },
]

function PlanningView() {

    const toastConfig = useContext(CustomToastContext);
    const {
        state: { user, selectedEntity, permissions }
    }: any = useData();

    const history = useHistory();
    const parsed = queryString.parse(history.location.search);
    const { tab }: any = parsed;

    const [tabValue, setTabValue] = useState(tab ? parseInt(tab) : 0);
    const [resourceList, setResourceList] = useState([])
    const [selectedResource, setSelectedResource] = useState(null)

    useEffect(() => {
        const options: any = [];
        PLANNING_RESOURCE?.forEach((item) => {
            if (permissions[item.key] && permissions[item.key]?.isRead === true) {
                options.push({ ...item, title: routes[item.key] ? routes[item.key]?.title : item.title })
            }
        })
        setResourceList(options)
    }, [])

    useEffect(() => {
        const resource = history?.location?.state?.resource;
        if (resource && resourceList?.find(_r => _r?.resource === resource)) {
            setSelectedResource(resourceList?.find(_r => _r?.resource === resource))
        }
    }, [resourceList, history?.location?.state?.resource])

    const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
        setTabValue(newValue);
        history.push(`?tab=${newValue}`);
    };

    function a11yProps(index: any) {
        return {
            id: `main-tab-${index}`,
            'aria-controls': `main-tabpanel-${index}`
        };
    }

    return (
        <>
            <Box className="main-container-v1">
                <Box className="headerbox-v1">
                    <Box className="nav-v1">
                        <CustomBreadCrumbs routes={[{ title: routes.planningView.title, path: routes.planningView.path }]} />
                    </Box>
                </Box>
                <Box className={`detail-container-v1`}>
                    <Tabs
                        className="new-tab-container-v1"
                        value={tabValue}
                        onChange={handleMainTabChange}
                        textColor="primary"
                        TabIndicatorProps={{
                            style: {
                                display: 'none'
                            }
                        }}
                    >
                        <Tab
                            className={'tabLayout'}
                            label={
                                <div className="d-flex align-items-center tab-font">
                                    <FaWpforms className="mr-1" fontSize="inherit" /> Calendar
                                </div>
                            }
                            {...a11yProps(0)}
                        />
                        <Tab
                            className={'tabLayout'}
                            label={
                                <div className="d-flex align-items-center tab-font">
                                    <BiFoodMenu className="mr-1" fontSize="inherit" /> List
                                </div>
                            }
                            {...a11yProps(1)}
                        />
                    </Tabs>
                    <TabPanel value={tabValue} index={0}>
                        <Box>
                            <CalendarView
                                resourceList={resourceList}
                                selectedResource={selectedResource}
                                setSelectedResource={setSelectedResource} />
                        </Box>
                    </TabPanel>
                    <TabPanel value={tabValue} index={1}>
                        <Box>
                            <ListView
                                resourceList={resourceList}
                                selectedResource={selectedResource}
                                setSelectedResource={setSelectedResource} />
                        </Box>
                    </TabPanel>
                </Box>
            </Box>
        </>
    )
}

export default PlanningView;