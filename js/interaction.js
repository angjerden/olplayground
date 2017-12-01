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

    // snapToOriginFeature(geometry);

    console.log("Geometry within originFeature: " + isWithinOriginGeometry(geometry));
    console.log("Geometry has sides longer than 1 km: " + hasSidesLongerThanOneKm(geometry));
    console.log("Geometry has area less than 10 km2: " + hasAreaLessThanTenSquareKm(geometry));

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
    rmFeatures.clear();
});

map.addInteraction(drawInteraction);

const modifyInteraction = new ol.interaction.Modify({
    deleteCondition: ol.events.condition.never,
    insertVertexCondition: ol.events.condition.never,
    source: drawSource
});

map.addInteraction(modifyInteraction);

const useSnapping = true;

function changeFeatureFunction(event) {
    let feature = event.target;
    let geometry = feature.getGeometry();
    //console.log("change event - Geometry within origin: " + isWithinOriginGeometry(geometry));

    // Removing change event temporarily to avoid infinite recursion
    feature.un("change", changeFeatureFunction);

    rectanglifyModifiedGeometry(geometry, useSnapping);

    // Reenabling change event
    feature.on("change", changeFeatureFunction);
}

function rectanglifyModifiedGeometry(geometry, useSnapping) {
    //const current = findDraggedCoordinate(geometry);
    const current = findDraggedCoordinate2(geometry);
    if (current !== -1) { // a coordinate was dragged and its neighbors must be realigned
        const coords = geometry.getCoordinates()[0];
        const opposite = (current + 2) % (coords.length - 1);

        // rotating inversely around opposite of dragged coordinate
        // opposite coordinate will not change and is a stable point of rotation
        geometry.rotate(originRadians*(-1), coords[opposite]);
        let rCoords = geometry.getCoordinates()[0];

        let { currentX, currentY, currentRel, previous, previousX, previousY, previousRel,
            next, nextX, nextY, nextRel, oppositeX, oppositeY, oppositeRel
        } = getSurroundingCoordinateValues(geometry, current);

        console.log("Dragged corner was: " + currentRel);

        // previous and next should get new coordinates from the dragged coordinate

        /*if (currentRel === rectangleCorners.bottomLeft) {
            if (previousRel === rectangleCorners.topLeft) { //previous gets new x, next gets new Y
                rCoords[previous][0] = currentX;
                rCoords[next][1] = currentY;
            } else {
                rCoords[previous][1] = currentY;    //previous is bottomRight, gets new Y
                rCoords[next][0] = currentX;        //next is topLeft, get new X
            }
        }

        if (currentRel === rectangleCorners.bottomRight) {
            if (previousRel === rectangleCorners.bottomLeft) {
                rCoords[previous][1] = currentY;
                rCoords[next][0] = currentX;
            } else {
                rCoords[previous][0] = currentX;
                rCoords[next][1] = currentY;
            }
        }

        if (currentRel === rectangleCorners.topRight) {
            if (previousRel === rectangleCorners.bottomRight) {
                rCoords[previous][0] = currentX;
                rCoords[next][1] = currentY;
            } else {
                rCoords[previous][1] = currentY;
                rCoords[next][0] = currentX;
            }
        }

        if (currentRel === rectangleCorners.topLeft) {
            if (previousRel === rectangleCorners.topRight) {
                rCoords[previous][1] = currentY;
                rCoords[next][0] = currentX;
            } else {
                rCoords[previous][0] = currentX;
                rCoords[next][1] = currentY;
            }
        }*/

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

        if (useSnapping) {
            snapToOriginFeature(geometry, rCoords[opposite]);
        }

        geometry.rotate(originRadians, rCoords[opposite]);
    }
}

/**
 *
 * Finds index of coordinate which has been dragged
 * Compares to coordinates of the same geometry
 * pre-modification
 *
 * @param geometry
 * @returns {number}
 */
function findDraggedCoordinate2(geometry) {
    if (lastDraggedCoordinateIndex === -1) {
        const origCoords = featureOnModifyStart.getGeometry().getCoordinates()[0];
        const coords = geometry.getCoordinates()[0];

        for (let i = 0; i < origCoords.length; i++) {
            if (origCoords[i][0] !== coords[i][0] || origCoords[i][1] !== coords[i][1]) {
                lastDraggedCoordinateIndex = i;
                console.log("Dragged coordinate index was: " + lastDraggedCoordinateIndex);
                break;
            }
        }
    }

    return lastDraggedCoordinateIndex;
}

const rectangleCorners = Object.freeze({
    bottomLeft: "BOTTOM_LEFT",
    bottomRight: "BOTTOM_RIGHT",
    topRight: "TOP_RIGHT",
    topLeft: "TOP_LEFT"
});

function findRelativePositionOfCoordinateInRectangle(geometry, index) {
    const coords = geometry.getCoordinates()[0];
    const extent = geometry.getExtent();
    const bottomLeft = ol.extent.getBottomLeft(extent);
    const bottomRight = ol.extent.getBottomRight(extent);
    const topRight = ol.extent.getTopRight(extent);
    const topLeft = ol.extent.getTopLeft(extent);

    const extentCorners = [bottomLeft, bottomRight, topRight, topLeft];

    const currentCoordinate = coords[index];

    let shortestSoFar = 9999999999;
    let closestCornerIndex = -1;

    for (let i = 0; i < extentCorners.length; i++) {
        const ls = new ol.geom.LineString([extentCorners[i], currentCoordinate]);
        const length = ls.getLength();
        if (length < shortestSoFar) {
            shortestSoFar = length;
            closestCornerIndex = i;
        }
    }

    switch(closestCornerIndex) {
        case 0:
            return rectangleCorners.bottomLeft;
            break;
        case 1:
            return rectangleCorners.bottomRight;
            break;
        case 2:
            return rectangleCorners.topRight;
            break;
        case 3:
            return rectangleCorners.topLeft;
            break;
        default:
            return "";
            break;
    }
}

function getSurroundingCoordinateValues(geometry, current) {
    const coords = geometry.getCoordinates()[0];
    let previous = current === 0 ? coords.length - 2 : current - 1;
    let next = (current + 1) % (coords.length - 1);
    let opposite = (next + 1) % (coords.length - 1);

    let currentX = Math.round(coords[current][0]);
    let currentY = Math.round(coords[current][1]);
    let currentRel = findRelativePositionOfCoordinateInRectangle(geometry, current);
    let previousX = Math.round(coords[previous][0]);
    let previousY = Math.round(coords[previous][1]);
    let previousRel = findRelativePositionOfCoordinateInRectangle(geometry, previous);
    let nextX = Math.round(coords[next][0]);
    let nextY = Math.round(coords[next][1]);
    let nextRel = findRelativePositionOfCoordinateInRectangle(geometry, next);
    let oppositeX = Math.round(coords[opposite][0]);
    let oppositeY = Math.round(coords[opposite][1]);
    let oppositeRel = findRelativePositionOfCoordinateInRectangle(geometry, opposite);

    return {currentX, currentY, currentRel, previous, previousX, previousY, previousRel,
        next, nextX, nextY, nextRel, oppositeX, oppositeY, oppositeRel};
}

const neighborAlignmentTolerance = 5;
let featureOnModifyStart;
let lastDraggedCoordinateIndex = -1;

function areAlignedWithinTolerance(coord1, coord2) {
    const half = neighborAlignmentTolerance / 2;
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
    featureOnModifyStart = feature.clone();
    feature.on("change", changeFeatureFunction);

    // console.log("Feature being modified: " + wktFormat.writeFeature(feature));
});

modifyInteraction.on("modifyend", (event) => {
    const features = event.features;
    const feature = features.getArray()[0];
    feature.un("change", changeFeatureFunction);

    lastDraggedCoordinateIndex = -1;

    // removing and adding feature to force reindexing
    // of feature's snappable edges in OpenLayers
    drawSource.clear();
    drawSource.addFeature(feature);
    // console.log("Feature which was modified: " + wktFormat.writeFeature(feature));

    exampleFeatures.clear();
});