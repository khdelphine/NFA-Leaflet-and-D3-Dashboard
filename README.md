# NFA-Leaflet-and-D3-Dashboard

Visualizing Ecological Footprint Data 
* This is an interactive dashboard visualizing the ecological footprint and biocapacity data per country.
* The main data comes from the nonprofit Global Footprint Network.  
* I prepared the data layers in QGIS and delivered them in GeoJSON. 
I built the basemap with QGIS and Tilemill based on the open-access Natural Earth dataset, and delivered it as multiscale tiles, including a transparent layer for the labels. 
* I built the web page with Bootstrap and embedded a Leaflet map in it.  When users click on a country, the right panel displays more information about that country, including a “number of Earths” panel written in JavaScript and an interactive chart written in D3. 
