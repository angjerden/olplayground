var OLPlayground = OLPlayground || {};

const kartverkLayer = new ol.layer.Tile({
    source: new ol.source.WMTS({
        url: 'http://opencache.statkart.no/gatekeeper/gk/gk.open_wmts?',
        layer: 'topo2graatone',
        format: 'image/png',
        projection: OLPlayground.projection,
        matrixSet: OLPlayground.projectionName,
        tileGrid: new ol.tilegrid.WMTS({
            origin: ol.extent.getTopLeft(OLPlayground.projection.getExtent()),
            resolutions: OLPlayground.resolutions,
            matrixIds: OLPlayground.matrixIds
        }),
    }),
    style: 'default'
});

const map = new ol.Map({
  target: 'map',
  layers: [
    kartverkLayer
  ],
  view: new ol.View({
    center: [252000, 7010000],
    projection: OLPlayground.projection,
    zoom: 4
  })
});
