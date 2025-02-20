import _ from 'lodash';
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
import { useAppTheme } from 'src/constants/AppConfig';
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

      const position: any = {
        xPosition: 0
      };
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
              <HtmlTooltip arrow placement="top" title={resources?.assemblyOrder?.titlePlural}>
                <div>
                  <Typography variant="body2">{resources?.assemblyOrder?.titlePlural}</Typography>
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
      position.xPosition += 300;

      const rows = data?.filter((item) => !item?.parentId);
      rows?.forEach((parent: any, pIdx) => {
        flow.push({
          id: `${parent?._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: parent?.type,
            ref_id: parent?.materialId,
            label: (
              <HtmlTooltip arrow placement="top" title={_.startCase(_.camelCase(parent?.type))}>
                <div>
                  <Typography variant="body2">{_.startCase(_.camelCase(parent?.type))}</Typography>
                  <Typography variant="subtitle2">{parent?.packageDetail?.packageName || parent?.detail}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: {
            x: position.xPosition,
            y: pIdx * 95
          },
          style: parent?.type === 'package' ? customNodeStyles.package : customNodeStyles.product
        });
        flowEdge.push({
          id: `assemblyOrder-parent-${parent?._id}`,
          source: `${id}`,
          arrowHeadType: 'arrow',
          target: `${parent?._id}`
        });
        generateChild(parent, data, flow, flowEdge, position);
      });

      const workOrders = data
        ?.filter((v) => v.workOrder && v?.workOrder?._id)
        ?.map((f) => {
          return {
            optionValue: f.workOrder._id,
            optionLabel: f.workOrder.workOrderNumber,
            parent: f._id
          };
        });

      const childSerializedPackages = data
        ?.filter((v) => v.parentId && v.serializedPackage)
        ?.map((f) => {
          return {
            optionValue: f.serializedPackage.optionValue,
            optionLabel: f.serializedPackage.optionLabel,
            workOrder: f.workOrder._id
          };
        });

      if (workOrders?.length) position.xPosition += 300;
      workOrders?.map((w: any, wIdx) => {
        flow.push({
          id: `${w.optionValue}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'workOrder',
            ref_id: w.optionValue,
            label: (
              <HtmlTooltip arrow placement="top" title={'Work Order'}>
                <div>
                  <Typography variant="body2">{'Work Order'}</Typography>
                  <Typography variant="subtitle2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {w.optionLabel}
                  </Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: {
            x: position.xPosition,
            y: wIdx * 80
          },
          style: customNodeStyles.workOrder
        });
        flowEdge.push({
          id: `parent-child-${w.optionValue}-${w.parent}`,
          source: `${w.parent}`,
          arrowHeadType: 'arrow',
          target: `${w.optionValue}`
        });
      });

      if (childSerializedPackages?.length) position.xPosition += 300;
      childSerializedPackages?.map((cmp, cmpIdx) => {
        flow.push({
          id: `${cmp.optionValue}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'serializedPackage',
            ref_id: cmp.optionValue,
            label: (
              <HtmlTooltip arrow placement="top" title={resources?.serializedPackage?.titleSingular}>
                <div>
                  <Typography variant="body2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {resources?.serializedPackages?.titleSingular}
                  </Typography>
                  <Typography variant="subtitle2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cmp.optionLabel}
                  </Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: {
            x: position.xPosition,
            y: cmpIdx * 80
          },
          style: customNodeStyles.serializedPackage
        });
        flowEdge.push({
          id: `workOrder-serializedpackage-${cmp.optionValue}-${cmp.workOrder}`,
          source: `${cmp.workOrder}`,
          arrowHeadType: 'arrow',
          target: `${cmp.optionValue}`
        });
      });

      setFlowData([...flow, ...flowEdge]);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
  };

  const generateChild = (parent, material, flow, flowEdge, position) => {
    const child = material?.filter((m) => m?.parentId === parent?._id && m?.type === MATERIAL_TYPE.package);
    if (child?.length) position.xPosition += 300;
    child?.forEach((item: any, cIdx) => {
      flow.push({
        id: `${item?._id}`,
        sourcePosition: 'right',
        targetPosition: 'left',
        type: 'default',
        data: {
          ref_type: item?.type,
          ref_id: item?.materialId,
          label: (
            <HtmlTooltip arrow placement="top" title={_.startCase(_.camelCase(item?.type))}>
              <div>
                <Typography variant="body2">{_.startCase(_.camelCase(item?.type))}</Typography>
                <Typography variant="subtitle2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item?.productDetail?.productName || item?.packageDetail?.packageName}
                </Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: {
          x: position.xPosition,
          y: cIdx * 80
        },
        style: item.type === 'package' ? customNodeStyles.package : customNodeStyles.product
      });
      flowEdge.push({
        id: `parent-child-${item._id}-${item.parentId}`,
        source: `${item.parentId}`,
        arrowHeadType: 'arrow',
        target: `${item._id}`
      });
      generateChild(item, material, flow, flowEdge, position);
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
