import { useState, useEffect, useContext, Fragment } from 'react';
import ReactFlow, { ControlButton, Controls, ReactFlowProvider } from 'react-flow-renderer';
import { useHistory } from 'react-router-dom';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';
import { COLOUR_MASTER, WORKORDER_SERVICE_COLOR, WORKORDER_SERVICE_STEP_STATUS, WORK_ORDER_STATUS } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { MdZoomOutMap } from 'react-icons/md';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import { Box, Button, Paper, Typography } from '@material-ui/core';
import _, { capitalize } from 'lodash';
import { useData } from 'src/StateProvider/Provider';

const customNodeStyles = {
  workOrder: { 
    name: 'Work Order', 
    ...COLOUR_MASTER.repairJob 
  },
  workOrderClosed: {
    name: 'Work Order Closed', 
    ...COLOUR_MASTER.closedRepairJob
  },
  preWorkService: {
    name: 'Pre Work Service',
    ...COLOUR_MASTER.preWork
  },
  postWorkService: {
    name: 'Post Work Service',
    ...COLOUR_MASTER.postWork
  },
  stepPassed: {
    name: 'Step Passed',
    ...COLOUR_MASTER.accepted,
    cursor: 'pointer'
  },
  stepFailed: {
    name: 'Step Failed',
    ...COLOUR_MASTER.rejected,
    cursor: 'pointer'
  },
  stepSkipped: {
    name: 'Step Skipped',
    ...COLOUR_MASTER.skipped
  },
  step: {
    name: 'Step',
    ...COLOUR_MASTER.service,
    cursor: 'pointer'
  }
};

const WorkOrderViews = (props) => {
  const { workOrderName, workOrderId, workOrderStatus } = props;

  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [dropdown, setDropdown] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);
  const {
    state: { user }
  }: any = useData();

  if (!user?.user?.brandPolicy?.servicePrePost) {
    customNodeStyles.preWorkService.name = 'Services';
    delete customNodeStyles.postWorkService;
  }

  useEffect(() => {
    fetchViewsData();
  }, [workOrderName]);

  async function fetchViewsData() {
    setLoading(true);
    try {
      const allDetails: any = await axiosInstance().get(`${routes?.workOrder?.path}/${workOrderId}/detail`);
      const stepData = allDetails?.data?.data?.stepData;
      const stepDatas = {};

      stepData
        ?.filter((s) => s?.passFailStatus)
        ?.map((s) => {
          stepDatas[s?.stepId] = s?.passFailStatus;
        });

      var xPosition = 0;
      var flow: any[] = [
        {
          id: `${workOrderId}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'repairJob',
            ref_id: workOrderId,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <Typography variant="body2">{customNodeStyles.workOrder.name}</Typography>
                       <Typography variant="subtitle2">
                       {workOrderName ?? ''}
                       </Typography>
                     </div>
          },
          position: { x: xPosition, y: 70 },
          style: customNodeStyles.workOrder
        }
      ];
      var flowEdge: any[] = [];

      const allServices =  allDetails?.data?.data?.services || [];
      const allSteps = [];
      if (allServices?.length) xPosition += 300;
      let serviceStepIdx = 0;
      const allStepsIds = [];
      const servicesWithNoSteps = []
      allServices?.map((s, sIdx) => {
        allSteps.push(...(s?.steps || []));
        const serviceId = `${s?._id}_${s?.uniqueId}`;
        if (!s?.steps?.length) servicesWithNoSteps.push(serviceId)
        flow.push({
          id: `${serviceId}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'service',
            ref_id: s?._id,
            label: (
              <HtmlTooltip
                arrow
                placement="top"
                title={capitalize(s.type)}
              >
                <div >
                  <Typography variant="body2">{s?.status || ''}</Typography>
                  <Typography variant="subtitle2">{s?.serviceName || ''}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: sIdx * 80 },
          style: s?.preWork || !user?.user?.brandPolicy?.servicePrePost ? customNodeStyles.preWorkService : customNodeStyles.postWorkService
        });
        flowEdge.push({
          id: `workOrder-service-${serviceId}-${workOrderId}`,
          source: `${workOrderId}`,
          arrowHeadType: 'arrow',
          target: `${serviceId}`
        });
        s?.steps?.map((step) => {
          const stepId = `${step?._id}_${_.random(1000, 9999)}`;
          allStepsIds.push(stepId);
          flow.push({
            id: `${stepId}`,
            sourcePosition: 'right',
            targetPosition: 'left',
            type: 'default',
            data: {
              ref_type: 'step',
              label: (
                <HtmlTooltip
                  arrow
                  placement="top"
                  title={'Step'}
                >
                  <div>
                    <Typography variant="body2">{s?.status || ''}</Typography>
                    <Typography variant="subtitle2">{step?.stepName || ''}</Typography>
                  </div>
                </HtmlTooltip>
              )
            },
            position: { x: xPosition + 300, y: serviceStepIdx * 80 },
            style:
              stepDatas[step?._id] && stepDatas[step?._id] === WORKORDER_SERVICE_STEP_STATUS.passed
                ? customNodeStyles.stepPassed
                : stepDatas[step?._id] === WORKORDER_SERVICE_STEP_STATUS.failed
                  ? customNodeStyles.stepFailed
                  : stepDatas[step?._id] === WORKORDER_SERVICE_STEP_STATUS.skipped
                    ? customNodeStyles?.stepSkipped
                    : customNodeStyles.step
          });
          flowEdge.push({
            id: `workOrder-service-steps-${s?._id}_${s?.uniqueId}-${stepId}`,
            source: `${s?._id}_${s?.uniqueId}`,
            arrowHeadType: 'arrow',
            target: `${stepId}`
          });
          serviceStepIdx++;
        });
      });
      if (workOrderStatus === WORK_ORDER_STATUS.completed) {
        xPosition += 600;
        flow.push({
          id: `${workOrderId}-closed`,
          type: 'output',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'repairJob',
            ref_id: workOrderId,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                       <Typography variant="body2">{customNodeStyles.workOrderClosed.name}</Typography>
                       <Typography variant="subtitle2">
                       {workOrderName ?? ''}
                       </Typography>
            </div>
          },
          position: { x: xPosition, y: 70 },
          style: customNodeStyles.workOrderClosed
        });

        allStepsIds.map((id, idx) => {
          flowEdge.push({
            id: `workOrder-service-steps-${workOrderId}-${id}`,
            source: `${id}`,
            arrowHeadType: 'arrow',
            target: `${workOrderId}-closed`
          })
        })
        servicesWithNoSteps?.map((id, idx) => {
          flowEdge.push({
            id: `workOrder-service-steps-${workOrderId}-${id}`,
            source: `${id}`,
            arrowHeadType: 'arrow',
            target: `${workOrderId}-closed`
          })
        })

      }
      setFlowData([...flow, ...flowEdge]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      toastConfig.setToastConfig(err);
    }
  }

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.1 });
  };

  const onElementClick = (event, element) => {
    switch (element.data.ref_type) {
      case 'repairJob':
        break;
      case 'deliveryTicket':
        window.open(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
        break;
      case 'serializedAsset':
        window.open(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
        break;
    }
  };

  return (
    <ContentFullScreen title="Views" fullScreen={fullScreenOpen} setFullScreen={false} isheader={false}>
      <Box marginLeft={2} marginTop={1} display="flex" flexDirection="column">
        <Box>
          <Button
            variant={'outlined'}
            color="default"
            size="small"
            onClick={() => {
              setColorInfo(!colorInfo);
            }}
            aria-controls="action-menu"
            endIcon={colorInfo ? <ExpandLess /> : <ExpandMore />}
          >
            {'Color Info'}
          </Button>
        </Box>
        {colorInfo && (
          <Box>
            <div style={{ marginLeft: 'auto', marginRight: 'auto', position: 'absolute', zIndex: 9999 }}>
              <Paper elevation={3} variant="outlined">
                <Box display="flex" flexDirection="column">
                  {Object.keys(customNodeStyles).map((key) => {
                    return (
                      <Box p={1}>
                        <div
                          style={{
                            display: 'inline-flex',
                            height: '12px',
                            width: '12px',
                            marginRight: '5px',
                            borderRadius: '100%',
                            background: `${customNodeStyles[key].background}`,
                            borderColor: `1px solid ${customNodeStyles[key].borderColor}`
                          }}
                        ></div>
                        {customNodeStyles[key].name}
                      </Box>
                    );
                  })}
                </Box>
              </Paper>
            </div>
          </Box>
        )}
      </Box>
      <div style={fullScreenOpen ? { height: '95vh' } : { height: '68vh' }}>
        {!loading ? (
          flowData.length ? (
            <Fragment>
              <ReactFlowProvider>
                <ReactFlow
                  elements={flowData || []}
                  onLoad={onLoad}
                  selectNodesOnDrag={false}
                  snapToGrid={true}
                  snapGrid={[15, 15]}
                  onElementClick={onElementClick}
                >
                  <Controls>
                    <ControlButton onClick={() => (fullScreenOpen ? setFullScreenOpen(false) : setFullScreenOpen(true))}>
                      <MdZoomOutMap />
                    </ControlButton>
                  </Controls>
                </ReactFlow>
              </ReactFlowProvider>
            </Fragment>
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100 w-100">No Data to Show.</div>
          )
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100 w-100">Loading Views...</div>
        )}
      </div>
    </ContentFullScreen>
  );
};
export default WorkOrderViews;
