var OLPlayground = OLPlayground || {};

const projectionName = 'EPSG:25833';
const extent = {
	'EPSG:3857': [20037508.34, 20037508.34, 20037508.34, 20037508.34],
    'EPSG:25832': [-1878007.03, 3932282.86, 831544.53, 9437501.55],
    //'EPSG:25833': [-2465220.60, 4102904.86, 771164.64, 9406031.63],
	'EPSG:25833': [-2500000, 3500000, 3045984, 9045984],
	'EPSG:32633': [-2500000, 3500000, 3045984, 9045984]
};

proj4.defs(projectionName, '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs');
proj4.defs("EPSG:25832","+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs");

const projection = new ol.proj.Projection({
  code: projectionName,
  extent: extent[projectionName],
  units: 'm'
});
const proj25832 = new ol.proj.Projection({
    code: 'EPSG:25832',
    extent: extent['EPSG:25832'],
    units: 'm'
});
ol.proj.addProjection(projection);
ol.proj.addProjection(proj25832);

var projectionExtent = projection.getExtent(),
    size = ol.extent.getWidth(projectionExtent) / 256,
    resolutions = [],
    matrixIds = [];

for (var z = 0; z < 21; ++z) {
    resolutions[z] = size / Math.pow(2, z);
    matrixIds[z] = projectionName+":"+z;
}

OLPlayground.projectionName = projectionName;
OLPlayground.extent = extent;
OLPlayground.projection = projection;
OLPlayground.resolutions = resolutions;
OLPlayground.matrixIds = matrixIds;