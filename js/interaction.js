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
    if (opt_geometry) {
        geometry = opt_geometry;
    } else {
        geometry = new ol.geom.Polygon(null);
    }

    let extent = ol.extent.boundingExtent(coordinates);
    geometry.setCoordinates([[
        ol.extent.getBottomLeft(extent),
        ol.extent.getBottomRight(extent),
        ol.extent.getTopRight(extent),
        ol.extent.getTopLeft(extent),
        ol.extent.getBottomLeft(extent)
    ]]);
    geometry.rotate(extentRadians, geometry.getInteriorPoint().getCoordinates());

    //geometry = reduceToWithinExtentFeature(geometry);

    return geometry;
}

const drawInteraction = new ol.interaction.Draw({
    geometryFunction: geometryFunction,
    // geometryFunction: ol.interaction.Draw.createRegularPolygon(4, -0.3),
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

modifyInteraction.on("modifystart", () => {
    const feature = drawSource.getFeatures()[0];
    feature.getGeometry().on("change", () => {
        console.log("change event for geometry: " + wktFormat.writeFeature(feature));
    });
    console.log("Feature being modified: " + wktFormat.writeFeature(feature));


});

modifyInteraction.on("modifyend", () => {
    const feature = drawSource.getFeatures()[0];
    console.log("Feature which was modified: " + wktFormat.writeFeature(feature));
});