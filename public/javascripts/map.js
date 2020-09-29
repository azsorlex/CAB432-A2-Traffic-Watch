let currentInfoWindow;

function initMap() {
  // Initialise the map
  const map = new google.maps.Map(
    document.getElementById('map'), { zoom: 5, center: { lat: -22, lng: 145 } });

  // Get the data that was passed through from the server
  const webcamData = JSON.parse(document.getElementById("mapScript").getAttribute("webcamData"));

  // Close the current info window when the map is clicked
  map.addListener('click', function (mapsMouseEvent) {
    closeCurrentInfoWindow();
  });

  webcamData.forEach(cam => {
    // Add a marker for the webcam to the map
    const marker = new google.maps.Marker({
      map,
      position: cam.location,
      title: cam.name
    });

    // Create an Info Window that appears when the marker is clicked on
    const infowindow = new google.maps.InfoWindow({
      content:
        `<h2>${cam.name}</h2>` +
        `<a href=# onclick="javascript:queryOpenCV('${cam.location.lat}')">View live feed</a>`
    });

    // Open the info window when the marker is clicked
    marker.addListener('click', function() {
      closeCurrentInfoWindow();
      currentInfoWindow = infowindow;
      infowindow.open(map, marker);
    })
  });
}

function closeCurrentInfoWindow() {
  try {
    currentInfoWindow.close();
  } catch (e) { }
}

function queryOpenCV(webcamData) {
  // Query OpenCV, then do something with the response
  fetch(`/opencv/${webcamData}`)
    .then((res) => res.json())
    .then((data) => {

    })
    .catch((error) => console.log(error));

  // Show the window where the detailed information will be displayed
  const webcamoverlay = document.getElementById("webcamoverlay");
  webcamoverlay.style.display = "flex";

  // Just an example
  webcamoverlay.innerHTML = webcamData;
}