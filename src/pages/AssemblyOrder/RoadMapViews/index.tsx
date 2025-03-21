import _, { isEmpty, startCase } from 'lodash';
import { useContext, useState, useEffect, Fragment } from 'react';
import ReactFlow, { Controls, ControlButton, ReactFlowProvider } from 'react-flow-renderer';
import axiosInstance from '../../../axios/axiosInstance';
import { COLOUR_MASTER, MATERIAL_TYPE } from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { MdZoomOutMap } from 'react-icons/md';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { Box, Paper, Typography } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useData } from 'src/StateProvider/Provider';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const AssemblyOrderViews = (props) => {
  const { assemblyOrderNumber, id } = props;
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const toastConfig = useContext(CustomToastContext);
  const [fullDialogueOpen, setFullDialogueOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const {
    state: { resources }
  }: any = useData();

  const customNodeStyles = {
    assemblyOrder: {
      name: 'Assembly Order',
      ...COLOUR_MASTER.purchaseOrder
    },
    product: {
      name: 'Product',
      ...COLOUR_MASTER.product
    },
    workOrder: {
      name: 'Work Order',
      ...COLOUR_MASTER.purchaseOrder
    },
    package: {
      name: 'Package',
      ...COLOUR_MASTER.assets
    },
    serializedPackage: {
      name: 'Serialized Package',
      ...COLOUR_MASTER.assets
    },
    parentSerializedPackage: {
      name: 'Parent Serialized package',
      ...COLOUR_MASTER.receivingTicket
    }
    // closed: {
    //   name: 'Closed',
    //   background: themeColor === 'dark' ? 'rgb(219,175,175)' : '#FFEAEA',
    //   borderColor: '#FFA0A0'
    // }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`${routes.assemblyOrder.path}/work-order/${id}`);

      var xPosition = 0;
      const flow: any[] = [
        {
          id: `${id}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'assemblyOrder',
            ref_id: id,
            label: (
              <HtmlTooltip arrow placement="top" title={resources?.assemblyOrder?.titleSingular}>
                <div>
                  <Typography variant="body2">{resources?.assemblyOrder?.titleSingular}</Typography>
                  <Typography variant="subtitle2">{assemblyOrderNumber}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: 70 },
          style: customNodeStyles.assemblyOrder
        }
      ];
      const flowEdge: any[] = [];
      xPosition += 300;
      const childPosition: any = {};

      const parentPackage = data?.filter((e) => e.type === MATERIAL_TYPE.package && !e?.parentId);
      parentPackage?.forEach((parent: any, pIdx) => {
        flow.push({
          id: `${parent?._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: parent?.type,
            ref_id: parent?.materialId,
            label: (
              <HtmlTooltip arrow placement="top" title={startCase(parent?.type)}>
                <div>
                  <Typography variant="body2">{startCase(parent?.type)}</Typography>
                  <Typography variant="subtitle2">{parent?.packageDetail?.packageName}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: {
            x: xPosition,
            y: pIdx * 95
          },
          style: customNodeStyles.package
        });
        flowEdge.push({
          id: `${parent?._id}`,
          source: `${id}`,
          arrowHeadType: 'arrow',
          target: `${parent?._id}`
        });
        generateChild(parent, data, flow, flowEdge, xPosition, childPosition);
      });

      const workOrders = data?.filter((e) => e.workOrder && e.type === MATERIAL_TYPE.package);

      const xPositions: any = Object.values(childPosition)?.map((d) => d);
      if (workOrders?.length) {
        xPosition = (xPositions?.length ? (Math.max(...xPositions)) : xPosition) + 300;
      }
      workOrders?.map((w: any, wIdx) => {
        flow.push({
          id: `${w?.workOrder._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'workOrder',
            ref_id: w?.workOrder?._id,
            label: (
              <HtmlTooltip arrow placement="top" title={'Work Order'}>
                <div>
                  <Typography variant="body2">{'Work Order'}</Typography>
                  <Typography variant="subtitle2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {w?.workOrder?.workOrderNumber}
                  </Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: {
            x: xPosition,
            y: wIdx * 80
          },
          style: customNodeStyles.workOrder
        });
        flowEdge.push({
          id: `${w?.workOrder?._id}`,
          source: `${w._id}`,
          arrowHeadType: 'arrow',
          target: `${w?.workOrder?._id}`
        });
      });

      const serializedPackages = data?.filter((e) => e.workOrder && e.type === MATERIAL_TYPE.package && e.serializedPackage);

      if (serializedPackages?.length) {
        xPosition += 300;
      }
      serializedPackages?.map((e, cmpIdx) => {
        flow.push({
          id: `${e.serializedPackage.optionValue}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'serializedPackage',
            ref_id: e.serializedPackage.optionValue,
            label: (
              <HtmlTooltip arrow placement="top" title={resources?.serializedPackage?.titleSingular}>
                <div>
                  <Typography variant="body2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {resources?.serializedPackages?.titleSingular}
                  </Typography>
                  <Typography variant="subtitle2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {e.serializedPackage.optionLabel}
                  </Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: {
            x: xPosition,
            y: cmpIdx * 80
          },
          style: customNodeStyles.serializedPackage
        });
        flowEdge.push({
          id: `${e.serializedPackage.optionValue}`,
          source: `${e.workOrder._id}`,
          arrowHeadType: 'arrow',
          target: `${e.serializedPackage.optionValue}`
        });
      });

      setFlowData([...flow, ...flowEdge]);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const generateChild = (parent, material, flow, flowEdge, xPosition, childPosition) => {
    const child = material?.filter((m) => m?.parentId === parent?._id && m?.type === MATERIAL_TYPE.package);
    if (child?.length) {
      childPosition[parent?._id] = childPosition[parent?._id] ? childPosition[parent?._id] + 300 : xPosition + 300;
    }
    child?.forEach((item: any, cIdx) => {
      childPosition[item?._id] = childPosition[item?.parentId];
      flow.push({
        id: `${item?._id}`,
        sourcePosition: 'right',
        targetPosition: 'left',
        type: 'default',
        data: {
          ref_type: item?.type,
          ref_id: item?.materialId,
          label: (
            <HtmlTooltip arrow placement="top" title={startCase(item?.type)}>
              <div>
                <Typography variant="body2">{startCase(item?.type)}</Typography>
                <Typography variant="subtitle2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item?.packageDetail?.packageName}
                </Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: {
          x: childPosition[item?._id],
          y: cIdx * 80
        },
        style: customNodeStyles.package
      });
      flowEdge.push({
        id: `parent-child-${item._id}-${item.parentId}`,
        source: `${item.parentId}`,
        arrowHeadType: 'arrow',
        target: `${item._id}`
      });
      generateChild(item, material, flow, flowEdge, xPosition, childPosition);
    });
  };

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.25 });
  };

  const onElementClick = (event, element) => {
    switch (element.data.ref_type) {
      case MATERIAL_TYPE.product:
        window.open(`${routes.productDetail.path}/${element.data.ref_id}`);
        break;
      case MATERIAL_TYPE.package:
        window.open(`${routes.packagesDetail.path}/${element.data.ref_id}`);
        break;
      case 'workOrder':
        window.open(`${routes?.workOrderDetail?.path}/${element.data.ref_id}`);
        break;
      case 'serializedPackage':
        window.open(`${routes.serializedPackagesDetail.path}/${element.data.ref_id}`);
        break;
    }
  };

  return (
    <ContentFullScreen fullScreen={fullDialogueOpen} setFullScreen={setFullDialogueOpen}>
      <Box display="flex" flexDirection="column">
        <Box>
          <ThemeButton
            onClick={() => {
              setColorInfo(!colorInfo);
            }}
            endIcon={colorInfo ? <ExpandLess /> : <ExpandMore />}
          >
            {'Color Info'}
          </ThemeButton>
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
      <div style={fullDialogueOpen ? { height: '95vh' } : { height: '75vh' }}>
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
                    <ControlButton onClick={() => (fullDialogueOpen ? setFullDialogueOpen(false) : setFullDialogueOpen(true))}>
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

export default AssemblyOrderViews;
