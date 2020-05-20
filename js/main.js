var view;
var active_projects;
var everyLayer;
var query;
var highlight;
var identifyTask;
var params;
var ids;
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
    "esri/views/MapView",
    "esri/WebMap",
    "esri/layers/FeatureLayer",
    "esri/widgets/Locate",
    "esri/widgets/Home",
    "dojo/domReady!"], function (
	esriConfig,
	MapView,
	WebMap,
	FeatureLayer,
	Locate,
	Home,
) {
	
	//LAYERS
	uc_gis_people = new FeatureLayer({
		portalItem: {
			id: "a712b4f4423b465fa4a474954d815f9e"
		},
		visible: true,
		popupEnabled:true
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
	homeBtn = new Home({
        view: view
    })
    locateBtn = new Locate({
        view: view
      });
    
	view.ui.add(locateBtn, {position: "top-left"});
    view.ui.add(homeBtn, "top-left")
	
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