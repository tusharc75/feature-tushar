import React, { useState } from 'react'
import { graphOptions } from '../../constants/helpers';
import Graph from "vis-react";

export default function CustomNodalStructure({ graphData, onClick, loadingGraphData, id }) {

    // const [loadingGraphData, setLoadingGraphData] = useState(false);
    // const [graphData, setGraphData] = useState({ edges: [], nodes: [] });
    const [graphNetwork, setGraphNetwork] = useState<any>(null);

    const events = {
        // select: function (event) {
        //     // var { nodes, edges } = event;
        //     // console.log("Selected nodes: ", nodes);
        //     // console.log("Selected edges: ", edges);
        // },
        hoverNode: function (event) {
            if (event?.node !== id) {
                graphNetwork.canvas.body.container.style.cursor = "pointer";
            } else {
                graphNetwork.canvas.body.container.style.cursor = "no-drop";
            }
            // console.log("hoverNode", event);
            // this.neighbourhoodHighlight(event, this.props.searchData);
        },
        blurNode: function (event) {
            graphNetwork.canvas.body.container.style.cursor = "default";
            // console.log("blurNode", event);
            // this.neighbourhoodHighlightHide(event);
        },
        click: function (event) {
            if (event.nodes.length > 0) {
                const node = graphData.nodes.find(d => d.id === event.nodes[0]);
                onClick(node)
            }
            // console.log("click", event);
            // this.redirectToLearn(event, this.props.searchData);
        }
    }

    const getNetwork = data => {
        setGraphNetwork(data);
        // console.log("getNetwork", data)
    };

    const getEdges = data => {
        // console.log("getEdges", data)
    };

    const getNodes = data => {
        // console.log("getNodes", data)
    };

    return (
        loadingGraphData ? <div className="d-flex align-items-center justify-content-center h-100 w-100">
            <h3>Loading...</h3>
        </div> : (
            !loadingGraphData && graphData.nodes.length > 0 ? <Graph
                graph={graphData}
                options={graphOptions}
                getNetwork={getNetwork}
                getEdges={getEdges}
                getNodes={getNodes}
                events={events}
            /> : <div className="d-flex align-items-center justify-content-center h-100 w-100">
                <h3>No data found to display</h3>
            </div>
        )
    )
}
