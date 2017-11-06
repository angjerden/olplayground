const drawSource = new ol.source.Vector();
const drawLayer = new ol.layer.Vector({
    source: drawSource
});

map.addLayer(drawLayer);

const draw = new ol.interaction.Draw({
    source: drawSource,
    type: "Circle",
    geometryFunction: ol.interaction.Draw.createBox()
});

map.addInteraction(draw);