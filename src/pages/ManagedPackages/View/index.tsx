import { Box, Button, Paper, Typography } from '@material-ui/core';
import { Fragment, useContext, useEffect, useState } from 'react';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import ReactFlow, { ControlButton, Controls, ReactFlowProvider } from 'react-flow-renderer';
import { MdZoomOutMap } from 'react-icons/md';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { MATERIAL_TYPE, COLOUR_MASTER } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { camelCase, startCase } from 'lodash';
import { useAppTheme } from 'src/constants/AppConfig';
import { useData } from 'src/StateProvider/Provider';

const ManagedPackagesView = ({ managedPackagesData }) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const [themeColor] = useAppTheme();
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(false);

  const {
    state: { resources }
  }: any = useData();

  const customNodeStyles = {
    managedPackage: {
      name: 'Managed Package',
      ...COLOUR_MASTER.purchaseOrder
    },
    product: {
      name: 'Product',
      ...COLOUR_MASTER.product
    },
    serializedAsset: {
      name: 'Serialized Asset',
      ...COLOUR_MASTER.assets
    },
    package: {
      name: 'Package',
      ...COLOUR_MASTER.package
    }
  };

  useEffect(() => {
    fetchData();
  }, [managedPackagesData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const allAssetsResponse = await axiosInstance().get(`/managed-packages/${managedPackagesData?._id}/assets`);
      const assets = allAssetsResponse?.data?.data || [];

      const {
        data: {
          data: { material }
        }
      } = await axiosInstance().get(`/managed-packages/${managedPackagesData?.package?.optionValue}/package-material`);

      let xPosition = 0;
      let flow = [
        {
          id: managedPackagesData?._id,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'managedPackages',
            ref_id: managedPackagesData?._id,
            label: (
              <HtmlTooltip arrow placement="top" title={resources?.managedPackages?.titleSingular}>
                <div>
                  <Typography variant="body2">{resources?.managedPackages?.titleSingular}</Typography>
                  <Typography variant="subtitle2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {managedPackagesData?.managedPackageName}
                  </Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: 60 },
          style: customNodeStyles.managedPackage
        }
      ];
      let flowEdge = [];

      if (material?.length) xPosition += 300;
      var yPrev = 0;

      let rows = material.filter((e) => !e.parentId);
      rows.forEach((parent, i) => {
        parent.index = i + 1;
        parent.detail =
          parent.type === MATERIAL_TYPE.product ? parent?.productName : parent.type === MATERIAL_TYPE.package ? parent?.packageName : '';
        parent.subRows = generateNestedData(material, assets, parent);
      });
      generateFlowData(rows, xPosition, flow, flowEdge, managedPackagesData._id, yPrev);
      setFlowData([...flow, ...flowEdge]);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setToastConfig(err);
    }
  };

  const generateFlowData = (parentNode, xPosition, flow, flowEdge, sourceId = null, yPrev, level = 0) => {
    let yPosition = yPrev;

    parentNode.forEach((node) => {
      flow.push({
        id: node?._id,
        type: 'default',
        className: 'dark-node',
        sourcePosition: 'right',
        targetPosition: 'left',
        data: {
          ref_type: node.type,
          ref_id: MATERIAL_TYPE.serializedAsset === node?.type ? node.asset : node._id,
          label: (
            <HtmlTooltip arrow placement="top" title={startCase(camelCase(node.type))}>
              <div>
                <Typography variant="body2">{startCase(camelCase(node.type))}</Typography>
                <Typography variant="subtitle2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {node.detail}
                </Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: { x: xPosition, y: yPosition },
        style:
          node.type === MATERIAL_TYPE.product
            ? customNodeStyles.product
            : node.type === MATERIAL_TYPE.package
              ? customNodeStyles.package
              : customNodeStyles.serializedAsset
      });

      if (sourceId) {
        flowEdge.push({
          id: `${sourceId}-${node?._id}-edge`,
          source: sourceId,
          target: node?._id,
          arrowHeadType: 'arrow'
        });
      }
      if (node.subRows?.length) {
        let childYPosition = yPosition;
        const childHeight = generateFlowData(node.subRows, xPosition + 300, flow, flowEdge, node?._id, childYPosition, level + 1);
        yPosition += childHeight;
      }
      yPosition += 100;
    });
    return yPosition - yPrev;
  };

  const generateNestedData = (material, assets, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + (j + 1);
      _subRow.detail =
        _subRow.type === MATERIAL_TYPE.package ? _subRow?.packageName : _subRow.type === MATERIAL_TYPE.product ? _subRow?.productName : '';
      _subRow.subRows = generateNestedData(material, assets, _subRow);
    });
    if (assets?.length > 0) {
      const assetsSubRows = assets.filter((e) => {
        return e.product === parent._id && (parent.package ? parent._id === e.package : true);
      });
      assetsSubRows.forEach((_subRow, j) => {
        _subRow.index = parent.index + '.' + (j + 1 + (subRows?.length || 0));
        _subRow.type = MATERIAL_TYPE.serializedAsset;
        _subRow.detail = _subRow?.assetDetail?.assetNumber;
        _subRow.parentId = _subRow?.product;
        subRows.push(_subRow);
      });
    }
    return subRows;
  };

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.1 });
  };

  const onElementClick = (event, element) => {
    if (element?.data?.ref_type === 'managedPackages') {
      window.open(`${routes.managedPackagesDetail.path}/${element?.data?.ref_id}`);
    }
    if (element?.data?.ref_type === MATERIAL_TYPE.product) {
      window.open(`${routes.productDetail.path}/${element?.data?.ref_id}`);
    }
    if (element?.data.ref_type === MATERIAL_TYPE.package) {
      window.open(`${routes.packagesDetail.path}/${element.data.ref_id}`);
    }
    if (element?.data.ref_type === MATERIAL_TYPE.serializedAsset) {
      window.open(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
    }
  };

  return (
    <ContentFullScreen fullScreen={fullScreenOpen} setFullScreen={setFullScreenOpen}>
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

export default ManagedPackagesView;