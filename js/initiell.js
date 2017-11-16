var OLPlayground = OLPlayground || {};

const map = new ol.Map({
  target: 'map',
  layers: [
    new ol.layer.Tile({
      source: new ol.source.OSM()
    })
  ],
  view: new ol.View({
    center: [1120000, 9150000],
    //projection: OLPlayground.projection, //meh, not important
    zoom: 7
  })
});
