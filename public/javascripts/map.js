let currentInfoWindow;

function initMap() {

  // Initialise the map
  const map = new google.maps.Map(
    document.getElementById('map'), { zoom: 5, center: { lat: -22, lng: 145 } });

  // Add a click event to the graph housing element which will hide itself
  const chartoverlay = document.getElementById("chartoverlay");
  chartoverlay.addEventListener('click', function () {
    chartoverlay.style.display = "none";
  });

  // Close the current info window when the map is clicked
  map.addListener('click', function (mapsMouseEvent) {
    closeCurrentInfoWindow();
  });

  // Get the data that was passed through from the server
  fetch('/getwebcamdata')
    .then((res) => res.json())
    .then((webcamData) => {
      webcamData.forEach(cam => {
        // Add a marker for the webcam to the map
        const marker = new google.maps.Marker({
          map,
          position: { lat: cam.geometry.coordinates[1], lng: cam.geometry.coordinates[0] },
          title: cam.properties.description
        });

        // Open the info window when the marker is clicked
        marker.addListener('click', function () {
          fetch(`/getcounts/${cam.properties.id}`)
            .then((res) => res.json())
            .then((data) => {
              const infowindow = new google.maps.InfoWindow({ // Create an Info Window
                content:
                  `<img src="${cam.properties.image_url}#${new Date().getTime()}" alt="Loading"</img>` +
                  `<h2>${cam.properties.description}</h2>` +
                  `<p>Direction: ${cam.properties.direction}</p>` +
                  `<p>Cars detected in the last hour: ${data[0]}</p>` +
                  `<p>Cars detected throughout the day: ${data[1]}</p>` +
                  `<a href=# onclick="javascript:displayGraph('${cam.properties.id}')">View past data</a>`
              });
              currentInfoWindow = infowindow;
              infowindow.open(map, marker);
            })
            .catch((error) => console.log(error));

          closeCurrentInfoWindow(); // Close the previous window if there is one
        });
      });
    })
    .catch((error) => console.log(error));
}

function closeCurrentInfoWindow() {
  try {
    currentInfoWindow.close();
  } catch (e) { }
}

// Query the server to get the results for a particular camera, then display them
function displayGraph(id) {
  const ctx = document.getElementById('mychart').getContext('2d');
  fetch(`/getgraph/${id}`)
    .then((res) => res.json())
    .then((data) => {

      console.log(data);

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
  chartoverlay.style.display = "flex";
}