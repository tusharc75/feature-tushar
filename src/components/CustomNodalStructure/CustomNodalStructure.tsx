import React, { useState } from 'react'
import { graphOptions } from '../../constants/helpers';
import Graph from "vis-react";

export default function CustomNodalStructure({ graphData, onClick, loadingGraphData, id }) {

    const { nodes, edges, colorPalette } = graphData;

    const [graphNetwork, setGraphNetwork] = useState<any>(null);

    const events = {
        // select: function (event) {
        //     // var { nodes, edges } = event;
        // },
        hoverNode: function (event) {
            if (event?.node !== id) {
                graphNetwork.canvas.body.container.style.cursor = "pointer";
            } else {
                graphNetwork.canvas.body.container.style.cursor = "no-drop";
            }
            // this.neighbourhoodHighlight(event, this.props.searchData);
        },
        blurNode: function (event) {
            graphNetwork.canvas.body.container.style.cursor = "default";
            // this.neighbourhoodHighlightHide(event);
        },
        click: function (event) {
            if (event.nodes.length > 0) {
                const node = graphData.nodes.find(d => d.id === event.nodes[0]);
                onClick(node)
            }
            // this.redirectToLearn(event, this.props.searchData);
        }
    }

    const getNetwork = data => {
        setGraphNetwork(data);
    };

    const getEdges = data => {
    };

    const getNodes = data => {
    };

    return (
        <>
            {
                colorPalette && Object.keys(colorPalette).length > 0 && <div className="d-flex justify-content-center gap-3 py-3 flex-wrap">
                    {
                        Object.keys(colorPalette).map((key, index) => (
                            <div className="d-flex align-items-center gap-2" key={index}>
                                <div style={{ background: colorPalette[key], height: 12, width: 12, borderRadius: "50%" }} />
                                <h4>{key}</h4>
                            </div>
                        ))
                    }
                </div>
            }

            <div style={{ height: "500px", width: "100%" }}>
                {
                    loadingGraphData ? <div className="d-flex align-items-center justify-content-center h-100 w-100">
                        <h3>Loading...</h3>
                    </div> : (
                        !loadingGraphData && nodes.length > 0 ? <Graph
                            graph={{ nodes: nodes.map(m => { return { ...m, title: m.label, label: m.label.length <= 20 ? m.label : `${m.label.substr(0, 20)}...`, widthConstraint: { minimum: 25 } } }), edges: edges }}
                            options={graphOptions}
                            getNetwork={getNetwork}
                            getEdges={getEdges}
                            getNodes={getNodes}
                            events={events}
                            style={{ height: "100%", width: "100%" }}
                        /> : <div className="d-flex align-items-center justify-content-center h-100 w-100">
                            <h3>No data found to display</h3>
                        </div>
                    )
                }
            </div>
        </>
    )
}
