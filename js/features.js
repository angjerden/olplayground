const originSource = new ol.source.Vector();
const originLayer = new ol.layer.Vector({
    source: originSource
});

map.addLayer(originLayer);

const wktFormat = new ol.format.WKT();
/*const extentFeature = wktFormat.readFeature( //self-drawn
    "POLYGON((" +
    "203924.13421961034 7009144.369912976," +
    "300291.7918871776 6979334.360106427," +
    "316497.23345986544 7031722.147160608," +
    "220129.57579229822 7061532.1569671575," +
    "203924.13421961034 7009144.369912976" +
    "))"
);*/

const originFeature = wktFormat.readFeature( //actual Bergrettighet
    "MULTIPOLYGON Z(((" +
        "233796.6368000004 6969543.316399999 0," +
        "238773.1131999996 6969078.407000002 0," +
        "238591.1357000005 6967130.3006 0," +
        "233614.6465999996 6967595.137699999 0," +
        "233796.6368000004 6969543.316399999 0" +
    ")))"
);

originSource.addFeature(originFeature);

originRadians = getRadianFromRectangle(originFeature);

console.log("Radians: " + originRadians);

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

const selfIntersectingFeature = wktFormat.readFeature(
    "POLYGON((" +
    "85524.3865341755 6509496.17586309," +
    "85413.6032501954 6509506.11350777," +
    "86311.3824331722 6508298.78046908," +
    "85424.1201928504 6508378.362021," +
    "85524.3865341755 6509496.17586309" +
    "))"
);
exampleFeatures.push(selfIntersectingFeature);

function getRadianFromRectangle(feature) {
    if (isRectangle(feature)) {
        const coords = getCoordinates(feature);

        const point1 = coords[0];
        const point2 = coords[1];

        const deltaY = point2[1] - point1[1];
        const deltaX = point2[0] - point1[0];

        const point3 = coords[2];
        const dY = point3[1] - point2[1];
        const dX = point3[0] - point2[0];

        const testRadian = Math.atan2(dY, dX);
        console.log("Testradian: " + testRadian);

        const angleRadians = Math.atan2(deltaY, deltaX);
        return Math.round(angleRadians * 100) / 100;
    }
    return 0;
}

function isRectangle(feature) {
    const geometry = feature.getGeometry();
    if (!(geometry instanceof ol.geom.Polygon) &&
        !(geometry instanceof ol.geom.MultiPolygon)) {
        return false
    }

    const coords = getCoordinates(feature);

    if (coords.length === 5) {
        return true;
    }
}

function getCoordinates(feature) {
    const geometry = feature.getGeometry();
    let coords;
    if (geometry instanceof ol.geom.Polygon) {
        coords = geometry.getCoordinates()[0];
    }
    if (geometry instanceof ol.geom.MultiPolygon) {
        coords = geometry.getCoordinates()[0][0];
    }
    return coords;
}

function reduceToWithinExtentFeature(geometry) {
    if (!originFeature) {
        return geometry;
    }

    const drawingExtent = ol.extent.boundingExtent(
        getCoordinates(originFeature)
    );
    const gExtent = geometry.getExtent();

    gExtent[0] = gExtent[0] < drawingExtent[0] ? drawingExtent[0] : gExtent[0];
    gExtent[1] = gExtent[1] < drawingExtent[1] ? drawingExtent[1] : gExtent[1];
    gExtent[2] = gExtent[2] > drawingExtent[2] ? drawingExtent[2] : gExtent[2];
    gExtent[3] = gExtent[3] > drawingExtent[3] ? drawingExtent[3] : gExtent[3];

/*
    const extentCoords = extentFeature.getGeometry().getCoordinates()[0];
    const coords = geometry.getCoordinates()[0];

    coords[0] = coords[0] <  extentCoords[0] ? extentCoords[0] : coords[0];
    coords[1] = coords[1] <  extentCoords[1] ? extentCoords[1] : coords[1];
    coords[2] = coords[2] >  extentCoords[2] ? extentCoords[2] : coords[2];
    coords[3] = coords[3] >  extentCoords[3] ? extentCoords[3] : coords[3];
*/

    //geometry.setCoordinates([coords]); // Is this necessary?

    return geometry;
}

function isWithinOriginGeometry(geometry) {
    if (!originFeature) {
        return true;
    }
    const originGeometry =  originFeature.getGeometry();

    const geometryCoords = geometry.getCoordinates()[0];
    for (let i = 0; i < geometryCoords.length; i++) {
        if (!originGeometry.intersectsCoordinate(geometryCoords[i])) {
            return false;
        }
    }

    return true;
}