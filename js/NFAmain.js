function init() {

  // *****************************************
  // Create map and set center and zoom level:
  var map = new L.map('map', {
    minZoom: 1,
    maxZoom: 7
  })
  map.setView([23, 8], 1);

  var selection;

  // *****************************************
  // Create basemap and labels tile layers and add them to map:
  var worldBasemapShapes = L.tileLayer('http://personal.psu.edu/vdk7/tiles/WorldBasemapShapes/{z}/{x}/{y}.png', {
    noWrap: true // avoid the tiles repeating on the left and right sides of the map.
  }).addTo(map);

  var worldBasemapLabels = L.tileLayer('http://personal.psu.edu/vdk7/tiles/WorldBasemapLabels3/{z}/{x}/{y}.png', {
    noWrap: true
  }).addTo(map);

  //Attach the label layer to the top pane to make it display *above* the thematic layers
  var topPane = map.createPane('leaflet-top-pane', map.getPanes().mapPane);
  topPane.appendChild(worldBasemapLabels.getContainer());

  // *****************************************
  // Create 3 thematic layers out of the NFACountries GeoJSON data:

  var ecolReserveLayer = L.Proj.geoJson(NFACountriesData, {
    style: function(feature) {
      return countryStyle(feature.properties.EcolReserve, "ecolReserve")
    },
    onEachFeature: countryOnEachFeature
  }).addTo(map);

  var biocapacityLayer = L.Proj.geoJson(NFACountriesData, {
    style: function(feature) {
      return countryStyle(feature.properties.TotalBiocapacity, "biocapacity")
    },
    onEachFeature: countryOnEachFeature
  }).addTo(map);

  var ecolFootprintLayer = L.Proj.geoJson(NFACountriesData, {
    style: function(feature) {
      return countryStyle(feature.properties.TotalFootprint_Consump, "ecolFootprint")
    },
    onEachFeature: countryOnEachFeature
  }).addTo(map);

  // *****************************************
  // Define the 3 legends corresponding to the 3 thematic layers:
  var biocapacityLegend = L.control({
    position: 'bottomright'
  });

  var ecolFootprintLegend = L.control({
    position: 'bottomright'
  });

  var ecolReserveLegend = L.control({
    position: 'bottomright'
  });

  // At first build and show only the legend for the default thematic layer:
  buildLegend(ecolFootprintLegend, "ecolFootprint");

  // *****************************************
  // Create layer groups for the Layer Control Box
  var baseMaps = {
    // Putting the thematic layers here is a small trick to list them with radio butttons!
    "Ecological Reserve or Deficit?": ecolReserveLayer,
    "Biocapacity Per Person": biocapacityLayer,
    "Ecological Footprint Per Person": ecolFootprintLayer
  };

  var overlayMaps = {
    "Labels": worldBasemapLabels
  };

  // Add a Layer Control box, in the non-collapsed format:
  L.control.layers(baseMaps, overlayMaps, {
    collapsed: false,
    position: 'bottomleft'
  }).addTo(map);

  // *****************************************
  // Define behavior when toggling thematic layers on and off in the layers control box

  // If the label layer gets turned off and back on, it needs to be
  // re-attached to the top pane, to make it display *above* the thematic layers:
  map.on('overlayadd', function(e) {
    if (e.name === "Labels") {
      topPane.appendChild(e.layer.getContainer());
    }
  });

  // When the thematic layers are toggled, we need to toggle the legends accordingly
  map.on('baselayerchange', function(e) { // Reminder: we are treating the thematic layers as basemaps
    // Remove any previously displayed legend:
    this.removeControl(biocapacityLegend);
    this.removeControl(ecolFootprintLegend);
    this.removeControl(ecolReserveLegend);

    // Add the legend for the current layer:
    if (e.name === "Biocapacity Per Person") {
      buildLegend(biocapacityLegend, "biocapacity");
    } else if (e.name === "Ecological Footprint Per Person") {
      buildLegend(ecolFootprintLegend, "ecolFootprint");
    } else if (e.name === "Ecological Reserve or Deficit?") {
      buildLegend(ecolReserveLegend, "ecolReserve");
    }

  });

  // Add attribution information:
  map.attributionControl.addAttribution('Map data from Natural Earth & Global Footprint Network');

  var blurbText = '<div id="blurbInner">' +
    '<p"><b>Click the countries</b> on the map to learn about their ' +
    'Biocapacity and Ecological Footprint.</p >' +
    '<div id="definitionBox">' +
    '<p style="font-size: 12px;padding-top:20px;"><b>Biocapacity:</b> The capacity of an ecosystem to produce biological materials used by people (like food and lumber) and to absorb waste materials</p>' +
    '<p style="font-size: 12px;"><b>Ecological Footprint:</b> The amount of biological resources a population needs to cover its consumption and absorb its waste.</p>' +
    '<p style="font-size: 12px;"><b>Comparing a country’s biocapacity and footprint</b> is useful to understand whether that country is environmentally sustainable or whether "it lives beyond its means".</p>' +
    '</div>' +
    '<p style="font-size: 12px;padding-top:20px;">All the data presented here comes from the ' +
    '<a href="https://www.footprintnetwork.org/" target="_blank">Global Footprint Network</a>. ' +
    'Learn more about <a href="https://www.footprintnetwork.org/our-work/ecological-footprint/" target="_blank">their work</a>.</p>' +
    '</div>'
  //    https://www.footprintnetwork.org/licenses/public-data-package-free-2018/

  // Set the content of the right window pane to the initial blurb:
  document.getElementById('blurb').innerHTML = blurbText;


  // *****************************************
  // *****************************************
  // FUNCTIONS

  // *****************************************
  // Define the styles for each layer when the polygons are unselected:
  function countryStyle(currentValue, layerType) {
    // Get the right tone of the color ramps based on the numeric value and the layer type:
    return {
      fillColor: getColorCountry(currentValue, layerType),
      weight: 1,
      fillOpacity: 1,
      color: '#eeeeee',
      opacity: 1
    }
  }

  // Define the style for selected polygons:
  function selectedStyle(feature) {
    return {
      color: '#636363',
      weight: 3
    };
  }

  // Define the style to unselect polygons:
  function unselectedStyle(feature) {
    return {
      color: '#eeeeee',
      weight: 1,
    };
  }

  // *****************************************
  // Define the color ramps for the thematic layers' symbolization
  function getColorCountry(d, layerType) {
    if (layerType == "biocapacity") {
      return d <= 0.7 ? '#CFFCD4' :
        d <= 1.2 ? '#B8F1BE' :
        d <= 1.8 ? '#A1E6A9' :
        d <= 2.5 ? '#8ADB93' :
        d <= 3.5 ? '#73D07E' :
        d <= 5.1 ? '#5CC568' :
        d <= 8.9 ? '#45BA53' :
        d <= 13.3 ? '#2EAF3D' :
        d <= 25.7 ? '#17A428' :
        '#019913';
    } else if (layerType == "ecolFootprint") {
      return d <= 1.2 ? '#F9E0E0' :
        d <= 1.9 ? '#F2C7C7' :
        d <= 2.5 ? '#ECAEAE' :
        d <= 3.3 ? '#E69696' :
        d <= 4.1 ? '#E07D7D' :
        d <= 5.2 ? '#D96565' :
        d <= 6.3 ? '#D34C4C' :
        d <= 7.6 ? '#CD3434' :
        d <= 9.8 ? '#C71B1B' :
        '#C10303';
    } else if (layerType == "ecolReserve") {
      return d <= -9.2 ? '#C10303' :
        d <= -4.4 ? '#CC3325' :
        d <= -2.6 ? '#D76448' :
        d <= -1.5 ? '#E2956B' :
        d <= -0.5 ? '#EDC68E' :
        d <= 0.7 ? '#F9F7B1' :
        d <= 3.2 ? '#BBDF89' :
        d <= 9.3 ? '#7DC862' :
        d <= 23 ? '#3FB03A' :
        '#019913';

    }
  }

  // *****************************************
  // Generate the legend for a thematic layer
  function buildLegend(legend, layerType) {

    legend.onAdd = function(map) {
      var legendText = "";
      var highText = "";
      var lowText = ""
      var currentGrades = "";

      // Define the steps (grades) for the color ramp, and the captions
      // based on the layer type:
      if (layerType == "ecolFootprint") {
        currentGrades = [1.2, 1.9, 2.5, 3.3, 4.1, 5.2, 6.3, 7.6, 9.8, 9.9];
        highText = "High";
        lowText = "Low";
      } else if (layerType == "biocapacity") {
        currentGrades = [0.7, 1.2, 1.8, 2.5, 3.5, 5.1, 8.9, 13.3, 25.7, 25.8];
        highText = "High";
        lowText = "Low";
      } else if (layerType == "ecolReserve") {
        currentGrades = [-9.2, -4.4, -2.6, -1.5, -0.5, 0.7, 3.2, 9.3, 23, 23.1];
        highText = "Reserve";
        lowText = "Deficit";
      }

      var div = L.DomUtil.create('div', 'info legend'),
        grades = currentGrades,
        labels = [];

      // loop through the steps
      for (var i = grades.length - 1; i >= 0; i--) {

        //  generate the color square for each step using the color ramps defined earlier:
        var squareColor = getColorCountry(grades[i], layerType);

        //and generate the caption if appropriate:
        if (i == grades.length - 1) {
          legendText = highText;
        } else if (i == 0) {
          legendText = lowText;
        } else {
          legendText = "";
        }

        // Put the html together using divs:
        div.innerHTML +=
          '<div class="legendRow">' +
          '<div class="legendSquare" style = "background:' + squareColor +
          '" ></div>' +
          '<div class="legendText">' + legendText + '</div>' +
          '</div>';
      }

      return div;
    };

    // Add the legend to the map:
    legend.addTo(map);
  }

  // *****************************************
  // Handle click events on any thematic layer features:
  function countryOnEachFeature(feature, layer) {
    layer.on({
      click: function(e) {
        if (selection) {
          selection.setStyle(unselectedStyle())
        }
        e.target.setStyle(selectedStyle());

        // To make sure that the selected polygon boundary is
        // completely on top of unselected ones:
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
          e.target.bringToFront();
        }
        selection = e.target;

        // Insert a popup window:
        buildPopup(e);

        //Build content for right window pane:
        buildRightPane(e);

        // stop click event from being propagated further:
        L.DomEvent.stopPropagation(e);
      }
    });
  }

  // handle clicks on the map that didn't hit a feature
  map.addEventListener('click', function(e) {
    // Remove the selected style from the previously selected polygon:
    if (selection) {
      selection.setStyle(unselectedStyle())
    }
    selection = null;

    // Reset the content of the right window pane to the initial blurb:
    document.getElementById('blurb').innerHTML = blurbText;

    // Remove the number of Earths content:
    document.getElementById('numberOfEarths').innerHTML = "";

    // Remove the chart:
    removeChart();
  })

  // *****************************************
  // Generate the popup window and its content for the selected country:
  function buildPopup(e) {
    // Get all the property values we need for the selected country:
    var countryName = e.target.feature.properties.Name;
    var totalBiocapacity = e.target.feature.properties.TotalBiocapacity;
    var totalFootprint = e.target.feature.properties.TotalFootprint_Consump;
    var GDPperCapita = e.target.feature.properties.GDPperCapita;
    var EcolReserve = e.target.feature.properties.EcolReserve;

    // Add commas at the thousands:
    GDPperCapita = GDPperCapita.toLocaleString()

    // Should we talk about ecological deficit or reserve? (i.e., negative or positive?):
    var reserveOrDeficit;
    if (EcolReserve < 0) {
      reserveOrDeficit = "Deficit";
    } else {
      reserveOrDeficit = "Reserve";
    }

    //Put the popup's HTML together:
    var countryPopup = e.target.bindPopup(
      '<table><tr><td colspan="3" style="font-size: 125%;padding-bottom: 8px; text-align: center"><b>' + countryName + '</b></td></tr>' +
      '<tr><td style="text-align: right;"><b>Biocapacity:</b></td><td>' + totalBiocapacity + ' gha</td></tr>' +
      '<tr><td style="text-align: right"><b>Ecol. Footprint:</b></td><td>' + totalFootprint + ' gha</td></tr>' +
      '<tr><td  style="text-align: right"><b>Ecol. ' + reserveOrDeficit + ':</b></td><td>' + totalBiocapacity +
      ' - ' + totalFootprint + ' = ' + EcolReserve + ' gha</td></tr>' +
      '<tr><td style="text-align: right"><b>GDP:</b></b></td><td>$' + GDPperCapita + '</td></tr>' +
      '<tr style="font-size: 80%"><td colspan="2" style="padding-top: 8px;text-align: center">(In 2014, per person)</td></tr></table>'
    )

    // Open the popup:
    countryPopup.openPopup();
  }


  // *****************************************
  // Generate the right window pane and its content for the selected country:
  function buildRightPane(e) {

    // Get all the property values we need for the selected country:
    var countryName = e.target.feature.properties.Name;
    var countryNameLong = e.target.feature.properties.NameLong;
    var totalFootprint = e.target.feature.properties.TotalFootprint_Consump;
    var numOfEarths = e.target.feature.properties.NumOfEarths;
    var EcolReserve = e.target.feature.properties.EcolReserve;

    //Create the HTML for the title of the right window pane:
    var titleHtml = '<p class="countryTitle">' + countryName + '</p>';
    document.getElementById('blurb').innerHTML = titleHtml

    //Create the content for the "number of Earths" section:
    buildNumOfEarth(numOfEarths, countryName, totalFootprint);

    // Build the chart (this is in a separate javascript file, "NfaLineChart.js"):
    buildChart(countryNameLong, countryName);
    //Note: I use countryNameLong as an ID to match the csv data undelying the chart,
    // and I use countryName as a pretty name.
  }

  // *****************************************
  //Create the content for the "number of Earths" element:
  function buildNumOfEarth(numOfEarths, countryName, totalFootprint) {

    // Should the word "Earth" be singular or plural?
    var earth = "";
    if (numOfEarths <= 1) {
      earth = "Earth";
      //    earthColor = "#17A428";
    } else {
      earth = "Earths"
      //    earthColor = "#D34C4C";
    }

    // First the text:
    var earthHtmlChunk1 =
      '<p style="font-size: 80%;"><br/>If everybody on Earth had the same Ecological Footprint<br/> as ' + countryName + ' in 2014 (' + totalFootprint +
      ' gha), we would need: </p>' +
      '<p style="font-size: 125%;"><b>' + numOfEarths + ' ' + earth + '</p>';

    // Then the "full Earth" icons -- There should be as many as the numOfEarths variable indicates.
    // For instance "5" if numOfEarths is 5.325:
    var earthHtmlChunk2 = '<img src="img\\earthIcon.PNG" width="60px">'.repeat(numOfEarths);

    // Next we need to identify the "fractional Earth" icon we should display.
    // For that we need to compute the 1-digit decimal value of the numOfEarths
    // variable. For instance "2" for 5.234:
    var earthInteger = Math.floor(numOfEarths);
    var earthDecimals = numOfEarths - earthInteger;
    var earth1Decimal = (Math.round(earthDecimals * 10)) / 10;
    var earthDecimalChar = earth1Decimal.toString()
      .replace(".", "");

    // Put together the HTML chunk for the fractional Earth icon:
    var earthHtmlChunk3 = "";
    if (earthDecimalChar != "0") {
      var earthHtmlChunk3 = ' <img src = "img\\earthIcon' + earthDecimalChar + '.PNG" width = "60px">';
    }

    // Put together the entire Number of Earth HTML chunk:
    document.getElementById('numberOfEarths').innerHTML = '<div id="numberOfEarthsInner">' +
      earthHtmlChunk1 + earthHtmlChunk2 + earthHtmlChunk3 + '</div>';
  }
}