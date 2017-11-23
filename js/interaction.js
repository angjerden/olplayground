const drawSource = new ol.source.Vector({});
const drawLayer = new ol.layer.Vector({
    source: drawSource,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: "rgba(0, 0, 255, 1.0)",
            width: 2
        })
    })
});

map.addLayer(drawLayer);

function geometryFunction(coordinates, opt_geometry) {
    let geometry;
    let extent = ol.extent.boundingExtent(coordinates);
    const firstCoord = coordinates[0];
    const lastCoord = coordinates[1];
    if (opt_geometry) {
        geometry = opt_geometry;
    } else {
        geometry = new ol.geom.Polygon(null);
    }

    geometry.setCoordinates([[
        ol.extent.getBottomLeft(extent),
        ol.extent.getBottomRight(extent),
        ol.extent.getTopRight(extent),
        ol.extent.getTopLeft(extent),
        ol.extent.getBottomLeft(extent)
    ]]);
    geometry.rotate(originRadians, geometry.getInteriorPoint().getCoordinates());

    // geometry = reduceToWithinExtentFeature(geometry);

    console.log("Geometry within originFeature: " + isWithinOriginGeometry(geometry));

    return geometry;
}

function geometryFunction2(coordinates, opt_geometry) {
    let geometry;
    let drawExtent = ol.extent.boundingExtent(coordinates);
    if (opt_geometry) {
        geometry = opt_geometry;
    } else {
        geometry = new ol.geom.Polygon(null);
    }

    // Make geometry of the current drawing extent
    const drawExtentGeometry = new ol.geom.Polygon([[
        ol.extent.getBottomLeft(drawExtent),
        ol.extent.getBottomRight(drawExtent),
        ol.extent.getTopRight(drawExtent),
        ol.extent.getTopLeft(drawExtent),
        ol.extent.getBottomLeft(drawExtent)
    ]]);

    // Rotate geometry using inverse radian around bottom right corner
    let deCoords = drawExtentGeometry.getCoordinates()[0];
    drawExtentGeometry.rotate((originRadians)*(-1), deCoords[1]);

    // Get top left and bottom right coordinates
    // of rotated drawExtentGeometry
    deCoords = drawExtentGeometry.getCoordinates()[0];
    const topLeft = deCoords[3];
    const bottomRight = deCoords[1]

    // Use retrieved coordinates
    // to calculate bottom left and top right
    const bottomLeft = [topLeft[0], bottomRight[1]];
    const topRight = [bottomRight[0], topLeft[1]];

    // Make rectangle from these four coordinates
    geometry.setCoordinates([[
        bottomLeft,
        bottomRight,
        topRight,
        topLeft,
        bottomLeft
    ]]);

    // Rotate back with correct radian around bottom right corner
    geometry.rotate(originRadians, bottomRight);

    console.log("Geometry within originFeature: " + isWithinOriginGeometry(geometry));

    return geometry;
}

const drawInteraction = new ol.interaction.Draw({
    // geometryFunction: geometryFunction,
    geometryFunction: geometryFunction2,
    source: drawSource,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: "rgba(20, 20, 235, 1.0)",
            width: 2
        })
    }),
    type: "Circle",
});

drawInteraction.on("drawstart", () => {
    drawSource.clear();
});

map.addInteraction(drawInteraction);

const modifyInteraction = new ol.interaction.Modify({
    insertVertexCondition: ol.events.condition.never,
    source: drawSource,
    deleteCondition: (event) => {
        return ol.events.condition.shiftKeyOnly(event) &&
        ol.events.condition.singleClick(event);
    },
});

map.addInteraction(modifyInteraction);

function changeGeometryFunction(event) {
    let geometry = event.target;
    console.log("change event - Geometry within origin: " + isWithinOriginGeometry(geometry));
    const coords = geometry.getCoordinates()[0];
    // Removing change event temporarily to avoid infinite recursion
    geometry.un("change", changeGeometryFunction);
    /*geometry.setCoordinates([[
        [coords[0][0], coords[0][1]],
        coords[1],
        coords[2],
        coords[3],
        coords[4]
    ]]);*/
    // geometry = rectanglifyModifiedGeometry(geometry);
    rectanglifyModifiedGeometry(geometry);

    //Reenabling change event
    geometry.on("change", changeGeometryFunction);
}

function rectanglifyModifiedGeometry(geometry) {
    let coords = geometry.getCoordinates()[0];
    geometry.rotate(originRadians*(-1), coords[1]);
    let rCoords = geometry.getCoordinates()[0]; // get rotated coords
    for (let current = 0; current < rCoords.length; current++) {
        let previous = current === 0 ? rCoords.length - 1 : current - 1;
        let next = current === rCoords.length - 1 ? 0 : current + 1;

        let currentX = Math.round(rCoords[current][0]);
        let currentY = Math.round(rCoords[current][1]);
        let previousX = Math.round(rCoords[previous][0]);
        let previousY = Math.round(rCoords[previous][1]);
        let nextX = Math.round(rCoords[next][0]);
        let nextY = Math.round(rCoords[next][1]);

        if (currentX !== previousX &&
            currentY !== previousY &&
            currentX !== nextX &&
            currentY !== nextY
        ) {
            console.log("Modified index was: " + current);

            break;
        }
    }

    geometry.rotate(originRadians, rCoords[1]);
}

modifyInteraction.on("modifystart", () => {
    const feature = drawSource.getFeatures()[0];
    feature.getGeometry().on("change", changeGeometryFunction);
    console.log("Feature being modified: " + wktFormat.writeFeature(feature));

});

modifyInteraction.on("modifyend", () => {
    const feature = drawSource.getFeatures()[0];
    feature.getGeometry().un("change", changeGeometryFunction);
    console.log("Feature which was modified: " + wktFormat.writeFeature(feature));
});