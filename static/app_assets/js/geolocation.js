var userLocation = (function() {

            return {

                init: function() {
                    this.getLocation();
                },

                getLocation: function() {
                    var self = this;
                    navigator.geolocation.getCurrentPosition(self.geocodeLocation, self.printError);
                },

                geocodeLocation: function(loc) {
                    var self = userLocation;
                    self.position = {
                        lat: loc.coords.latitude,
                        long: loc.coords.longitude
                    }
                    self.geocoder = new google.maps.Geocoder();

                    var currentLocation = new google.maps.LatLng(self.position.lat, self.position.long);
                    
                    self.geocoder.geocode({
                        'latLng': currentLocation
                    }, function(results, status) {
                        if (status == google.maps.GeocoderStatus.OK) {
                            self.address = results[2].formatted_address;
                            self.printLocation();

                        }
                        // else if(status == google.maps.GeocoderStatus.REQUEST_DENIED){
                        //     var location2 = "furqan";
                        //     $('#user_locations').val(location2);
                        // }
                        // else if(status == google.maps.GeocoderStatus.ZERO_RESULTS){
                        //     var location2 = "furqan";
                        //     $('#user_locations').val(location2);
                        // }
                        // else if(status == google.maps.GeocoderStatus.INVALID_REQUEST){
                        //     var location2 = "furqan";
                        //     $('#user_locations').val(location2);
                        // }
                        // else if(status == google.maps.GeocoderStatus.UNKNOWN_ERROR){
                        //     var location2 = "furqan";
                        //     $('#user_locations').val(location2);
                        // }
                    });
                },

                printLocation: function() {
                    var self = userLocation;
                    $('#user_locations').val(self.address);
                    
                },

                printError: function() {
                    // alert("Please Allow Location for Better performance");
                    var location2 = "furqan";
                    $('#user_locations').val(location2);

                    // alert(self_address);
                    // $('#geo_city').val(geo_city);
                    // $('.searchTextField12').val(self_address);
                    // navigator.geolocation.getCurrentPosition(function(position) {
                    //     yourFunction(position.coords.latitude, position.coords.longitude);
                    // });
                    // Geolocation();

                    // $('#searchTextField_rent_a_car_salman').val('No location found');
                }
            };

        }());
		
$(document).ready(function() {

 
    userLocation.init();
 
  });