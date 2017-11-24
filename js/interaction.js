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
    const startCoord = coordinates[0];
    const pointerCoord = coordinates[1];

    // Using different rotation mode depending on which way
    // the rectangle is being drawn
    let flipRotation = false;
    if ((pointerCoord[0] < startCoord[0] && pointerCoord[1] < startCoord[1]) ||
            pointerCoord[0] > startCoord[0] && pointerCoord[1] > startCoord[1]
    ) {
        flipRotation = true;
    }

    if (opt_geometry) {
        geometry = opt_geometry;
    } else {
        geometry = new ol.geom.Polygon(null);
    }

    geometry = calculateRectangleFromDrawExtent(coordinates, flipRotation, geometry);

    console.log("Geometry within originFeature: " + isWithinOriginGeometry(geometry));

    return geometry;
}

function calculateRectangleFromDrawExtent (coordinates, flipRotation, geometry) {
    let drawExtent = ol.extent.boundingExtent(coordinates);

    // Make geometry of the current drawing extent
    const drawExtentGeometry = new ol.geom.Polygon([[
        ol.extent.getBottomLeft(drawExtent),
        ol.extent.getBottomRight(drawExtent),
        ol.extent.getTopRight(drawExtent),
        ol.extent.getTopLeft(drawExtent),
        ol.extent.getBottomLeft(drawExtent)
    ]]);

    let deCoords = drawExtentGeometry.getCoordinates()[0];

    // Rotate geometry using inverse radian around rotation point
    // This rotation now makes it parallel to coordinate axes
    // and makes it easier to work with
    let rotationCoord = flipRotation ? deCoords[0] : deCoords[1];
    drawExtentGeometry.rotate(originRadians * (-1), rotationCoord);
    deCoords = drawExtentGeometry.getCoordinates()[0];

    let bottomLeft;
    let bottomRight;
    let topRight;
    let topLeft;

    if (flipRotation) {
        // Get coordinates from axis parallel extent
        // These make up two coordinates of the new rectangle
        topRight = deCoords[2];
        bottomLeft = deCoords[0];
        rotationCoord = bottomLeft;

        // Use retrieved coordinates
        // to calculate the missing coordinates
        bottomRight = [topRight[0], bottomLeft[1]];
        topLeft = [bottomLeft[0], topRight[1]];
    } else {
        topLeft = deCoords[3];
        bottomRight = deCoords[1];
        rotationCoord = bottomRight;

        bottomLeft = [topLeft[0], bottomRight[1]];
        topRight = [bottomRight[0], topLeft[1]];
    }

    // Make rectangle from these four coordinates
    geometry.setCoordinates([[
        bottomLeft,
        bottomRight,
        topRight,
        topLeft,
        bottomLeft
    ]]);

    // Rotate back with correct radian around rotation point
    geometry.rotate(originRadians, rotationCoord);

    return geometry;
};

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
    rectanglifyModifiedGeometry(geometry);

    //Reenabling change event
    geometry.on("change", changeGeometryFunction);
}

function rectanglifyModifiedGeometry(geometry) {
    let coords = geometry.getCoordinates()[0];
    geometry.rotate(originRadians*(-1), coords[1]);
    let rCoords = geometry.getCoordinates()[0]; // get rotated coords
    for (let current = 0; current < rCoords.length - 1; current++) {
        let previous = current === 0 ? rCoords.length - 2 : current - 1;
        let next = (current + 1) % (rCoords.length - 1);
        let opposite = (next + 1) % (rCoords.length - 1);

        let currentX = Math.round(rCoords[current][0]);
        let currentY = Math.round(rCoords[current][1]);
        let previousX = Math.round(rCoords[previous][0]);
        let previousY = Math.round(rCoords[previous][1]);
        let nextX = Math.round(rCoords[next][0]);
        let nextY = Math.round(rCoords[next][1]);
        let oppositeX = Math.round(rCoords[opposite][0]);
        let oppositeY = Math.round(rCoords[opposite][1]);

        // if coordinate no longer is aligned with neighbors, it has been modified
        if (currentX !== previousX &&
            currentY !== previousY &&
            currentX !== nextX &&
            currentY !== nextY
        ) {
            console.log("Modified index was: " + current);

            // previous and opposite is aligned on x-axis
            // should get new Y
            if (previousX === oppositeX) {
                rCoords[previous][1] = currentY;
            } else if(previousY === oppositeY) { // aligned on y-axis
                rCoords[previous][0] = currentX;
            }

            // next and opposite is aligned on x-axis
            if (nextX === oppositeX) {
                rCoords[next][1] = currentY;
            } else if (nextY === oppositeY) { // aligned on y-axis
                rCoords[next][0] = currentX;
            }

            // when modifying 0-th coordinate, remember to modify
            // the polygon's "closing coordinate"
            if (previous === 0) {
                rCoords[rCoords.length - 1] = rCoords[previous];
            } else if (next === 0) {
                rCoords[rCoords.length - 1] = rCoords[next];
            }

            geometry.setCoordinates([rCoords]);

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