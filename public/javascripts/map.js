let currentInfoWindow;

function initMap() {
  // Initialise the map
  const map = new google.maps.Map(
    document.getElementById('map'), { zoom: 5, center: { lat: -22, lng: 145 } });

  // Get the data that was passed through from the server
  const webcamData = JSON.parse(document.getElementById("mapScript").getAttribute("webcamData"));

  // Add a click event to the graph housing element which will hide itself
  const webcamoverlay = document.getElementById("webcamoverlay");
  webcamoverlay.addEventListener('click', function () {
    webcamoverlay.style.display = "none";
  });

  // Close the current info window when the map is clicked
  map.addListener('click', function (mapsMouseEvent) {
    closeCurrentInfoWindow();
  });

  webcamData.forEach(cam => {
    // Add a marker for the webcam to the map
    const marker = new google.maps.Marker({
      map,
      position: { lat: cam.geometry.coordinates[1], lng: cam.geometry.coordinates[0] },
      title: cam.properties.description
    });

    // Create an Info Window that appears when the marker is clicked on
    const infowindow = new google.maps.InfoWindow({
      content:
        `<img id="${cam.properties.id}" src="${cam.properties.image_url}" alt="Refreshing"</img>` +
        `<h2>${cam.properties.description}</h2>` +
        `<p>Direction: ${cam.properties.direction}</p>` +
        `<a href=# onclick="javascript:displayGraph('${cam.properties.id}')">View past data</a>`
    });

    // Open the info window when the marker is clicked
    marker.addListener('click', function () {
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

function queryOpenCV(imageURL, imageID) {
  fetch(`/opencv/${imageURL.replace(/\//g, '$')}`) // Alter the URL so that all / are replaced with $
    .then((res) => res.json())
    .then((data) => {
      document.getElementById(imageID).src = data; // An example for how to update the image
    })
    .catch((error) => console.log(error))
}

// Query the server to get the results for a particular camera, then display them
function displayGraph(id) {
  const ctx = document.getElementById('mychart').getContext('2d');
  fetch(`/tensorflow/graph/${id}`)
    .then((res) => res.json())
    .then((data) => {
      const chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
          labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
          datasets: [{
            label: 'My First dataset',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: [0, 10, 5, 2, 20, 30, 45]
          }]
        },

        // Configuration options go here
        options: {}
      });
    })
    .catch((error) => console.log(error));

  // Show the window where the detailed information will be displayed
  webcamoverlay.style.display = "flex";
}