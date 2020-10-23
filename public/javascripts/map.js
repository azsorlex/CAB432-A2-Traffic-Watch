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
          fetch(`/getcountsandboxes/${cam.properties.id}`)
            .then((res) => res.json())
            .then((data) => {
              var contentString=   `<div id="infoDiv">`+
              `<h2>${cam.properties.description}</h2>` +
              `<p>Direction: ${cam.properties.direction}</p>` +
              `<p>Cars detected in the last hour: ${data[0]}</p>` +
              `<p>Cars detected throughout the day: ${data[1]}</p>` + 
              `<a href=# onclick="javascript:displayGraph('${cam.properties.id}')">View past data</a>`+
              `</div>`;
              
              const infoWindowNode=document.createElement('div');
              const canvasNode=document.createElement('div'); 
              const textnode =document.createElement('div');
              textnode.innerHTML=contentString;

              const canvas =document.createElement('canvas');
              canvas.id="canv";
              const ctx=canvas.getContext('2d');

              const img=new Image();
              
              img.onload=function(){
                canvas.width=this.width+10;
                canvas.height=this.height+10;
                
                ctx.drawImage(this, 10,10);
                const c=document.getElementById('canv');
                const context=c.getContext('2d');
                const rectangles=data[2];
                
                rectangles.forEach(rectangle =>{
                  context.beginPath();
                  context.rect(rectangle[0],rectangle[1],rectangle[2],rectangle[3]);
                  context.lineWidth = 3;
                  context.strokeStyle = 'red';
                  context.stroke();
                });
              }
            
              img.src=`${cam.properties.image_url}#${new Date().getTime()}`;
              canvasNode.appendChild(canvas);
              infoWindowNode.appendChild(canvasNode);
              infoWindowNode.appendChild(textnode);

              const infowindow = new google.maps.InfoWindow();
              infowindow.setContent(infoWindowNode);

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
    .then((result) => {

      console.log(result);


      // An idea for after everything here is working. Should definately see what the outcome with real data is once we deploy
      /*let labels = [];
      for (let i = 7; i < result.length + 7; i++) {
        labels.push(`${i}-${i + 1}`);
      }*/

      
      const chart = new Chart(ctx, {
        // The type of chart we want to create
        type: 'line',

        // The data for our dataset
        data: {
          labels: ['7', '8', '9', '10', '11', '12', '13','14','15','16','17','18','19','20','21','22'],
          datasets: [{
            label: 'Todays Hourly Counts',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: result
          }]
        },

        // Configuration options go here
        options: {
          scales: {
            yAxes: [{
              scaleLabel:{
                display: true,
                labelString: 'Cars per Hour'
              }
            }],
            xAxes: [{
              scaleLabel:{
                display: true,
                labelString: 'Time'
              }
            }]
          }
        }
      });
    })
    .catch((error) => console.log(error));

  // Show the window where the detailed information will be displayed
  chartoverlay.style.display = "flex";
}