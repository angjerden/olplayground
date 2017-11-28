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

    // geometry = snapToOriginFeature(geometry);

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
    deleteCondition: ol.events.condition.never,
    insertVertexCondition: ol.events.condition.never,
    source: drawSource
});

map.addInteraction(modifyInteraction);

function changeFeatureFunction(event) {
    let feature = event.target;
    let geometry = feature.getGeometry();
    console.log("change event - Geometry within origin: " + isWithinOriginGeometry(geometry));

    // Removing change event temporarily to avoid infinite recursion
    feature.un("change", changeFeatureFunction);

    rectanglifyModifiedGeometry(geometry);

    // Reenabling change event
    feature.on("change", changeFeatureFunction);
    console.log("Feature at end of change: " + wktFormat.writeGeometry(geometry));
}

function rectanglifyModifiedGeometry(geometry) {
    const current = findDraggedCoordinate(geometry);
    if (current !== -1) { // a coordinate was dragged and its neighbors must be realigned
        const coords = geometry.getCoordinates()[0];
        const opposite = (current + 2) % (coords.length - 1);

        // rotating inversely around dragged coordinate
        geometry.rotate(originRadians*(-1), coords[opposite]);
        let rCoords = geometry.getCoordinates()[0];

        let { currentX, currentY, previous, previousX, previousY,
            next, nextX, nextY, oppositeX, oppositeY
        } = getSurroundingCoordinateValues(rCoords, current);

        // previous and opposite is aligned on x-axis
        // should get new Y
        if (areAlignedWithinTolerance(previousX, oppositeX)) {
            rCoords[previous][1] = currentY;
        } else if(areAlignedWithinTolerance(previousY, oppositeY)) { // aligned on y-axis
            rCoords[previous][0] = currentX;
        }

        // next and opposite is aligned on x-axis
        if (areAlignedWithinTolerance(nextX, oppositeX)) {
            rCoords[next][1] = currentY;
        } else if (areAlignedWithinTolerance(nextY, oppositeY)) { // aligned on y-axis
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

        geometry.rotate(originRadians, rCoords[opposite]);
    }

    return geometry;
}

function findDraggedCoordinate(geometry) {
    let geometryClone = geometry.clone();
    let coords = geometryClone.getCoordinates()[0];
    let rotationCoord = coords[1];
    // Rotating geometry to make it parallel to coordinate axes
    // This makes it easier to work with
    geometryClone.rotate(originRadians*(-1), rotationCoord);
    let rCoords = geometryClone.getCoordinates()[0]; // get rotated coords
    for (let current = 0; current < rCoords.length - 1; current++) {
        let { currentX, currentY, previousX, previousY, nextX, nextY } =
            getSurroundingCoordinateValues(rCoords, current);

        // if coordinate is no longer aligned with neighbors, it has been dragged
        if (!areAlignedWithinTolerance(currentX, previousX) &&
            !areAlignedWithinTolerance(currentY, previousY) &&
            !areAlignedWithinTolerance(currentX, nextX) &&
            !areAlignedWithinTolerance(currentY, nextY)) {
            console.log("Dragged coordinate index was: " + current);
            return current;
        }
    }

    return -1; // returning -1 in the absence of an actual dragged coordinate
}

function getSurroundingCoordinateValues(coords, current) {
    let previous = current === 0 ? coords.length - 2 : current - 1;
    let next = (current + 1) % (coords.length - 1);
    let opposite = (next + 1) % (coords.length - 1);

    let currentX = Math.round(coords[current][0]);
    let currentY = Math.round(coords[current][1]);
    let previousX = Math.round(coords[previous][0]);
    let previousY = Math.round(coords[previous][1]);
    let nextX = Math.round(coords[next][0]);
    let nextY = Math.round(coords[next][1]);
    let oppositeX = Math.round(coords[opposite][0]);
    let oppositeY = Math.round(coords[opposite][1]);

    return {currentX, currentY, previous, previousX, previousY,
        next, nextX, nextY, oppositeX, oppositeY};
}

const neighborDragTolerance = 10;

function areAlignedWithinTolerance(coord1, coord2) {
    const half = neighborDragTolerance / 2;
    return coord1 > (coord2 - half) &&
        coord1 < (coord2 + half);
}

ol.events.listen(modifyInteraction, ol.events.EventType.CHANGE,
    (event) => {console.log("Modify change event: " + event.target)});

modifyInteraction.on("change:active", (event) => {
   console.log("Modification change:active event: " + event.target);
});

modifyInteraction.on("modifystart", (event) => {
    const features = event.features;
    const feature = features.getArray()[0];
    feature.on("change", changeFeatureFunction);

    console.log("Feature being modified: " + wktFormat.writeFeature(feature));
});

modifyInteraction.on("modifyend", (event) => {
    const features = event.features;
    const feature = features.getArray()[0];
    feature.un("change", changeFeatureFunction);

    // removing and adding feature to force reindexing
    // of feature's snappable edges in OpenLayers
    drawSource.clear();
    drawSource.addFeature(feature);
    console.log("Feature which was modified: " + wktFormat.writeFeature(feature));
});