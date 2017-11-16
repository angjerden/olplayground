const extentSource = new ol.source.Vector();
const extentLayer = new ol.layer.Vector({
    source: extentSource
});

map.addLayer(extentLayer);

const wktFormat = new ol.format.WKT();
const extentFeature = wktFormat.readFeature(
    "POLYGON((" +
    "203924.13421961034 7009144.369912976," +
    "300291.7918871776 6979334.360106427," +
    "316497.23345986544 7031722.147160608," +
    "220129.57579229822 7061532.1569671575," +
    "203924.13421961034 7009144.369912976" +
    "))"
);

extentSource.addFeature(extentFeature);

console.log("Radians: " + getRadianFromTiltedRectangle(extentFeature));

function getRadianFromTiltedRectangle(feature) {
    const coords = feature.getGeometry().getCoordinates()[0];
    const radius = new ol.geom.LineString([coords[0], coords[1]]).getLength();
    const point1 = coords[1];
    const point2 = [coords[0][0] + radius, coords[0][1]];

    const angleRadians = Math.atan2(point2[0][1] - point1[0][1], point2[0][0] - point1[0][0]);
    return angleRadians;
}

function reduceToWithinExtentFeature(extent) {
    if (!extentFeature) {
        return extent;
    }

    const drawingExtent = ol.extent.boundingExtent(
        extentFeature.getGeometry().getCoordinates()[0]
    );

    extent[0] = extent[0] < drawingExtent[0] ? drawingExtent[0] : extent[0];
    extent[1] = extent[1] < drawingExtent[1] ? drawingExtent[1] : extent[1];
    extent[2] = extent[2] > drawingExtent[2] ? drawingExtent[2] : extent[2];
    extent[3] = extent[3] > drawingExtent[3] ? drawingExtent[3] : extent[3];

/*
    const extentCoordinates = extentFeature.getGeometry().getCoordinates();

    extent[0] = extent[0] <  extentCoordinates[0] ? extentCoordinates[0] : extent[0];
    extent[1] = extent[1] <  extentCoordinates[1] ? extentCoordinates[1] : extent[1];
    extent[2] = extent[2] <  extentCoordinates[2] ? extentCoordinates[2] : extent[2];
    extent[3] = extent[3] <  extentCoordinates[3] ? extentCoordinates[3] : extent[3];
*/

    return extent;
}