import _ from 'lodash';
import { useContext, useState, useEffect, Fragment } from 'react';
import ReactFlow, { Controls, ControlButton, ReactFlowProvider } from 'react-flow-renderer';
import axiosInstance from '../../../axios/axiosInstance';
import { COLOUR_MASTER, MATERIAL_TYPE } from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { MdZoomOutMap } from 'react-icons/md';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { Box, Button, Paper, Typography } from '@mui/material';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import { useAppTheme } from 'src/constants/AppConfig';
import { useData } from 'src/StateProvider/Provider';

const AssemblyOrderViews = (props) => {
  const [themeColor] = useAppTheme();
  const { assemblyOrderNumber, id } = props;
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const history = useHistory();
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
    managedPackage: {
      name: 'Managed Package',
      ...COLOUR_MASTER.assets
    },
    parentManagedpackage: {
      name: 'Parent Managed package',
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
      let parent = data?.filter((item) => item?.parentId === null);

      const parentIds = parent?.map((item) => item._id);
      const childProductPackages = data?.filter((item) => [...parentIds].includes(item?.parentId));

      const workOrders = data
        ?.filter((v) => v.workOrder && v?.workOrder?._id)
        ?.map((f) => {
          return {
            optionValue: f.workOrder._id,
            optionLabel: f.workOrder.workOrderNumber,
            parent: f._id
          };
        });

      const childManagedPackages = data
        ?.filter((v) => v.parentId && v.managedPackage)
        ?.map((f) => {
          return {
            optionValue: f.managedPackageDetail._id,
            optionLabel: f.managedPackageDetail.managedPackageName,
            workOrder: f.workOrder._id
          };
        });

      const parentManagedPackages = data
        ?.filter((v) => !v.parentId && v.managedPackage)
        ?.map((f) => {
          return {
            optionValue: f.managedPackageDetail._id,
            optionLabel: f.managedPackageDetail.managedPackageName,
            id: f._id
          };
        });

      var xPosition = 0;
      var flow: any[] = [
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
      var flowEdge: any[] = [];
      xPosition += 300;
      parent?.map((item: any, pIdx) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: item.type,
            ref_id: item.materialId,
            label: (
              <HtmlTooltip arrow placement="top" title={_.startCase(_.camelCase(item.type))}>
                <div>
                  <Typography variant="body2">{_.startCase(_.camelCase(item.type))}</Typography>
                  <Typography variant="subtitle2">{item.packageDetail?.packageName || item?.detail}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: {
            x: xPosition,
            y: pIdx * 95
          },
          style: item.type === 'package' ? customNodeStyles.package : customNodeStyles.product
        });
        flowEdge.push({
          id: `assemblyOrder-parent-${item._id}`,
          source: `${id}`,
          arrowHeadType: 'arrow',
          target: `${item._id}`
        });
      });

      if (childProductPackages?.length) xPosition += 300;
      let maxXPosition = xPosition;
      childProductPackages?.map((item: any, cIdx) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: item.type,
            ref_id: item.materialId,
            label: (
              <HtmlTooltip arrow placement="top" title={_.startCase(_.camelCase(item.type))}>
                <div>
                  <Typography variant="body2">{_.startCase(_.camelCase(item.type))}</Typography>
                  <Typography variant="subtitle2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.productDetail?.productName || item.packageDetail?.packageName}
                  </Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: {
            x: maxXPosition,
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
      });
      if (workOrders?.length) xPosition += 300;
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
            x: xPosition,
            y: wIdx * 80
          },
          style: customNodeStyles.workOrder
        });
        flowEdge.push({
          id: `parent-child-${w.optionValue}-${w.parentId}`,
          source: `${w.parent}`,
          arrowHeadType: 'arrow',
          target: `${w.optionValue}`
        });
      });
      if (childManagedPackages?.length) xPosition += 300;
      childManagedPackages?.map((cmp, cmpIdx) => {
        flow.push({
          id: `${cmp.optionValue}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'managedPackage',
            ref_id: cmp.optionValue,
            label: (
              <HtmlTooltip arrow placement="top" title={resources?.managedPackages?.titleSingular}>
                <div>
                  <Typography variant="body2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {resources?.managedPackages?.titleSingular}
                  </Typography>
                  <Typography variant="subtitle2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cmp.optionLabel}
                  </Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: {
            x: xPosition,
            y: cmpIdx * 80
          },
          style: customNodeStyles.managedPackage
        });
        flowEdge.push({
          id: `workOrder-managedpackage-${cmp.optionValue}-${cmp.workOrder}`,
          source: `${cmp.workOrder}`,
          arrowHeadType: 'arrow',
          target: `${cmp.optionValue}`
        });
      });
      if (parentManagedPackages?.length) xPosition += 300;

      parentManagedPackages?.map((pmp, pmpIdx) => {
        flow.push({
          id: `${pmp.optionValue}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'managedPackage',
            ref_id: pmp.optionValue,
            label: (
              <HtmlTooltip arrow placement="top" title={`${resources?.managedPackages?.titleSingular}`}>
                <div>
                  <Typography variant="body2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {resources?.managedPackages?.titleSingular}
                  </Typography>
                  <Typography variant="subtitle2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {pmp.optionLabel}
                  </Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: {
            x: xPosition,
            y: pmpIdx * 80
          },
          style: customNodeStyles.parentManagedpackage
        });
        const childPacks = childProductPackages?.filter((d) => d.parentId === pmp.id);
        childPacks?.forEach((c) => {
          flowEdge.push({
            id: `parentManagedPackage-child-${pmp.optionValue}-${c.type === MATERIAL_TYPE.product ? c.workOrder._id : c.managedPackageDetail._id}`,
            source: c.type === MATERIAL_TYPE.product ? `${c.workOrder._id}` : `${c.managedPackageDetail._id}`,
            arrowHeadType: 'arrow',
            target: `${pmp.optionValue}`
          });
        });
      });

      setFlowData([...flow, ...flowEdge]);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      toastConfig.setToastConfig(error);
    }
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
      case 'managedPackage':
        window.open(`${routes.managedPackagesDetail.path}/${element.data.ref_id}`);
        break;
    }
  };

  return (
    <ContentFullScreen fullScreen={fullDialogueOpen} setFullScreen={setFullDialogueOpen}>
      <Box marginLeft={2} marginTop={1} display="flex" flexDirection="column">
        <Box>
          <Button
            variant={'outlined'}
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
      <div style={fullDialogueOpen ? { height: '95vh' } : { height: '68vh' }}>
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
