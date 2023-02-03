import _ from 'lodash';
import React, { useContext, useState, useEffect, Fragment } from 'react';
import ReactFlow, { Controls, ControlButton, ReactFlowProvider } from 'react-flow-renderer';
import axiosInstance from '../../../axios/axiosInstance';
import { DELIVERY_TICKET_TYPE, INVENTORY_STATUS, rentalManagement, RENTAL_STATUS, COLOUR_MASTER, quotation } from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { MdZoomOutMap } from 'react-icons/md';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { Box, Button, Paper } from '@material-ui/core';
import { ExpandMore, ExpandLess } from '@material-ui/icons';

const customNodeStyles = {
  quotation: {
    name: 'Quotation',
    ...COLOUR_MASTER.rentalJob
  },
  package: {
    name: 'Package',
    ...COLOUR_MASTER.package
  },
  product: {
    name: 'Product',
    ...COLOUR_MASTER.product
  },
  service: {
    name: 'Service',
    ...COLOUR_MASTER.loadingTicket
  }
};

const QuotationViews = (props) => {
  const { quoteName, quoteId, status, versionId } = props;
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [fullDialogueOpen, setFullDialogueOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);

  useEffect(() => {
    versionId && fetchData();
  }, [versionId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const viewsData = await axiosInstance().get(`${quotation.api}/productpackage/${quoteId}/${versionId}`);
      const parent = viewsData.data.data.material?.filter((item) => item?.parentId === null);
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
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{quoteName ?? quoteName}</div>
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
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.productDetail?.productName || item.packageDetail?.packageName || item.serviceDetail?.serviceName}
                <br />
                {_.startCase(_.camelCase(item.type))}
              </div>
            )
          },
          position: {
            x: xPosition,
            y: pIdx * 80
          },
          style: item.type == 'service' ? customNodeStyles.service : item.type === 'package' ? customNodeStyles.package : customNodeStyles.product
        });
        flowEdge.push({
          id: `quote-parent-${item._id}`,
          source: `${quoteId}`,
          arrowHeadType: 'arrow',
          target: `${item._id}`
        });
      });

      xPosition += 300;
      child?.map((item: any, cIdx) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'output',
          data: {
            ref_type: item.type,
            ref_id: item.materialId,
            label: (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.productDetail?.productName || item.packageDetail?.packageName || item.serviceDetail?.serviceName}
                <br />
                {_.startCase(_.camelCase(item.type))}
              </div>
            )
          },
          position: {
            x: xPosition,
            y: cIdx * 80
          },
          style: item.type == 'service' ? customNodeStyles.service : item.type === 'package' ? customNodeStyles.package : customNodeStyles.product
        });
        flowEdge.push({
          id: `parent-child-${item._id}-${item.parentId}`,
          source: `${item.parentId}`,
          arrowHeadType: 'arrow',
          target: `${item._id}`
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
      case 'product':
        history.push(`${routes.productDetail.path}/${element.data.ref_id}`);
        break;
      case 'package':
        history.push(`${routes.packagesDetail.path}/${element.data.ref_id}`);
        break;
    }
  };

  return (
    <ContentFullScreen title="Views" fullScreen={fullDialogueOpen} setFullScreen={false} isheader={false}>
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
          >
            {'Color Info'} {colorInfo ? <ExpandLess /> : <ExpandMore />}
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
