import { Box, Button, Paper, Typography } from '@material-ui/core';
import { Fragment, useContext, useEffect, useState } from 'react';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { useHistory } from 'react-router-dom';
import { ExpandLess, ExpandMore } from '@material-ui/icons';
import ReactFlow, { ControlButton, Controls, ReactFlowProvider } from 'react-flow-renderer';
import { MdZoomOutMap } from 'react-icons/md';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { MATERIAL_TYPE,COLOUR_MASTER } from 'src/constants/helpers';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';

const customNodeStyles = {
  managedPackages: {
    name: 'Managed Packages',
    background: '#E6E8F5',
    borderColor: '#9789F0'
  },
  product: {
    name: 'Product',
    ...COLOUR_MASTER.product
  },
  package: {
    name: 'Package',
    ...COLOUR_MASTER.package
  },
  serializedAsset: {
    name: 'Serialized Asset',
    ...COLOUR_MASTER.assets
  },
};

const ManagedPackagesView = ({ managedPackagesData }) => {
  const { setToastConfig } = useContext(CustomToastContext);
  const [fullScreenOpen, setFullScreenOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  useEffect(() => {
    fetchData();
  }, [managedPackagesData]);

  const fetchData = async () => {
    try {
      const allAssetsResponse = await axiosInstance().get(`/managed-packages/${managedPackagesData?._id}/assets`);
      const assets = allAssetsResponse?.data?.data || [];
      const { data: { data: { material, childProduct } } } = await axiosInstance().get(`/managed-packages/${managedPackagesData?.package?.optionValue}/package-material`);
  
      const rows = [];
      let index = 1;
      const packages = new Set();

      material?.forEach((parent) => {
        let row: any = {};
        if (parent?.package?.optionValue) {
          if (!packages.has(parent?.package?.optionValue)) {
            row.index = index;
            row._id = parent?.package?.optionValue;
            row.type = MATERIAL_TYPE.package;
            row.detail = parent.package.optionLabel;
            row.qty = parent?.package?.qty;
            row.subRows = generateNestedData(material, [], assets, row);
            packages.add(row._id);
            row.parentId = null;
            rows.push(row);
            index++;
          }
        } else {
          row = { ...parent };
          row.index = index;
          row.productId = parent?._id;
          row.type = MATERIAL_TYPE.product;
          row.detail = parent?.productName;
          row.description = parent?.productDescription;
          row.productNumber = parent?.productNumber;
          row.productCategory = parent?.productCategory?.optionLabel;
          row.qty = parent?.qty;
          row.assetQty =
            assets?.filter((i: any) => {
              if (i?.package) {
                return i.product.optionValue === row.productId && i.package === row?.package?.optionValue;
              } else {
                return i.product.optionValue === row.productId && !row?.package;
              }
            })?.length || 0;
          row.subRows = generateNestedData([], childProduct, assets, row);
          row.parentId = null;
          rows.push(row);
          index++;
        }
      });
  
      let xPosition = 0;
      const flow = [
        {
          id: managedPackagesData?._id,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'managedPackages',
            ref_id: managedPackagesData?._id,
            label: (
              <HtmlTooltip arrow placement="top" title={'Managed Packages'}>
                <div>
                  <Typography variant="body2">Managed Packages</Typography>
                  <Typography variant="subtitle2">{managedPackagesData?.managedPackageName}</Typography>
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: 0 },
          style: customNodeStyles.managedPackages
        }
      ];
      const flowEdge = [];
  
      if (rows?.length) xPosition += 300;
      var yPrev=0;
  
      generateFlowData(
        rows,
        xPosition,
        flow,
        flowEdge,
        managedPackagesData._id,
        yPrev
      );
  
      setFlowData([...flow, ...flowEdge]);
    } catch (err) {
      setToastConfig(err);
    }
  };

  const generateFlowData = (parentNode, xPosition, flow, flowEdge, sourceId = null, yPrev, level = 0) => {
    let yPosition = yPrev;
  
    parentNode.forEach((node, index) => {
      const nodeId = `${node?._id}-${level}-${index}-${yPosition}`;
      const nodeType = node.type === 'product' ? 'product' : node.type === 'package' ? 'Package' : 'serializedAsset';
      const nodeLabel = node.detail;
  
      flow.push({
        id: nodeId,
        type: 'default',
        className: 'dark-node',
        sourcePosition: 'right',
        targetPosition: 'left',
        data: {
          ref_type: node.type,
          ref_id: node._id,
          label: (
            <HtmlTooltip arrow placement="top" title={nodeType}>
              <div>
                <Typography variant="body2">{nodeType}</Typography>
                <Typography variant="subtitle2">{nodeLabel}</Typography>
              </div>
            </HtmlTooltip>
          )
        },
        position: { x: xPosition, y: yPosition },
        style:
          node.type === 'product' ? customNodeStyles.product : node.type === 'package' ? customNodeStyles.package : customNodeStyles.serializedAsset,
      });
  
      if (sourceId) {
        flowEdge.push({
          id: `${sourceId}-${nodeId}-edge`,
          source: sourceId,
          target: nodeId,
          arrowHeadType: 'arrow',
        });
      }
  
      let nodeHeight = 100;
  
      if (node.subRows?.length) {
        let childYPosition = yPosition + 100;
  
        const childHeight = generateFlowData(
          node.subRows,
          xPosition + 300,
          flow,
          flowEdge,
          nodeId,
          childYPosition,
          level + 1
        );
  
        nodeHeight += childHeight;
        yPosition += childHeight;
      }
  
      yPosition += 100;
    });
  
    return yPosition - yPrev;
  };

  const generateNestedData = (material, childProduct, assets, parent) => {
    let subRows: any = [];
    if (material?.length > 0 && parent.type === MATERIAL_TYPE.package) {
      const packageSubRows = material?.filter((e) => e?.package?.optionValue === parent?._id);
      packageSubRows.forEach((_subRow, j) => {
        _subRow.index = parent.index + '.' + (j + 1 + (subRows?.length || 0));
        _subRow.productId = _subRow._id;
        _subRow._id = parent._id + _subRow._id;
        _subRow.type = MATERIAL_TYPE.product;
        _subRow.detail = _subRow?.productName;
        _subRow.description = _subRow?.productDescription;
        _subRow.productNumber = _subRow?.productNumber;
        _subRow.productCategory = _subRow?.productCategory?.optionLabel;
        _subRow.qty = parent.qty * _subRow.qty;
        _subRow.parentId = parent?._id;
        _subRow.assetQty =
          assets?.filter((i: any) => {
            if (i?.package) {
              return i.product.optionValue === _subRow.productId && i.package === _subRow?.package?.optionValue;
            } else {
              return i.product.optionValue === _subRow.productId && !_subRow?.package;
            }
          })?.length || 0;
        _subRow.subRows = generateNestedData([], childProduct, assets, _subRow);
      });

      subRows = [...subRows, ...packageSubRows];
    }
    if (childProduct?.length > 0) {
      let childSubRows = childProduct?.filter((e) => {
        return e.product === parent.productId;
      });

      childSubRows = childSubRows?.map((_subRow, j) => {
        const data: any = {
          index: parent.index + '.' + (j + 1 + (subRows?.length || 0)),
          _id: _subRow?._id,
          type: MATERIAL_TYPE.product,
          detail: _subRow?.childProductDetail?.productName,
          productId: _subRow?.childProductDetail?._id,
          description: _subRow?.childProductDetail?.productDescription,
          productCategory: _subRow?.childProductDetail?.productCategory?.optionLabel,
          productNumber: _subRow?.childProductDetail?.productNumber,
          parentId: parent?._id,
          qty: _subRow?.qty,
          assetQty:
            assets?.filter((i: any) => {
              return i.product.optionValue === _subRow?.childProductDetail?._id;
            })?.length || 0,
          serializedProduct: _subRow?.childProductDetail?.serializedProduct
        };
        return { ...data, subRows: generateNestedData([], [], assets, data) };
      });

      subRows = [...subRows, ...childSubRows];
    }
    if (assets?.length > 0) {
      const assetsSubRows = assets.filter((e) => {
        return e.product.optionValue === parent.productId;
      });
      assetsSubRows.forEach((_subRow, j) => {
        _subRow.index = parent.index + '.' + (j + 1 + (subRows?.length || 0));
        _subRow.type = MATERIAL_TYPE.serializedAsset;
        _subRow.detail = _subRow?.assetNumber;
        _subRow.description = _subRow?.description;
        _subRow.productCategory = _subRow?.productCategory?.optionLabel;
        _subRow.position = _subRow?.position;
        _subRow.parentId = _subRow?.product?.optionValue;
        _subRow.qty = parent.qty;
      });
      subRows = [...subRows, ...assetsSubRows];
    }
    return subRows;
  };

  const onLoad = (reactFlowInstance) => {
    reactFlowInstance.fitView({ padding: 0.1 });
  };

  const onElementClick = (event, element) => {
    if (element?.data?.ref_type === 'managedPackages') {
      history.push(`${routes.managedPackagesDetail.path}/${element?.data?.ref_id}`);
    }
    if (element?.data?.ref_type === 'product') {
      history.push(`${routes.productDetail.path}/${element?.data?.ref_id}`);
    }
    if (element?.data.ref_type === 'package') {
      history.push(`${routes.packagesDetail.path}/${element.data.ref_id}`);
    }
    if (element?.data.ref_type === 'serializedAsset') {
      history.push(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
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

export default ManagedPackagesView;