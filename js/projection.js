var OLPlayground = OLPlayground || {};

const projectionName = 'EPSG:32633';
const extent = {
	'EPSG:3857': [20037508.34, 20037508.34, 20037508.34, 20037508.34],
	'EPSG:32633': [-2500000, 3500000, 3045984, 9045984]
};

const projection = new ol.proj.Projection({
  code: projectionName,
  extent: extent[projectionName],
  units: 'm'
});
ol.proj.addProjection(projection);

OLPlayground.projectionName = projectionName;
OLPlayground.extent = extent;
OLPlayground.projection = projection;