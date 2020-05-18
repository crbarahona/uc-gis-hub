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


//REPLACE WITH FEATURELAYER DOMAIN OBJECTS
const campus_codes ={
	"+037.87000 _-122.26000": "UC Berkeley",
	"+038.54000 _-121.76000": "UC Davis",
	"+033.64455 _-117.84532": "UC Irvine",
	"+034.06890_-118.44737": "UCLA",
	"+037.36511_-120.42503": "UC Merced",
	"+033.97370_-117.33025": "UC Riverside",
	"+032.87171_-117.23805": "UC San Diego",
	"+037.76572_-122.45384": "UC San Francisco*",
	"+034.41396_-119.85111": "UC Santa Barbara",
	"+036.98805_-122.06040": "UC Santa Cruz",
	"+037.80294_-122.27086": "UCOP",
}
const roles = {
	1:"License Manager",
	2:"GIS Professional",
	3:"Service Manager",
	4:"Campus Planning",
	5:"Library"
}

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

	//MAP VIEW
	view = new MapView({
		container: "viewDiv",
		map: uc_gis_map,
		layerViews: everyLayer
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
        maxSuggestions: 8,
		allPlaceholder: "Search for a person, campus, or role",
        sources: [
            {featureLayer: {
                url: "https://services9.arcgis.com/mt4kvYhNXSa5AqLG/ArcGIS/rest/services/service_2ca947ed477e4617b92951d58a4f6b21/FeatureServer/0"},
            searchFields: ["name", "contact_email", "person_type", "campus"],
            displayField: "*",
            exactMatch: false,
            outFields: ["*"],
            name: "UC GIS People"
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
	
	function makeCard(person){
		var name = person.attributes["name"]
		var campus = campus_codes[person.attributes["campus"]]
		var role = roles[person.attributes["person_type"]]
		var bio = person.attributes["bio"]
		var email = person.attributes["contact_email"]		
		
		var all_attributes = [name, campus, role, bio, email]
		
		var d = document.createElement("div")
		d.className = "person"
		
		var nametag = document.createElement("h3")
		nametag.className = "nametag"
		nametag.textContent = name
		d.appendChild(nametag)
		
		var email_link = document.createElement("a")
		email_link.href = "mailto:" + email
		email_link.textContent = email
		d.appendChild(email_link)
		
		for (i = 1; i < all_attributes.length-1; i++){
			var p = document.createElement("p")
			p.textContent = all_attributes[i]
			d.appendChild(p)
		}		
		
		people_menu.appendChild(d)
		
		var li = document.createElement("li")
		li.appendChild(d)
		people_menu.appendChild(li)		
		
		return d
	}
	
	var people_menu = document.getElementById("people_menu")
	
	uc_gis_people.queryFeatures().then(function(results){
		var people_list = results.features
		people_list.forEach(function(person){			
			makeCard(person)
		})
	});
	
		
});