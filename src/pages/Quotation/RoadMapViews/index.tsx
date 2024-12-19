import _ from 'lodash';
import React, { useContext, useState, useEffect, Fragment } from 'react';
import ReactFlow, { Controls, ControlButton, ReactFlowProvider } from 'react-flow-renderer';
import axiosInstance from '../../../axios/axiosInstance';
import { quotation, QUOTATION_STATUS } from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { MdZoomOutMap } from 'react-icons/md';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { Box, Button, Paper, Typography } from '@material-ui/core';
import { ExpandMore, ExpandLess } from '@material-ui/icons';
import { useAppTheme } from 'src/constants/AppConfig';
import { useData } from 'src/StateProvider/Provider';

const QuotationViews = (props) => {
  const [themeColor] = useAppTheme();
  const { quoteName, quoteId, status, versionId } = props;
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [fullDialogueOpen, setFullDialogueOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);

  const {
    state: { resources }
  }: any = useData();

  useEffect(() => {
    versionId && fetchData();
  }, [versionId]);

  const customNodeStyles = {
    quotation: {
      name: 'Quotation',
      background: themeColor === 'dark' ? 'rgb(178,183,219)' : '#E6E8F5',
      borderColor: '#9789F0'
    },
    product: {
      name: 'Product',
      background: themeColor === 'dark' ? 'rgb(161,237,220)' : '#E2F8FF',
      borderColor: '#8BCBDF'
    },
    asset: {
      name: 'Serialized Asset',
      background: '#ffd65b',
      borderColor: 'green'
    },
    package: {
      name: 'Package',
      background: themeColor === 'dark' ? 'rgb(248,229,159)' : '#DFFBF5',
      borderColor: '#66CDB7'
    },
    service: {
      name: 'Service',
      background: themeColor === 'dark' ? 'rgb(158,204,219)' : '#FFF7D9',
      borderColor: '#FDD33E'
    },
    approve: {
      name: 'Quotation-On-Going',
      background: themeColor === 'dark' ? 'rgb(165,212,134)' : '#EDFFE1',
      borderColor: '#86DB71'
    },
    decline: {
      name: 'Quotation-Rejected',
      background: themeColor === 'dark' ? 'rgb(219,175,175)' : '#FFEAEA',
      borderColor: '#FFA0A0'
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const viewsData = await axiosInstance().get(`${quotation.api}/productpackage/${quoteId}/${versionId}`);
      const additionalCost = await axiosInstance().get(`${quotation.api}/additionalcost/${quoteId}/${versionId}`);
      let parent = viewsData.data.data.material?.filter((item) => item?.parentId === null);
      let additionalData = additionalCost?.data?.data || [];
      parent = [...parent, ...additionalData];

      const parentIds = parent?.map((item) => `${item?.id}`);
      const child = viewsData.data.data.material?.filter((item) => item?.parentId !== null);

      var xPosition = 0;
      var flow: any[] = [
        {
          id: `${quoteId}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'quotation',
            ref_id: quoteId,
            label: (
              <HtmlTooltip arrow placement="top" title={resources?.quotation?.titleSingular}>
                <div>
                  <Typography variant="body2">{resources?.quotation?.titleSingular}</Typography>
                  <Typography variant="subtitle2">{quoteName ?? quoteName}</Typography>
                </div>
              </HtmlTooltip>
            )
            // <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{quoteName ?? quoteName}</div>
          },
          position: { x: xPosition, y: 70 },
          style: customNodeStyles.quotation
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
                  <Typography variant="body2">{_.startCase(_.camelCase(item.type)) || 'Manual Entry'}</Typography>
                  <Typography variant="subtitle2">
                    {item.productDetail?.productName || item.packageDetail?.packageName || item.serviceDetail?.serviceName || item?.detail}
                  </Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: {
            x: xPosition,
            y: pIdx * 95
          },
          style: item.type === 'service' ? customNodeStyles.service : item.type === 'package' ? customNodeStyles.package : customNodeStyles.product
        });
        flowEdge.push({
          id: `quote-parent-${item._id}`,
          source: `${quoteId}`,
          arrowHeadType: 'arrow',
          target: `${item._id}`
        });
      });

      if (child?.length) xPosition += 300;
      let maxXPosition = xPosition;
      let maxYAssetPosition = 1;
      const childData = {};
      const removeEdge = [];
      child?.map((item: any, cIdx) => {
        const xPositionView =
          item.type === 'serializedAsset'
            ? xPosition + 300
            : childData[item.parentId.toString()]
              ? childData[item.parentId.toString()] + 300
              : xPosition;
        if (childData[item.parentId.toString()]) {
          removeEdge.push(item.parentId.toString());
        }
        if (xPositionView > maxXPosition) maxXPosition = xPositionView;
        const yPositionView = item.type === 'serializedAsset' ? maxYAssetPosition : cIdx;
        if (item.type === 'serializedAsset') maxYAssetPosition += 1;
        childData[item._id.toString()] = xPositionView;
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
                  <Typography variant="subtitle2">
                    {item.productDetail?.productName ||
                      item.packageDetail?.packageName ||
                      item.serviceDetail?.serviceName ||
                      item.serializedAssetDetail?.assetNumber}
                  </Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: {
            x: xPositionView,
            y: yPositionView * 80
          },
          style:
            item.type === 'service'
              ? customNodeStyles.service
              : item.type === 'package'
                ? customNodeStyles.package
                : item.type === 'serializedAsset'
                  ? customNodeStyles.asset
                  : customNodeStyles.product
        });
        flowEdge.push({
          id: `parent-child-${item._id}-${item.parentId}`,
          source: `${item.parentId}`,
          arrowHeadType: 'arrow',
          target: `${item._id}`
        });
      });
      xPosition = maxXPosition;
      if (
        [QUOTATION_STATUS.sentToCustomer, QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.converted, QUOTATION_STATUS.rejectByCustomer].includes(
          status
        )
      ) {
        xPosition += 300;
        flow.push({
          id: `${quoteId}-output`,
          type: 'output',
          className: 'dark-node',
          sourcePosition: 'right',
          targetPosition: 'left',
          data: {
            ref_type: 'quotation',
            ref_id: quoteId,
            label: (
              <div>
                <Typography variant="body2">{resources?.quotation?.titleSingular}</Typography>
                <Typography variant="body2">{quoteName ?? quoteName}</Typography>
                <Typography variant="subtitle2">{status ?? status}</Typography>
              </div>
            )
          },
          position: { x: xPosition, y: 70 },
          style: [QUOTATION_STATUS.sentToCustomer, QUOTATION_STATUS.acceptByCustomer, QUOTATION_STATUS.converted].includes(status)
            ? customNodeStyles.approve
            : customNodeStyles.decline
        });
        parent?.map((item: any, pIdx) => {
          flowEdge.push({
            id: `${item._id}-ouput-line`,
            source: `${item._id}`,
            arrowHeadType: 'arrow',
            target: `${quoteId}-output`
          });
        });
        child?.map((item: any, cIdx) => {
          if (!removeEdge.includes(item._id.toString())) {
            flowEdge.push({
              id: `${item._id}-ouput-line`,
              source: `${item._id}`,
              arrowHeadType: 'arrow',
              target: `${quoteId}-output`
            });
          }
        });
      }

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
      case 'product':
        window.open(`${routes.productDetail.path}/${element.data.ref_id}`);
        break;
      case 'package':
        window.open(`${routes.packagesDetail.path}/${element.data.ref_id}`);
        break;
      case 'serializedAsset':
        window.open(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
        break;
    }
  };

  return (
    <ContentFullScreen fullScreen={fullDialogueOpen} setFullScreen={false}>
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

export default QuotationViews;
