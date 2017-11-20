let drawFeatures = new ol.Collection();

const drawSource = new ol.source.Vector({
    features: drawFeatures
});
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

<<<<<<< HEAD
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
    "192593.25 6907265.25))"
);
exampleFeatures.push(feature1);

feature1.getGeometry().transform("EPSG:25833", "EPSG:25832");

=======
>>>>>>> 43c399985a83c4490268f51ec00af17d8173f984
/*const draw = new ol.interaction.Draw({
    source: drawSource,
    type: "Circle",
    geometryFunction: ol.interaction.Draw.createBox()
});*/

function geometryFunction(coordinates, opt_geometry) {
    let extent = ol.extent.boundingExtent(coordinates);
    const geometry = opt_geometry || new ol.geom.Polygon(null);

    //extent = reduceToWithinExtentFeature(extent);

    geometry.setCoordinates([[
        ol.extent.getBottomLeft(extent),
        ol.extent.getBottomRight(extent),
        ol.extent.getTopRight(extent),
        ol.extent.getTopLeft(extent),
        ol.extent.getBottomLeft(extent)
    ]]);
    //geometry.rotate(-0.3, geometry.getInteriorPoint().getCoordinates());
    return geometry;
}

const drawInteraction = new ol.interaction.Draw({
    geometryFunction: geometryFunction,
    // geometryFunction: ol.interaction.Draw.createRegularPolygon(4, -0.3),
    features: drawFeatures,
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: "rgba(20, 20, 235, 1.0)",
            width: 2
        })
    }),
    type: "Circle",
});

drawInteraction.on("drawstart", () => {
    if (drawFeatures.getArray().length > 1) {
        drawFeatures.removeAt(0);
    }
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
    const feature = drawFeatures.getArray()[0];
    console.log("Feature being modified: " + wktFormat.writeFeature(feature));
});