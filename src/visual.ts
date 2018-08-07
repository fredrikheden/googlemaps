// OK Address + Long/Lat
// OK Zoom level
// OK Street, Map or Both
// TODO: Toggle Map/Street

module powerbi.extensibility.visual {
    "use strict";

    function visualTransform(options: VisualUpdateOptions, host: IVisualHost, thisRef: Visual): VisualViewModel {            
        let dataViews = options.dataViews;
        let viewModel: VisualViewModel = {
            dataPoints: []
        };
        if ( !Utils.hasValidDataViews(dataViews) ) {
            return viewModel;
        }

        let objects = dataViews[0].metadata.objects;
       
        var selectionIDs = Utils.getSelectionIds(dataViews[0], host);

        let measureIndex = Utils.getColumnIndex(dataViews[0].metadata, "measure");
        let ltdIndex = Utils.getColumnIndex(dataViews[0].metadata, "ltd");
        let lngIndex = Utils.getColumnIndex(dataViews[0].metadata, "lng");
        let categoryIndex = Utils.getColumnIndex(dataViews[0].metadata, "category");
        
        let visualDataPoints: VisualDataPoint[] = [];
        for( var i = 0; i < dataViews[0].table.rows.length; i++) {
            var row = dataViews[0].table.rows[i];
            visualDataPoints.push({
                location:  categoryIndex !== null ? <string>row[categoryIndex] : null,
                measure: measureIndex !== null ? <number>row[measureIndex] : null,
                ltd: ltdIndex !== null ? <number>row[ltdIndex] : null,
                lng: lngIndex !== null ? <number>row[lngIndex] : null,
                selectionId: selectionIDs[i]
            });
        }
 
        return {
            dataPoints: visualDataPoints
        };
    }     

    export class Visual implements IVisual {
        private settings: VisualSettings;
        private model: VisualViewModel;
        private host: IVisualHost;
        private svg: d3.Selection<SVGElement>;
        private selectionManager: ISelectionManager;
        private element: HTMLElement;
        private mapDiv: HTMLElement;
        private panoDiv: HTMLElement;
        private googleScript: d3.Selection<SVGElement>;
        private activeToggle: string = "STREET"; // STREET or MAP
        private divTogglerHTMLInit: string = "<div class='txtCell'>Map</div><label class='switch'><input type='checkbox' id='chartToggler'><span class='slider round'></span></label><div class='txtCell'>Street</div>";
        private divToggler: HTMLElement;
        private GMap: any;
        private GPanorama: any;

        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.selectionManager = options.host.createSelectionManager();
            this.element = options.element; 

            let mapDiv = this.mapDiv = document.createElement('div');
			mapDiv.id = 'map';
			mapDiv.style.height = "50%";
            this.element.appendChild(mapDiv);
            
            let panoDiv = this.panoDiv = document.createElement('div');
			panoDiv.id = 'pano';
			panoDiv.style.height = "50%";
            this.element.appendChild(panoDiv);

            let divToggler = this.divToggler = document.createElement("div");
            this.element.appendChild(divToggler);
            divToggler.className = "toggleContainer";
            divToggler.innerHTML = this.divTogglerHTMLInit;
            var thisRef = this;
            $("#chartToggler").on("click", function() {thisRef.toggleChart();} );

            this.googleScript = null;
        }

        public toggleChart() {
            this.activeToggle = this.activeToggle==="STREET" ? "MAP" : "STREET";
            this.setHeightForToggle();
            this.updateGoogleAfterToggle();
        }

        private setHeightForToggle() {
            if ( this.activeToggle === "STREET" ) {
                this.mapDiv.style.height = "100%";
                this.panoDiv.style.height = "0%";   
            } else {
                this.mapDiv.style.height = "0%";
                this.panoDiv.style.height = "100%";   
            }
        }

        private updateGoogleAfterToggle() {
            const google = window['google'] || window.window['google'];
            this.GPanorama.setZoom(0);
            google.maps.event.trigger(this.GPanorama, 'resize')
        }


        private initGoogleMaps() {
            const google = window['google'] || window.window['google'];
            if ( this.settings.settings.mapType === "MAPANDSTREETVIEW" ) {
                this.mapDiv.style.height = "50%";
                this.panoDiv.style.height = "50%";
            } else if ( this.settings.settings.mapType === "MAPANDSTREETVIEWTOGGLE" ) {
                var thisRef = this;
                this.mapDiv.style.height = "100%";
                this.panoDiv.style.height = "0%";
                this.activeToggle = "STREET";
                this.divToggler.innerHTML = this.divTogglerHTMLInit;
                $("#chartToggler").on("click", function() {thisRef.toggleChart();} );
            } else if ( this.settings.settings.mapType === "MAP" ) {
                this.mapDiv.style.height = "100%";
                this.panoDiv.style.height = "0%";
            } else if ( this.settings.settings.mapType === "STREETVIEW" ) {
                this.mapDiv.style.height = "0%";
                this.panoDiv.style.height = "100%";
            }
            if ( this.googleScript === null ) {
                this.googleScript = d3.select(this.element).append('script');
                this.googleScript.attr({
                    type: 'text/javascript',
                    src: 'https://maps.googleapis.com/maps/api/js?key=' + this.settings.settings.apiKey,
                    async: true
                })
                .on('load', () => {
                    this.initMapAndStreetView();
                });      
            }
            else {
                this.initMapAndStreetView();
            }
        } 

        private initMapAndStreetView() {
            const google = window['google'] || window.window['google'];

            var geocoder = new google.maps.Geocoder();
            var thisRef = this;
            let addressToGeoCode = this.model.dataPoints[0].location;
            var ltd = this.model.dataPoints[0].ltd;
            var lng = this.model.dataPoints[0].lng;
            if ( ltd === null && lng === lng ) {
                // We need to geocode, we have an address
                geocoder.geocode({
                    'address': addressToGeoCode
                }, function(results, status) {
                    if (status == google.maps.GeocoderStatus.OK) {
                        //console.log( results[0].geometry.location.lat() );
                        //var fenway = {lat: 57.885701, lng: 12.051298};
                        var fenway = {lat: results[0].geometry.location.lat(), lng: results[0].geometry.location.lng()};
                        var map = thisRef.GMap = new google.maps.Map(thisRef.mapDiv, {
                        center: fenway,
    //                    center: results[0].geometry.location,
    //                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                        zoom: thisRef.settings.settings.zoomLevel
                        });
                        var panorama =  thisRef.GPanorama = new google.maps.StreetViewPanorama(
                            thisRef.panoDiv, {
                            position: fenway,
                            pov: {
                                heading: 34,
                                pitch: 10
                            }
                            });
                        map.setStreetView(panorama);
                    }
                });
            }
            else {
                // TODO: Remove duplicate code
                // We already have ltd/lng, no need to geocode
                var fenway = {lat: ltd, lng:lng};
                var map = thisRef.GMap = new google.maps.Map(thisRef.mapDiv, {
                center: fenway,
                zoom: thisRef.settings.settings.zoomLevel
                });
                var panorama = thisRef.GPanorama = new google.maps.StreetViewPanorama(
                    thisRef.panoDiv, {
                    position: fenway,
                    pov: {
                        heading: 34,
                        pitch: 10
                    }
                    });
                map.setStreetView(panorama);
            }
        }

        public update(options: VisualUpdateOptions) {
            this.settings = Visual.parseSettings(options && options.dataViews && options.dataViews[0]);        

            if ( this.settings.settings.mapType !== "MAPANDSTREETVIEWTOGGLE") {
                this.divToggler.style.display = "none";
            } else {
                this.divToggler.style.display = "";
            }

            this.model = visualTransform(options, this.host, this);
            let width = options.viewport.width;
            let height = options.viewport.height;
//            this.svg.attr("width", width).attr("height", height);
//            this.initStreetView();
//            this.element.style.width = width + "px";
//            this.element.style.height = height + "px";

            //this.initGoogleMaps();
            this.initGoogleMaps();

        }

        private static parseSettings(dataView: DataView): VisualSettings {
            return VisualSettings.parse(dataView) as VisualSettings;
        }

        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
            return VisualSettings.enumerateObjectInstances(this.settings || VisualSettings.getDefault(), options);
        }
    }
}