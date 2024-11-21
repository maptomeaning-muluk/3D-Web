const viewer = new Cesium.Viewer("cesiumContainer", {
  terrain: Cesium.Terrain.fromWorldTerrain(),
});
const scene = viewer.scene;

try {
  const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(40866);
  scene.primitives.add(tileset);
} catch (error) {
  console.log(`Error loading tileset: ${error}`);
}

// Observer position
const observer = new Cesium.Cartesian3(
  1216379.1782947562,
  -4736305.994587113,
  4081359.5125561724
);

// Target positions
const targets = [
  new Cesium.Cartesian3(1216333.057784025, -4736281.086708096, 4081394.1726688854),
  new Cesium.Cartesian3(1216330.6999324537, -4736280.802673173, 4081394.983483405),
  new Cesium.Cartesian3(1216336.2123065037, -4736271.291543718, 4081386.2335290858),
  new Cesium.Cartesian3(1216344.791616743, -4736269.0712712, 4081379.8397003785),
  new Cesium.Cartesian3(1216308.2487227658, -4736249.094535465, 4081411.3065826776),
  new Cesium.Cartesian3(1216396.0036570462, -4736309.345371385, 4081318.018882543),
];

// Add observer point to the scene
viewer.entities.add({
  position: observer,
  point: { pixelSize: 10, color: Cesium.Color.RED },
  name: "Observer",
});

// Add target points to the scene
targets.forEach((target, index) => {
  viewer.entities.add({
    position: target,
    point: { pixelSize: 10, color: Cesium.Color.BLUE },
    name: `Target ${index + 1}`,
  });
});

// Custom dataSource for line entities
const dataSource = new Cesium.CustomDataSource("SightViewLines");
viewer.dataSources.add(dataSource);

/**
 * Draws the line of sight between two points.
 * @param {*} dataSource Cesium.DataSource the entities that you don't want to exclude in the hit measurement
 * @param {*} positionData An array containing [startPoint, endPoint], both as Cesium.Cartesian3
 */
function drawSightViewLine(dataSource, positionData) {
  try {
    const direction = Cesium.Cartesian3.normalize(
      Cesium.Cartesian3.subtract(positionData[1], positionData[0], new Cesium.Cartesian3()),
      new Cesium.Cartesian3()
    );

    const ray = new Cesium.Ray(positionData[0], direction);

    const intersectionResult = viewer.scene.pickFromRay(ray);

    if (intersectionResult && intersectionResult.position) {
      const intersectionPoint = intersectionResult.position;

      // Blue line to intersection
      dataSource.entities.add({
        polyline: {
          positions: [positionData[0], intersectionPoint],
          width: 30.0,
          material: new Cesium.PolylineGlowMaterialProperty({
            color: Cesium.Color.DEEPSKYBLUE,
            glowPower: 0.05,
          }),
        }
      });

      // Red line from intersection to target
      dataSource.entities.add({
        polyline: {
          positions: [intersectionPoint, positionData[1]],
          width: 3.0,
          material: new Cesium.PolylineOutlineMaterialProperty({
            color: Cesium.Color.RED.withAlpha(0.5),
            outlineWidth: 0,
          }),
          depthFailMaterial: new Cesium.PolylineOutlineMaterialProperty({
            color: Cesium.Color.RED.withAlpha(0.3),
            outlineWidth: 0,
          }),
        }
      });
    } else {
      // No intersection, draw entire line in blue
      // Still ensure a separate segment for the "red" part
      dataSource.entities.add({
        polyline: {
          positions: positionData,
          width: 30.0,
          material: new Cesium.PolylineGlowMaterialProperty({
            color: Cesium.Color.DEEPSKYBLUE,
            glowPower: 0.05,
          }),
        }
      });

      // Add a minimal red segment at the end to ensure red is always shown
      dataSource.entities.add({
        polyline: {
          positions: [
            positionData[1], 
            Cesium.Cartesian3.add(positionData[1], new Cesium.Cartesian3(0.1, 0.1, 0.1), new Cesium.Cartesian3())
          ],
          width: 3.0,
          material: new Cesium.PolylineOutlineMaterialProperty({
            color: Cesium.Color.RED.withAlpha(0.5),
            outlineWidth: 0,
          }),
        }
      });
    }
  } catch (error) {
    console.error("Error in drawSightViewLine:", error);
  }
}

// Function to test line of sight for all targets
targets.forEach((target) => {
  drawSightViewLine(dataSource, [observer, target]);
});
