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

extentRadians = getRadianFromRectangle(extentFeature);

console.log("Radians: " + extentRadians);

const exampleFeatures = new ol.Collection();
const exampleSource = new ol.source.Vector({
    features: exampleFeatures
});
const exampleLayer = new ol.layer.Vector({
    source: exampleSource,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: "rgba(250, 50, 205, 1.0)",
            width: 2
        })
    })
});
map.addLayer(exampleLayer);

const feature1 = wktFormat.readFeature(
    "POLYGON((192593.25 6907265.25," +
    "296851.25 6907265.25," +
    "296851.25 6960748.25," +
    "192593.25 6960748.25," +
    "192593.25 6907265.25))",
    {
        dataProjection: proj25832
    }
);
exampleFeatures.push(feature1);

feature1.getGeometry().transform("EPSG:25832", "EPSG:25833");

function getRadianFromRectangle(feature) {
    if (isRectangle(feature)) {
        const coords = feature.getGeometry().getCoordinates()[0];

        const point1 = coords[0];
        const point2 = coords[1];

        const deltaY = point2[1] - point1[1];
        const deltaX = point2[0] - point1[0];

        const angleRadians = Math.atan2(deltaY, deltaX);
        return angleRadians;
    }
    return 0;
}

function isRectangle(feature) {
    const geometry = feature.getGeometry();
    if (!(geometry instanceof ol.geom.Polygon)) {
        return false
    }

    const coords = feature.getGeometry().getCoordinates()[0];
    if (coords.length === 5) {
        return true;
    }

}

function reduceToWithinExtentFeature(geometry) {
    if (!extentFeature) {
        return geometry;
    }

/*
    const drawingExtent = ol.extent.boundingExtent(
        extentFeature.getGeometry().getCoordinates()[0]
    );

    extent[0] = extent[0] < drawingExtent[0] ? drawingExtent[0] : extent[0];
    extent[1] = extent[1] < drawingExtent[1] ? drawingExtent[1] : extent[1];
    extent[2] = extent[2] > drawingExtent[2] ? drawingExtent[2] : extent[2];
    extent[3] = extent[3] > drawingExtent[3] ? drawingExtent[3] : extent[3];
*/

    const extentCoords = extentFeature.getGeometry().getCoordinates()[0];
    const coords = geometry.getCoordinates()[0];

    coords[0] = coords[0] <  extentCoords[0] ? extentCoords[0] : coords[0];
    coords[1] = coords[1] <  extentCoords[1] ? extentCoords[1] : coords[1];
    coords[2] = coords[2] >  extentCoords[2] ? extentCoords[2] : coords[2];
    coords[3] = coords[3] >  extentCoords[3] ? extentCoords[3] : coords[3];

    geometry.setCoordinates([coords]);

    return geometry;
}