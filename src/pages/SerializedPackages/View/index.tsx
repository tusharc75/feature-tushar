import { Box, Paper, Typography } from '@mui/material';
import { Fragment, useContext, useEffect, useState } from 'react';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
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
import { ThemeButton } from 'src/components/Helpers/Buttons';

const SerializedPackagesView = ({ serializedPackagesData }) => {
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
    serializedPackage: {
      name: 'Serialized Package',
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
  }, [serializedPackagesData]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const allAssetsResponse = await axiosInstance().get(`${routes.serializedPackages.path}/${serializedPackagesData?._id}/assets`);
      const assets = allAssetsResponse?.data?.data || [];

      const {
        data: { data: material }
      } = await axiosInstance().get(`${routes.serializedPackages.path}/${serializedPackagesData?._id}/material`);

      let xPosition = 0;
      let flow = [
        {
          id: serializedPackagesData?._id,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'serializedPackages',
            ref_id: serializedPackagesData?._id,
            label: (
              <HtmlTooltip arrow placement="top" title={resources?.serializedPackages?.titleSingular}>
                <div>
                  <Typography variant="body2">{resources?.serializedPackages?.titleSingular}</Typography>
                  <Typography variant="subtitle2" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {serializedPackagesData?.serializedPackageNumber}
                  </Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: 60 },
          style: customNodeStyles.serializedPackage
        }
      ];
      let flowEdge = [];

      if (material?.length) xPosition += 300;
      var yPrev = 0;

      let rows = material.filter((e) => !e.parentId);
      rows?.forEach((parent, i) => {
        parent.index = i + 1;
        parent.detail =
          parent?.type === MATERIAL_TYPE.product
            ? parent?.productDetail?.productName
            : parent?.type === MATERIAL_TYPE.package
              ? parent?.packageDetail?.packageName
              : '';
        parent.subRows = generateNestedData(material, assets, parent);
      });
      generateFlowData(rows, xPosition, flow, flowEdge, serializedPackagesData._id, yPrev);
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
          ref_id: MATERIAL_TYPE.serializedAsset === node?.type ? node.asset : node.materialId,
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
        _subRow.type === MATERIAL_TYPE.package
          ? _subRow?.packageDetail?.packageName
          : _subRow.type === MATERIAL_TYPE.product
            ? _subRow?.productDetail?.productName
            : '';
      _subRow.subRows = generateNestedData(material, assets, _subRow);
    });
    if (assets?.length > 0) {
      const assetsSubRows = assets.filter((e) => e.product === parent.materialId && e?._id === parent?._id);
      const subRowsLength = subRows?.length || 0;
      assetsSubRows.forEach((_subRow, j) => {
        _subRow.index = parent.index + '.' + (j + 1 + subRowsLength);
        _subRow.type = MATERIAL_TYPE.serializedAsset;
        _subRow._id = _subRow?.asset;
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
    if (element?.data?.ref_type === 'serializedPackages') {
      window.open(`${routes.serializedPackagesDetail.path}/${element?.data?.ref_id}`);
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
      <div style={fullScreenOpen ? { height: '95vh' } : { height: '75vh' }}>
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

export default SerializedPackagesView;
