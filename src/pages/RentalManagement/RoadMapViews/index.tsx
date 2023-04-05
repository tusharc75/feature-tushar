import _ from 'lodash';
import React, { useContext, useState, useEffect, Fragment } from 'react';
import ReactFlow, { Controls, ControlButton, ReactFlowProvider } from 'react-flow-renderer';
import axiosInstance from '../../../axios/axiosInstance';
import { DELIVERY_TICKET_TYPE, INVENTORY_STATUS, rentalManagement, RENTAL_STATUS, COLOUR_MASTER } from '../../../constants/helpers';
import routes from '../../../components/Helpers/Routes';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { MdZoomOutMap } from 'react-icons/md';
import ContentFullScreen from 'src/components/ContentFullScreen';
import { Box, Button, Paper } from '@material-ui/core';
import { ExpandMore, ExpandLess } from '@material-ui/icons';

const customNodeStyles = {
  rentalJob: {
    name: 'Rental Job',
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
  // purchaseOrder: {
  //   name: 'Purchase Order',
  //   ...COLOUR_MASTER.purchaseOrder
  // },
  sublease: {
    name: 'Sublease',
    ...COLOUR_MASTER.sublease
  },
  transferAsset: {
    name: 'Transfer Asset',
    ...COLOUR_MASTER.transferAsset
  },
  bulkAsset: {
    name: 'Bulk Asset Creation',
    ...COLOUR_MASTER.bulkAsset
  },
  productAssets: {
    name: 'Assets',
    ...COLOUR_MASTER.assets
  },
  lostAssets: {
    name: 'Lost Assets',
    ...COLOUR_MASTER.lostAssets
  },
  scrapAssets: {
    name: 'Scrap Assets',
    ...COLOUR_MASTER.scrapAssets
  },
  loadingTicket: {
    name: 'Loading Ticket',
    ...COLOUR_MASTER.loadingTicket
  },
  receivingTicket: {
    name: 'Receiving Ticket',
    ...COLOUR_MASTER.receivingTicket
  },
  returnTicket: {
    name: 'Return Ticket',
    ...COLOUR_MASTER.returnTicket
  }
};

const customDeliveredNodeStyle = {
  loadingTicket: {
    name: 'Loading Ticket',
    ...COLOUR_MASTER.deliveredLoadingTicket,
    borderLeft: '10px solid #008000'
  },
  receivingTicket: {
    name: 'Receiving Ticket',
    ...COLOUR_MASTER.deliveredReceivingTicket,
    borderLeft: '10px solid #008000'
  },
  returnTicket: {
    name: 'Return Ticket',
    ...COLOUR_MASTER.deliveredReturnTicket,
    borderLeft: '10px solid #FF0000'
  },
  cancelledRentalJob: {
    name: 'Return Ticket',
    ...COLOUR_MASTER.cancelledRentalJob
  },
  closedRentalJob: {
    name: 'Return Ticket',
    ...COLOUR_MASTER.closedRentalJob
  }
};

const RentalManagementViews = (props) => {
  const { rentalName, rentalId, status } = props;
  const [loading, setLoading] = useState(false);
  const [flowData, setFlowData] = useState([]);
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const [fullDialogueOpen, setFullDialogueOpen] = useState(false);
  const [colorInfo, setColorInfo] = useState(false);

  useEffect(() => {
    fetchData();
  }, [rentalName]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const viewsData = await axiosInstance().get(`${rentalManagement.api}/views/${rentalId}`);
      const product = viewsData?.data?.data?.product;
      const ticketData = viewsData?.data?.data?.ticketData;
      const purchaseOrder = viewsData?.data?.data?.purchaseOrder;
      const bulkAsset = viewsData?.data?.data?.bulkAsset;
      const subLease = viewsData?.data?.data?.sublease;
      const transferAsset = viewsData?.data?.data?.transferAsset;
      const allAssets = viewsData?.data?.data?.transferAssetData;
      const consumeProducts = product?.consumeProducts;
      const consumeID = `consume-product`;

      const loadingTicket = ticketData?.filter((item) => item.ticketType === DELIVERY_TICKET_TYPE.loading);
      const receivingTicket = ticketData?.filter((item) => item.ticketType === DELIVERY_TICKET_TYPE.receiving);
      const returnTicket = ticketData?.filter((item) => item.ticketType === DELIVERY_TICKET_TYPE.return);

      var xPosition = 0;
      var flow: any[] = [
        {
          id: `${rentalId}`,
          type: 'input',
          className: 'dark-node',
          sourcePosition: 'right',
          data: {
            ref_type: 'rentalJob',
            ref_id: rentalId,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rentalName ?? rentalName}</div>
          },
          position: { x: xPosition, y: 70 },
          style: customNodeStyles.rentalJob
        }
      ];
      var flowEdge: any[] = [];

      xPosition += 300;
      const allPackages = product?.material?.filter((item) => item.type === 'package').map((item) => item._id);
      const allPackagesAndProductIds = product?.material?.map((item) => item._id);
      const assetsInLoading = {};
      loadingTicket?.map((item) => {
        item?.products?.map((i) => {
          assetsInLoading[i?.product] = item._id;
        });
      });
      const assetsInReceiving = {};
      receivingTicket?.map((item) => {
        item?.products?.map((i) => {
          assetsInReceiving[i?.product] = item._id;
        });
      });
      const assetsInReturn = {};
      returnTicket?.map((item) => {
        item?.products?.map((i) => {
          assetsInReturn[i?.product] = item._id;
        });
      });
      const assetsInConsume = {};
      consumeProducts?.map((item) => {
        assetsInConsume[item?.product] = consumeID;
      });

      if (allPackages.length) xPosition += 300;
      var pakcageIdx = 0;
      var productIdx = 0;
      const productColSystem = {};

      var lastIndex = 0;
      product?.material?.map((item: any, index) => {
        if (item.type !== 'package') {
          productColSystem[item._id] = productColSystem[item.parentId] ? productColSystem[item.parentId] + 300 : xPosition;
        }
        if (
          (item?.productDetail?.serializedProduct || allPackages.includes(item?._id)) &&
          !assetsInLoading[item?.materialId] &&
          !assetsInReceiving[item?.materialId] &&
          !assetsInReturn[item?.materialId]
        )
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
                  {item.productDetail?.productName || item.packageDetail?.packageName}
                  <br />
                  {_.startCase(_.camelCase(item.type))}
                </div>
              )
            },
            position: {
              x: item.type === 'package' ? xPosition - 300 : productColSystem[item.parentId] ? productColSystem[item.parentId] + 300 : xPosition,
              y: item.type === 'package' ? pakcageIdx * 80 : productIdx * 80
            },
            style: item.type === 'package' ? customNodeStyles.package : customNodeStyles.product
          });
        const pos = item.type === 'package' ? xPosition - 300 : productColSystem[item.parentId] ? productColSystem[item.parentId] + 300 : xPosition;
        if (lastIndex < pos) lastIndex = pos;
        item.type === 'package' ? (pakcageIdx += 1) : (productIdx += 1);
        flowEdge.push({
          id: `edge-product-${item._id}-${index}`,
          source: `${item.parentId && allPackagesAndProductIds.includes(item.parentId) ? item.parentId : rentalId}`,
          arrowHeadType: 'arrow',
          target: `${item._id}`
        });
      });
      xPosition = lastIndex;

      var purchaseAndSubLeaseIdx = 0;
      if (
        subLease?.length ||
        transferAsset?.length ||
        bulkAsset?.length ||
        (subLease?.length && purchaseOrder?.length) ||
        (transferAsset?.length && purchaseOrder?.length) ||
        (transferAsset?.length && purchaseOrder?.length && subLease?.length)
      )
        xPosition += 300;
      const bulkAssetArr = bulkAsset?.map((item) => item._id);
      const bulkAssetInAssets = product?.inventory
        ?.filter((item) => item.inventoryDetail.bulkAssetCreation)
        .map((item) => item.inventoryDetail.bulkAssetCreation);
      bulkAsset?.map((item: any, index) => {
        if (bulkAssetInAssets.includes(item._id)) {
          flow.push({
            id: `${item._id}`,
            sourcePosition: 'right',
            targetPosition: 'left',
            type: 'default',
            data: {
              ref_type: 'bulkAsset',
              ref_id: item._id,
              label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.baNumber}</div>
            },
            position: { x: xPosition, y: purchaseAndSubLeaseIdx * 80 },
            style: customNodeStyles.bulkAsset
          });
          purchaseAndSubLeaseIdx += 1;
        }
        product?.inventory?.map((data) => {
          if (bulkAssetArr.includes(data.inventoryDetail.bulkAssetCreation) && data.inventoryDetail.bulkAssetCreation === item._id) {
            flowEdge.push({
              id: `edge-bulkAsset-${item._id}-${_.random(0, 1000)}`,
              source: `${data._id}`,
              arrowHeadType: 'arrow',
              target: `${item._id}`
            });
          }
        });
      });

      const subleaseInAssets = product?.inventory
        ?.filter((item) => item.inventoryDetail.supplierAccount)
        .map((item) => item.inventoryDetail.supplierAccount);
      const subLeaseArr = subLease?.map((item) => item.supplierAccount.optionValue);

      subLease?.map((item: any, index) => {
        if (subleaseInAssets.includes(item.supplierAccount.optionValue)) {
          flow.push({
            id: `${item.supplierAccount.optionValue}`,
            sourcePosition: 'right',
            targetPosition: 'left',
            type: 'default',
            data: {
              ref_type: 'sublease',
              ref_id: item._id,
              label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subleaseName}</div>
            },
            position: { x: xPosition, y: purchaseAndSubLeaseIdx * 80 },
            style: customNodeStyles.sublease
          });
          purchaseAndSubLeaseIdx += 1;
        }
        product?.inventory?.map((data) => {
          if (
            subLeaseArr.includes(data.inventoryDetail.supplierAccount) &&
            data.inventoryDetail.supplierAccount === item.supplierAccount.optionValue
          ) {
            flowEdge.push({
              id: `edge-sublease-${item._id}-${_.random(0, 1000)}`,
              source: `${data._id}`,
              arrowHeadType: 'arrow',
              target: `${item.supplierAccount.optionValue}`
            });
          }
        });
      });
      const allInventories = product?.inventory?.map((data) => data?.inventoryDetail?.assetNumber);
      const taFromAssets = Object.keys(allAssets).map((i) => {
        if (allInventories.includes(i)) {
          return allAssets[i];
        }
      });
      transferAsset?.map((item: any, index) => {
        if (taFromAssets.includes(item._id)) {
          flow.push({
            id: `${item._id}`,
            sourcePosition: 'right',
            targetPosition: 'left',
            type: 'default',
            data: {
              ref_type: 'transferAsset',
              ref_id: item._id,
              label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.transferAssetNumber}</div>
            },
            position: { x: xPosition, y: purchaseAndSubLeaseIdx * 80 },
            style: customNodeStyles.transferAsset
          });
        }
        purchaseAndSubLeaseIdx += 1;
        product?.inventory?.map((data) => {
          if (allAssets[data.inventoryDetail.assetNumber] !== undefined && allPackagesAndProductIds.includes(data._id)) {
            flowEdge.push({
              id: `edge-transfer-${data.inventoryDetail.assetNumber}-${_.random(0, 1000)}`,
              source: `${data._id}`,
              arrowHeadType: 'arrow',
              target: `${allAssets[data.inventoryDetail.assetNumber]}`
            });
          }
        });
      });

      xPosition += 300;
      var productsWithStatus = {};
      var beforeLoadingAssetIdx = 0;
      product?.inventory?.map((item: any) => {
        productsWithStatus[item.inventory] = item?.inventoryDetail?.status;
        flow.push({
          id: `${item.inventoryDetail.assetNumber}-${item.inventoryDetail._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'asset',
            ref_id: item.inventory,
            label: (
              <HtmlTooltip arrow placement="top" title={item?.inventoryDetail?.status}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.inventoryDetail.assetNumber}</div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: beforeLoadingAssetIdx * 80 },
          style:
            item?.inventoryDetail?.status === INVENTORY_STATUS.scrap || item?.inventoryDetail?.status === INVENTORY_STATUS.lost
              ? item?.inventoryDetail?.status === INVENTORY_STATUS.scrap
                ? customNodeStyles.scrapAssets
                : customNodeStyles.lostAssets
              : customNodeStyles.productAssets
        });
        beforeLoadingAssetIdx += 1;
        var edgePlaced = false;
        if (subLeaseArr.includes(item.inventoryDetail.supplierAccount) && item.inventoryDetail.subleaseAsset) {
          edgePlaced = true;
          flowEdge.push({
            id: `edge-assets-${item.inventoryDetail.assetNumber}-${item.inventoryDetail._id}`,
            source: item.inventoryDetail.supplierAccount,
            arrowHeadType: 'arrow',
            target: `${item.inventoryDetail.assetNumber}-${item.inventoryDetail._id}`
          });
        }
        if (bulkAssetArr.includes(item.inventoryDetail.bulkAssetCreation)) {
          edgePlaced = true;
          flowEdge.push({
            id: `edge-assets-${item.inventoryDetail.assetNumber}-${item.inventoryDetail._id}`,
            source: item.inventoryDetail.bulkAssetCreation,
            arrowHeadType: 'arrow',
            target: `${item.inventoryDetail.assetNumber}-${item.inventoryDetail._id}`
          });
        }
        if (allAssets[item.inventoryDetail.assetNumber]) {
          edgePlaced = true;
          flowEdge.push({
            id: `edge-assets-${item.inventoryDetail.assetNumber}-${item.inventoryDetail._id}`,
            source: allAssets[item.inventoryDetail.assetNumber],
            arrowHeadType: 'arrow',
            target: `${item.inventoryDetail.assetNumber}-${item.inventoryDetail._id}`
          });
        }
        if (!edgePlaced) {
          flowEdge.push({
            id: `edge-assets-${item.inventoryDetail.assetNumber}-${item.inventoryDetail._id}-${_.random(0, 1000)}`,
            source:
              subLeaseArr.includes(item.inventoryDetail.supplierAccount) && item.inventoryDetail.subleaseAsset
                ? `${item.inventoryDetail.supplierAccount}`
                : bulkAssetArr.includes(item.inventoryDetail.bulkAssetCreation)
                ? `${item.inventoryDetail.bulkAssetCreation}`
                : allAssets[item.inventoryDetail.assetNumber]
                ? allAssets[item.inventoryDetail.assetNumber]
                : `${item._id}`,
            arrowHeadType: 'arrow',
            target: `${item.inventoryDetail.assetNumber}-${item.inventoryDetail._id}`
          });
        }
      });

      var loadingProductData = [];
      product?.material
        ?.filter((i) => !i?.productDetail?.serializedProduct && i.type !== 'package')
        ?.map((item) => {
          if (!loadingProductData.includes(`${item.materialId}`)) {
            loadingProductData.push(`${item.materialId}`);
            flow.push({
              id: `${item.productDetail?.productName}`,
              sourcePosition: 'right',
              targetPosition: 'left',
              type: 'default',
              data: {
                ref_type: item.type,
                ref_id: item.materialId,
                label: (
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.productDetail?.productName || item.packageDetail?.packageName}
                    <br />
                    {_.startCase(_.camelCase(item.type))}
                  </div>
                )
              },
              position: { x: xPosition, y: beforeLoadingAssetIdx * 80 },
              style: customNodeStyles.product
            });
            beforeLoadingAssetIdx += 1;
          }
          flowEdge.push({
            id: `edge-assets-product-parent-${item.productDetail?.productName}-${assetsInLoading[item?.materialId]}-${_.random(0, 1000)}`,
            source: item?.parentId && allPackagesAndProductIds.includes(item?.parentId) ? `${item?.parentId}` : rentalId,
            arrowHeadType: 'arrow',
            target: `${item.productDetail?.productName}`
          });
          flowEdge.push({
            id: `edge-assets-product-${item.productDetail?.productName}-${assetsInLoading[item?.materialId]}-${_.random(0, 1000)}`,
            source: `${item.productDetail?.productName}`,
            arrowHeadType: 'arrow',
            target: `${assetsInLoading[item?.materialId]}`
          });
        });

      var loadingAssets = 0;
      if (loadingTicket?.length) xPosition += 300;
      loadingTicket?.map((item: any, index) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'loading',
            ref_id: item._id,
            label: (
              <HtmlTooltip
                arrow
                placement="top"
                title={
                  <>
                    <p>
                      From: <b>{item?.pickupFrom?.optionLabel}</b>
                    </p>
                    <p>
                      To: <b>{item?.deliveryTo?.optionLabel}</b>
                    </p>
                  </>
                }
              >
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.ticketName}
                  <br />
                  {item.ticketType} Ticket
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: index * 80 },
          style: item.status === 'Delivered' ? customDeliveredNodeStyle.loadingTicket : customNodeStyles.loadingTicket
        });

        item?.productInventory?.map((product: any, productIndex) => {
          flow.push({
            id: `${product.optionValue}`,
            sourcePosition: 'right',
            targetPosition: 'left',
            type: 'default',
            data: {
              ref_type: 'asset',
              ref_id: product.optionValue,
              label: (
                <HtmlTooltip arrow placement="top" title={productsWithStatus[product.optionValue]}>
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.optionLabel}</div>
                </HtmlTooltip>
              )
            },
            position: { x: xPosition + 300, y: loadingAssets * 80 },
            style:
              productsWithStatus[product.optionValue] === INVENTORY_STATUS.lost || productsWithStatus[product.optionValue] === INVENTORY_STATUS.scrap
                ? productsWithStatus[product.optionValue] === INVENTORY_STATUS.lost
                  ? customNodeStyles.lostAssets
                  : customNodeStyles.scrapAssets
                : customNodeStyles.productAssets
          });
          loadingAssets += 1;
          flowEdge.push({
            id: `edge-loading-${item._id}-${product.optionValue}`,
            source: `${product.optionLabel}-${product.optionValue}`,
            arrowHeadType: 'arrow',
            target: `${item._id}`
          });
          flowEdge.push({
            id: `edge-loading-assets-${product.optionValue}`,
            source: `${item._id}`,
            arrowHeadType: 'arrow',
            target: `${product.optionValue}`
          });
        });
      });

      const loadingAssetsXPosition = xPosition + 300;
      var receivingProductData = [];
      product?.material
        ?.filter(
          (i) => !i?.productDetail?.serializedProduct && (assetsInReceiving[i?.materialId] || assetsInConsume[i?.materialId]) && i.type !== 'package'
        )
        .map((item) => {
          if (!receivingProductData.includes(`${item.materialId}`)) {
            receivingProductData.push(`${item.materialId}`);

            flow.push({
              id: `${item.materialId}`,
              sourcePosition: 'right',
              targetPosition: 'left',
              type: 'default',
              data: {
                ref_type: item.type,
                ref_id: item.materialId,
                label: (
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.productDetail?.productName || item.packageDetail?.packageName}
                    <br />
                    {_.startCase(_.camelCase(item.type))}
                  </div>
                )
              },
              position: { x: loadingAssetsXPosition, y: loadingAssets * 80 },
              style: customNodeStyles.product
            });
            loadingAssets += 1;
          }
          flowEdge.push({
            id: `edge-assets-product-parent-${item?.materialId}-${assetsInLoading[item?.materialId]}-${_.random(0, 1000)}`,
            source: assetsInLoading[item?.materialId],
            arrowHeadType: 'arrow',
            target: `${item.materialId}`
          });
          flowEdge.push({
            id: `edge-assets-product-${item?.materialId}-${assetsInReceiving[item?.materialId]}-${_.random(0, 1000)}`,
            source: `${item.materialId}`,
            arrowHeadType: 'arrow',
            target: `${assetsInReceiving[item?.materialId]}`
          });
          flowEdge.push({
            id: `edge-assets-product-${item?.materialId}-${assetsInConsume[item?.materialId]}-${_.random(0, 1000)}`,
            source: `${item.materialId}`,
            arrowHeadType: 'arrow',
            target: `${assetsInConsume[item?.materialId]}`
          });
        });

      xPosition += 600;
      var lastYPosition = 0;
      var receivingAndReturnIdx = 0;
      receivingTicket?.map((item: any) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'receiving',
            ref_id: item._id,
            label: (
              <HtmlTooltip
                arrow
                placement="top"
                title={
                  <>
                    <p>
                      From: <b>{item?.pickupFrom?.optionLabel}</b>
                    </p>
                    <p>
                      To: <b>{item?.deliveryTo?.optionLabel}</b>
                    </p>
                  </>
                }
              >
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.ticketName}
                  <br />
                  {item.ticketType} Ticket
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: receivingAndReturnIdx * 80 },
          style: item.status === 'Delivered' ? customDeliveredNodeStyle.receivingTicket : customNodeStyles.receivingTicket
        });
        lastYPosition = receivingAndReturnIdx * 80;
        receivingAndReturnIdx += 1;
        item.productInventory?.map((product: any) => {
          flowEdge.push({
            id: `edge-receiving-${product.optionValue}`,
            source: `${product.optionValue}`,
            arrowHeadType: 'arrow',
            target: `${item._id}`
          });
        });
      });

      var returnProductData = [];
      product?.material
        ?.filter((i) => !i?.productDetail?.serializedProduct && assetsInReturn[i?.materialId] && i.type !== 'package')
        .map((item) => {
          if (!returnProductData.includes(`${item.materialId}`)) {
            returnProductData.push(`${item.materialId}`);
            flow.push({
              id: `${item.materialId}`,
              sourcePosition: 'right',
              targetPosition: 'left',
              type: 'default',
              data: {
                ref_type: item.type,
                ref_id: item.materialId,
                label: (
                  <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {item.productDetail?.productName || item.packageDetail?.packageName}
                    <br />
                    {_.startCase(_.camelCase(item.type))}
                  </div>
                )
              },
              position: { x: loadingAssetsXPosition, y: loadingAssets * 80 },
              style: customNodeStyles.product
            });
            loadingAssets += 1;
          }
          flowEdge.push({
            id: `edge-assets-product-parent-${item?.materialId}-${assetsInLoading[item?.materialId]}-${_.random(0, 1000)}`,
            source: `${assetsInLoading[item?.materialId]}`,
            arrowHeadType: 'arrow',
            target: `${item.materialId}`
          });
          flowEdge.push({
            id: `edge-assets-product-${item?.materialId}-${assetsInReturn[item?.materialId]}-${_.random(0, 1000)}`,
            source: `${item.materialId}`,
            arrowHeadType: 'arrow',
            target: `${assetsInReturn[item?.materialId]}`
          });
        });

      returnTicket?.map((item: any) => {
        flow.push({
          id: `${item._id}`,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'return',
            ref_id: item._id,
            label: (
              <HtmlTooltip
                arrow
                placement="top"
                title={
                  <>
                    <p>
                      From: <b>{item?.pickupFrom?.optionLabel}</b>
                    </p>
                    <p>
                      To: <b>{item?.deliveryTo?.optionLabel}</b>
                    </p>
                  </>
                }
              >
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.ticketName}
                  <br />
                  {item.ticketType} Ticket
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: receivingAndReturnIdx * 80 },
          style: item.status === 'Delivered' ? customDeliveredNodeStyle.returnTicket : customNodeStyles.returnTicket
        });
        lastYPosition = receivingAndReturnIdx * 80;
        receivingAndReturnIdx += 1;
        item.productInventory?.map((product: any) => {
          flowEdge.push({
            id: `edge-return-${product.optionValue}`,
            source: `${product.optionValue}`,
            arrowHeadType: 'arrow',
            target: `${item._id}`
          });
        });
      });

      if (consumeProducts.length > 0) {
        flow.push({
          id: consumeID,
          sourcePosition: 'right',
          targetPosition: 'left',
          type: 'default',
          data: {
            ref_type: 'consume product',
            ref_id: '',
            label: (
              <HtmlTooltip arrow placement="top" title={<>Consume Products</>}>
                <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Consume Products
                  {/* {item.ticketName}
                  <br />
                  {item.ticketType} Ticket */}
                </div>
              </HtmlTooltip>
            )
          },
          position: { x: xPosition, y: lastYPosition + 80 },
          style: customNodeStyles.loadingTicket
        });
      }

      if (
        (status === RENTAL_STATUS.cancelled || status === RENTAL_STATUS.closed) &&
        (receivingTicket.length || returnTicket.length || consumeProducts.length)
      ) {
        xPosition += 300;
        const endRentalTicketId = '12345678900987654123456';
        flow.push({
          id: `${endRentalTicketId}`,
          type: 'output',
          className: 'dark-node',
          targetPosition: 'left',
          data: {
            ref_type: 'rentalJob',
            ref_id: rentalId,
            label: <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{rentalName ?? rentalName}</div>
          },
          position: { x: xPosition, y: 70 },
          style: RENTAL_STATUS.cancelled ? customDeliveredNodeStyle.cancelledRentalJob : customDeliveredNodeStyle.closedRentalJob
        });
        receivingTicket?.map((item: any) => {
          flowEdge.push({
            id: `edge-receiving-and-return-${item._id}`,
            source: `${item._id}`,
            arrowHeadType: 'arrow',
            target: `${endRentalTicketId}`
          });
        });
        returnTicket?.map((item: any) => {
          flowEdge.push({
            id: `edge-receiving-and-return-${item._id}`,
            source: `${item._id}`,
            arrowHeadType: 'arrow',
            target: `${endRentalTicketId}`
          });
        });
        consumeProducts.length &&
          flowEdge.push({
            id: `edge-consume-last-rental`,
            source: consumeID,
            arrowHeadType: 'arrow',
            target: `${endRentalTicketId}`
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
      case 'rentalJob':
        break;
      case 'product':
        history.push(`${routes.productDetail.path}/${element.data.ref_id}`);
        break;
      case 'package':
        history.push(`${routes.packagesDetail.path}/${element.data.ref_id}`);
        break;
      case 'asset':
        history.push(`${routes.serializedAssetDetail.path}/${element.data.ref_id}`);
        break;
      case 'loading':
        history.push(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
        break;
      case 'receiving':
        history.push(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
        break;
      case 'return':
        history.push(`${routes.deliveryTicketDetail.path}/${element.data.ref_id}`);
        break;
      case 'purchaseOrder':
        history.push(`${routes.purchaseOrderDetail.path}/${element.data.ref_id}`);
        break;
      case 'sublease':
        history.push(`${routes.subleaseDetail.path}/${element.data.ref_id}`);
        break;
      case 'transferAsset':
        history.push(`${routes.transferAssetDetail.path}/${element.data.ref_id}`);
        break;
      case 'bulkAsset':
        history.push(`${routes.bulkAssetCreationDetail.path}/${element.data.ref_id}`);
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

export default RentalManagementViews;
