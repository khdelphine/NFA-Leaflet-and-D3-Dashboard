// Note: This code is partially based on this block: https://bl.ocks.org/larsenmtl/e3b8b7c2ca4787f77d78f58d41c3da91

// **********************************
// **********************************
// Remove the chart when it is unwanted (e.g., when resetting to generic homepage view).
function removeChart() {
  d3.select("#chart").select("svg").remove();
}

// **********************************
// **********************************
// Build the chart for the current country and display it:
function buildChart(currentCountryLong, currentCountry) {
  //Note: I use countryNameLong as an ID to match the csv data undelying the chart,
  // and I use countryName as a pretty name.

  // **********************************
  // Load the data:
  var promises = [d3.csv("data/NFACountries-Historical.csv")];
  Promise.all(promises).then(function(data) {
    ready(data[0]);
  }).catch(function(error) {
    console.log(error);
  });

  // When the data is ready, start putting together the chart:
  function ready(data) {

    // First, select the subset of data rows corresponding to the current country:
    data = data.filter(function(d) {
      return d.country_name == currentCountryLong;
    });

    // Change the type of some fields from string to number:
    data.forEach(function(d) {
      d.year = +d.year;
      d.Biocapacity = +d.Biocapacity;
      d.EcolFootprint = +d.EcolFootprint;
    });


    // **********************************
    // Do some preliminary setup

    // In this line chart, I will trace data lines for 2 indicators,
    // Biocapacity and EcolFootprint:
    var indicatorsList = ["Biocapacity", "EcolFootprint"];

    // Define the colors for the two indicators' data lines (green and red):
    var color = d3.scaleOrdinal()
      .domain(indicatorsList)
      .range(["#4cc313", "#d22f21"]);

    // Define pretty names for the two indicators:
    var prettyName = d3.scaleOrdinal()
      .domain(indicatorsList)
      .range(["Biocapacity", "Ecol. Footprint"]);

    // Define the chart's line shape:
    var line = d3.line()
      .curve(d3.curveBasis) // apply smoothing to the line
      .x(function(d) {
        return x(d.year);
      })
      .y(function(d) {
        return y(d.gha);
      });

    // Prepare the indicators data so that it is ready to draw (in [year, gha] pairs):
    var indicatorsData = indicatorsList.map(function(indicName) {
      return {
        indicName: indicName,
        values: data.map(function(d) {
          return {
            year: d.year,
            gha: +d[indicName]
          };
        })
      };
    });

    // **********************************
    // Create the main svg to draw the chart on

    // First, remove the previous chart:
    removeChart();

    //Define the size and margins of the chart:
    var margin = {
        top: 30,
        right: 100,
        bottom: 50,
        left: 50
      },
      width = 450 - margin.left - margin.right,
      height = 290 - margin.top - margin.bottom;

    // Create a new svg element for the new chart:
    d3.select("#chart").select("svg").remove();
    svg = d3.select("#chart").append('svg')
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // **********************************
    // Put together the  x and y axes

    // Define the D3 scale for the x axis (showing the years)
    var x = d3.scaleLinear()
      .domain(d3.extent(data, function(d) {
        return d.year;
      }))
      .range([0, width]);

    // Find out the maximum gha value for either indicator:
    var maxGha = d3.max(indicatorsData, function(c) {
      return d3.max(c.values, function(v) {
        return v.gha;
      });
    });

    // Define the D3 scale for the y axis. it will go from 0 to the max gha value:
    var y = d3.scaleLinear()
      .range([height, 0])
      .domain([
        0,
        maxGha
      ]);

    // Format the tick marks on the axes:
    var xAxis = d3.axisBottom(x)
      .tickFormat(d3.format(".0f"));
    var yAxis = d3.axisLeft(y);
    if (maxGha >= 7) {
      yAxis.tickFormat(d3.format(".0f")); // Larger y ranges will show no decimals
    } else {
      yAxis.tickFormat(d3.format(".1f")); // Smaller y ranges will show no decimals
    }

    // Add the x axis, position it, and style it:
    svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis)
      .append("text")
      .attr("transform", "translate(" + (width / 2) + ",30)")
      .attr("dy", ".71em")
      .attr("class", "axisCaption")
      .text("Historical data for " + currentCountry);

    // Add the y axis, position it, and style it:
    svg.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "translate(" + "-46," + (height / 2) + ")rotate(-90)")
      .attr("dy", ".71em")
      .attr("class", "axisCaption")
      .text("gha");

    // **********************************
    // Draw the two indicators' data lines

    // Create the two line objects:
    var indicatorsLines = svg.selectAll(".indicatorLine")
      .data(indicatorsData)
      .enter().append("g")
      .attr("class", "indicatorLine");

    // Actually draw the lines and style them:
    indicatorsLines.append("path")
      .attr("class", "line")
      .attr("d", function(d) {
        return line(d.values);
      })
      .style("stroke", function(d) {
        return color(d.indicName);
      });

    // Add the indicators' names at the end of the lines:
    indicatorsLines.append("text")
      .datum(function(d) {
        return {
          indicName: d.indicName,
          value: d.values[d.values.length - 1]
        };
      })
      .attr("transform", function(d) {
        return "translate(" + x(d.value.year) + "," + y(d.value.gha) + ")";
      })
      .attr("x", 6)
      .attr("dy", ".35em")
      .attr("class", "line-text")
      .text(function(d) {
        return prettyName(d.indicName);
      })


    // **********************************
    // Define the mouseover behavior

    // Create a group to display the dotted vertical line that follows the mouse
    // and display extra information:
    var gMouse = svg.append("g")
      .attr("class", "mouse-over-effects");

    // Add object for the vertical line itself:
    gMouse.append("path")
      .attr("class", "mouse-line")

    // Create a group to display the year corresponding to the mouseover position
    // at the very top of the chart:
    svg.append("g")
      .attr("class", "year-text")
      .attr("transform", "translate(0,-10)");

    // Note: At the intersection between the dotted line and each indicator's line,
    // we will display a circle and the current gha value:

    // Get the two indicator line objects:
    var lines = document.getElementsByClassName('line');

    // Create objects to hold the circles and gha value:
    var mousePerLine = gMouse.selectAll('.mouse-per-line')
      .data(indicatorsData)
      .enter()
      .append("g")
      .attr("class", "mouse-per-line");

    // Add the circles:
    mousePerLine.append("circle")
      .attr("class", "mouse-circle")
      .attr("r", 7)
      .style("stroke", function(d) {
        return color(d.indicName);
      })

    // Position the gha text to the right of the circles:
    mousePerLine.append("text")
      .attr("transform", "translate(10,-8)")
      .attr("class", "gha-text");

    // Add a rectangle covering the entire chart to catch mouse movements
    // (we can't catch mouse events on a g element)
    gMouse.append('svg:rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none') // the rectangle is transparent
      .attr('pointer-events', 'all')

      // On mouse out, hide dotted vertical line, circles, gha value, and year:
      .on('mouseout', function() {
        d3.selectAll(".mouse-line, .mouse-per-line circle, .gha-text, .year-text")
          .style("opacity", "0");
      })
      // On mouse in, show dotted vertical line, circles, gha value, and year:
      .on('mouseover', function() {
        d3.selectAll(".mouse-line, .mouse-per-line circle, .gha-text, .year-text")
          .style("opacity", "1");
      })
      // As the mouse moves over the canvas, compute the coordinates of the dotted line:
      .on('mousemove', function() {
        var mouse = d3.mouse(this);
        d3.select(".mouse-line")
          .attr("d", function() {
            var d = "M" + mouse[0] + "," + height;
            d += " " + mouse[0] + "," + 0;
            return d;
          });

        // Based on the mouse position, find the x and y values for the
        // intersection with the indicators lines:
        d3.selectAll(".mouse-per-line")
          .attr("transform", function(d, i) {
            var xyear = x.invert(mouse[0]),
              bisect = d3.bisector(function(d) {
                return d.year;
              }).right;
            idx = bisect(d.values, xyear);
            var beginning = 0,
              end = lines[i].getTotalLength(),
              target = null;
            while (true) {
              target = Math.floor((beginning + end) / 2);
              pos = lines[i].getPointAtLength(target);
              if ((target === end || target === beginning) && pos.x !== mouse[0]) {
                break;
              }
              if (pos.x > mouse[0]) end = target;
              else if (pos.x < mouse[0]) beginning = target;
              else break; //position found
            }

            // Display the gha value:
            d3.select(this).select('.gha-text')
              .text(y.invert(pos.y).toFixed(2));

            // Remove the previous year at the top of the chart:
            d3.selectAll(".year-text").select("text")
              .remove();

            // Get the year at the mouse's position, and display it at the top of the chart:
            var yearTranslate = "translate(" + mouse[0] + ",0)";
            d3.selectAll(".year-text")
              .append("text")
              .text(x.invert(pos.x).toFixed(0))
              .attr("transform", yearTranslate);

            return "translate(" + mouse[0] + "," + pos.y + ")";

          });
      });
  }
}