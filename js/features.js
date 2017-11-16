const extentSource = new ol.source.Vector();
const extentLayer = new ol.layer.Vector({
    source: extentSource
});

map.addLayer(extentLayer);

const wktFormat = new ol.format.WKT();
const extentFeature = wktFormat.readFeature(
    "POLYGON((" +
        "1019766.8532649018 9135834.240494736," +
        "1282649.9493330596 9054514.969471246," +
        "1333971.4448234402 9220423.41232315," +
        "1071088.3487552826 9301742.68334664," +
        "1019766.8532649018 9135834.240494736" +
    "))"
);

extentSource.addFeature(extentFeature);

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

    return extent;
}