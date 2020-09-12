var view;
var active_projects;
var everyLayer;
var query;
var highlight;
var identifyTask;
var params;
var ids;
var infoDiv;
var project_count;
var zone_name;
var side_nav_loader;

var uc_gis_people;
var people_list;

require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/WebMap",
    "esri/layers/FeatureLayer",
	"esri/tasks/IdentifyTask",
    "esri/tasks/support/IdentifyParameters",
    "esri/widgets/Search",
    "esri/widgets/Locate",
    "esri/widgets/Home",
    "esri/widgets/Popup",
    "esri/layers/support/LabelClass",
    "esri/core/promiseUtils",
    "esri/core/watchUtils",
	"esri/core/urlUtils",
	"esri/tasks/support/Query",
	"esri/core/Collection",
    "dojo/domReady!"], function (
	esriConfig,
	Map,
	MapView,
	WebMap,
	FeatureLayer,
	IdentifyTask,
	IdentifyParameters,
	Search,
	Locate,
	Home,
	Popup,
	LabelClass,
	promiseUtils,
	watchUtils,
	urlUtils,
	Query,
	Collection
) {
	
	infoDiv = document.getElementById("info")
	
	//LABEL CLASSES
	var active_projects_labels = {
        symbol: {
            type: "text",
            color: "black",
            haloColor: [255,255,255, 1.0],
            haloSize: 1.5,
            font: {
                family: "Arial Unicode MS",
                size: 10,
                style:"normal",
                weight: "bold"
            }
        },
        labelPlacement: "always-horizontal",
        labelExpressionInfo: {
            expression: "upper($feature.NAME)"
        }
    };
	
	var buildingsLabelClass = {
        symbol: {
            type: "text",
            color: "white",
            haloColor: [0, 0, 0, 1.0],
            haloSize: 0.75,
            font: {
                family: "Arial Unicode MS",
                size: 9,
                style:"normal",
                weight: "bold"
            }
        },
        labelPlacement: "always-horizontal",
        labelExpressionInfo: {
            expression: "$feature.LABELNAME"
        }
    };
	
	//LAYERS
	uc_gis_people = new FeatureLayer({
		portalItem: {
			id: "a712b4f4423b465fa4a474954d815f9e"
		},
		visible: true,
		popupEnabled:true
	})
	active_projects = new FeatureLayer({
		portalItem: {
			id: "2ed5680d247043fc983f8197eb0b0893"
		},
		visible: true,
		labelingInfo:[active_projects_labels],
		popupEnabled:false
	})

	everyLayer = [uc_gis_people]

	//BASEMAPS
	uc_gis_map = new WebMap({
        portalItem: {
		  	id:"ff129bea8c55437c8f08a4fb7b45047c"
        }
    });
	
	carto = new WebMap({
        portalItem: {
		  	id:"09112c9e929a4f4588007f3791aac99e"
        }
    });
	carto.when(function(carto) {
        carto.addMany(everyLayer)
    })
	//795020303530467f8d096fca5f4d022c
	
  	satellite = new WebMap({
        portalItem: {
            id:"515d7e26cfb64c42824a97a46ce439ca"
        }
    });
	satellite.when(function(satellite) {
        satellite.addMany(everyLayer)
    })
	
	hybrid = new WebMap({
        portalItem: {
			id:"62c4794e40e14c94a4bf3a7258f40878"
        }
    });
	hybrid.when(function(hybrid) {
        hybrid.addMany(everyLayer)
    })

	//MAP VIEW
	view = new MapView({
		container: "viewDiv",
		map: uc_gis_map,
		layerViews: everyLayer,
		highlightOptions:{
			color:"orange",
			haloOpacity:0,
			fillOpacity:0.25,
			
		},
		popup: {
			highlightEnabled: true,
			dockEnabled: true,
			dockOptions: {
				buttonEnabled: false,
				position: "bottom-center"
			}
		}
	})
	
	//WIDGETS	
	view.ui.remove("attribution");
	
	homeBtn = new Home({
        view: view
    })
    view.ui.add(homeBtn, "top-left")
    
    var locateBtn = new Locate({
        view: view
      });
    view.ui.add(locateBtn, {position: "top-left"});
    
	view.ui.add("map-options-footer", "top-right")
	
	searchWidget = new Search({
        view: view,
        maxSuggestions: 35,
		allPlaceholder: "Begin typing and select an option from the suggestions...",
        sources: [
            {featureLayer: {
                url: "https://services3.arcgis.com/21H3muniXm83m5hZ/arcgis/rest/services/buildings_app/FeatureServer/0"},
            searchFields: ["BUILDINGNAME", "ABBREVSHORT", "ALIAS", "LABELNAME", "DEPARTMENTS"],
            displayField: "BUILDINGNAME",
            exactMatch: false,
            outFields: ["BUILDINGNAME"],
            name: "Buildings",
            placeholder: "enter a building name or departments",
            }        
        ]
    });
    searchWidget.includeDefaultSources = false //remove ArcGIS World Geocoding Service
	searchWidget.on("select-result", function(event){
	  searchWidget.clear();
	  buildings_lyr.labelsVisible = true
	  view.zoom = 19
	  var viewD = document.getElementById('viewDiv');
	  var mobile_menu = document.getElementById('mobile-menu');
	  var menu_icon = document.getElementById('menu-icon');
	  var close_menu_icon = document.getElementById('close-menu-icon');
	  if (viewD.style.display == 'none'){
		viewD.style.display = 'flex'
		mobile_menu.style.display = 'none'
		menu_icon.style.display = 'flex'
		close_menu_icon.style.display = 'none'
	  }
	});
    view.ui.add(searchWidget, {position: "top-right"});
	
	
	
	
	var info = document.getElementById("info")
	
	const people_query = {
		outFields: ["*"],
		objectIds: ids,
	}
	
	function getPeople(){
		uc_gis_people.queryFeatures().then(function(results){
			var people_list = results.features
		});
		return people_list
	}
	
	function makeCard(obj){
		d = document.createElement("div")
		
		var name = obj["name"]
		var campus = obj["campus"]
		var role = obj["person_type"]
		var bio = obj["bio"]
		var email = obj["email"]
		
		d.textContent = name + "<br>" + campus + "<br>" + role + "<br>" + email + "<br>" + bio
		
		return d
	}
	
	uc_gis_people.queryFeatures().then(function(results){
		var people_list = results.features
		people_list.forEach(function(obj){
			alert(person.attributes["name"])
			var div = makeCard(obj)
			info.append(div)
		})
	});
	
	
	
	
	function makeDiv(obj) {
		d = document.createElement("div")
		var br = document.createElement("br")
		for (var prop in obj) {
			// skip loop if the property is from prototype
			if (!obj.hasOwnProperty(prop)) continue;

			// your code
			row = document.createElement("span")
			row.className = "full-width"
			row.textContent = prop + " : " + obj[prop]
			d.appendChild(row)
			d.appendChild(br)
			//console.log(prop + " = " + obj[prop]);
		}
	
		d.className = "projects"
		//d.textContent = JSON.stringify(obj)
		return d
	}
	
	function buildInfoDiv(item) {
		var side_nav_loader = document.getElementById("loading")
		side_nav_loader.classList.remove("is-active")
		infoDiv = document.getElementById("info")
		infoDiv.append(item)
	}
	
	function makeCards(obj) {
		d = document.createElement("div")
		
		var name = obj["name"]
		var campus = obj["campus"]
		var role = obj["person_type"]
		var bio = obj["bio"]
		var email = obj["email"]
		
		d.textContent = name + "<br>" + campus + "<br>" + role + "<br>" + email + "<br>" + bio
		
		var icon = document.createElement("i")
		var mark = document.createElement("mark")
		var budget = document.createElement("p")
		var phase = document.createElement("span")
		var date = document.createElement("p")
		
		var DATE = new Date(project_completion_date)
		var date_string = "Completion Date: " + String(DATE.getMonth()+1).padStart(2, '0') + "/" + DATE.getFullYear()
		date.textContent = date_string
		
		if (project_type == 'CHES Maintenance Project'){
			icon.className = "icon-ui-home"
			mark.className = "label label-green"
			mark.style.maxWidth = "150px"
		} else if (project_type == 'Major Capital Project') {
			icon.className = "icon-ui-organization"
			mark.className = "label label-blue"
			mark.style.maxWidth = "125px"
		} else if (project_type == 'Minor Capital Project') {
			icon.className = "icon-ui-settings"
			mark.className = "label label-blue"
			mark.style.maxWidth = "125px"
		} else if (project_type == 'Small Project') {
			icon.className = "icon-ui-settings2"
			mark.className = "label label-yellow"
			mark.style.maxWidth = "100px"
		} else if (project_type == 'Capital Planning Study') {
			icon.className = "icon-ui-experimental"
			mark.className = "label label-red"
			mark.style.maxWidth = "150px"
		}
				
		mark.textContent = project_type
		
		budget.style.margin = "0"
		budget.style.marginLeft = "auto"
		budget.textContent = tar_budget
		
		var labels = document.createElement("div")
		labels.className = "labels"
		labels.appendChild(icon)
		labels.appendChild(mark)
		labels.appendChild(phase)
		labels.appendChild(budget)
		
		var pm = document.createElement("p")
		pm.textContent = "Project Manager | " + project_manager
		
		var cpsm = document.createElement("p")
		cpsm.textContent = "CPSM Planner | " + project_planner
		
		var po = document.createElement("p")
		po.textContent = "Principal Officer | " + principal_officer
		
		var val = document.createElement("h5")
		val.textContent = project_name
		
		phase.className = "circ"
		if (project_phase.length > 1){
			phase.style.fontSize = "0.7em"
			phase.style.width = "2.4em"
			phase.style.lineHeight = "2.4em"
			phase.style.borderRadius = "1.6em"
			phase.style["-moz-border-radius"] = "1.6em"
			phase.style["-webkit-border-radius"] = "1.6em"
		}
		phase.textContent = project_phase
		
		//d.append(labels)
		//d.append(val)
		//d.append(pm)
		//d.append(cpsm)
		//d.append(po)
		//d.append(date)
		//d.className = "projects"
		
		return d
		
	}

	function changeCursor(response) {
		if (response.results.length > 0) {
			document.getElementById("viewDiv").style.cursor = "pointer";
		} else {
			document.getElementById("viewDiv").style.cursor = "default";
		}
	}

	function addHighlight(response) {
		if (highlight){
			highlight.remove()
		}
		var graphic = response.results.filter(function (result) {
			return result.graphic.layer === active_projects;
		})[0].graphic;
		
		
		view.whenLayerView(graphic.layer).then(function (layerView) {
			highlight = layerView.highlight(graphic);
		});
	}
		
	view.on("click", function(event){
	  
	  var side_nav_loader = document.getElementById("loading")
	  side_nav_loader.classList.add("is-active")
		
	  var query = new Query();
	  query.geometry = event.mapPoint;  // obtained from a view click event
	  query.spatialRelationship = "intersects";

	  view.whenLayerView(active_projects).then(function(layerView){
		  watchUtils.whenNotOnce(layerView, "updating").then(function(){
			return layerView.queryObjectIds(query);
		  }).then(function(ids){
			  const relatedQuery = {
				  outFields: ["*"],
				  objectIds: ids,
				  relationshipId:0
			  }
			  const zoneQuery = {
				  outFields: ["*"],
				  objectIds: ids,
			  }
			  
			  active_projects.queryFeatures(zoneQuery).then(function(result){
			  	  zone_name = result.features[0].attributes["NAME"]
			  })
			  
			  active_projects.queryRelatedFeatures(relatedQuery).then(function (result) {
			  	  ids.forEach(function (objectId) {
				  console.log(objectId)
				  if (result[objectId]) {
					  
					  project_count = result[objectId].features.length
					 
					  var message = document.getElementById("message")
					  if(project_count == 1){
						  message.textContent = "There is " + project_count +" active project here"
					  } else {
						  message.textContent = "There are " + project_count +" active projects here"
					  }
					  var zone = document.getElementById("zone")
					  zone.style.display = ""
					  
					  infoDiv = document.getElementById("info")
					  var project_cards = document.getElementsByClassName("projects")
					  console.log(project_cards)
					  
					  if (project_cards.length > 0){
						  for (let i = project_cards.length-1; i>=0; i--){
					  		project_cards[i].remove()
						  }
					  }
				      
					  console.group("relationship for feature:", objectId)
					  result[objectId].features.forEach(function (feature) {
					    console.log("attributes", feature.attributes);
						makeDiv(feature.attributes)
						var div = makeCards(feature.attributes)
						buildInfoDiv(div)
					  });
					  console.groupEnd();
				  } else {
					  var side_nav_loader = document.getElementById("loading")
					  side_nav_loader.classList.remove("is-active")
					  infoDiv.style.alignItems = "center"
					  var project_cards = document.getElementsByClassName("projects")
					  console.log(project_cards)
					  
					  if (project_cards.length > 0){
						  for (let i = project_cards.length-1; i>=0; i--){
					  		project_cards[i].remove()
						  }
					  }
					  var message = document.getElementById("message")
					  message.textContent = "There are no active projects here"
					  var people_header = document.getElementById("zone")
					  people_header.textContent = zone_name
					  people_header.style.display = ""
				  }});
			  }).catch(function (error) {
			  	  console.log("error from queryRelatedFeatures:", error);
			  });
			  //console.log("after")
		  });
	  });
	});


	var highlight;
	view.on("pointer-move", function (event) {
		view.hitTest(event).then(function (response) {
			if (response.results.length) {
				changeCursor(response)
				addHighlight(response)
			} else {
				changeCursor(response)
				highlight.remove()
				
			}
		});
	});	
	
});