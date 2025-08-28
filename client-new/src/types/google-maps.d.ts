// Definiciones de tipos para Google Maps JavaScript API

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement, opts?: MapOptions);
      fitBounds(bounds: LatLngBounds): void;
      setCenter(latlng: LatLng | LatLngLiteral): void;
      setZoom(zoom: number): void;
      getZoom(): number;
      panTo(latLng: LatLng | LatLngLiteral): void;
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral;
      zoom?: number;
      mapTypeId?: string;
      disableDefaultUI?: boolean;
      zoomControl?: boolean;
      mapTypeControl?: boolean;
      scaleControl?: boolean;
      streetViewControl?: boolean;
      rotateControl?: boolean;
      fullscreenControl?: boolean;
    }

    class LatLng {
      constructor(lat: number, lng: number);
      lat(): number;
      lng(): number;
    }

    interface LatLngLiteral {
      lat: number;
      lng: number;
    }

    class LatLngBounds {
      constructor(sw?: LatLng, ne?: LatLng);
      extend(point: LatLng): LatLngBounds;
      contains(latLng: LatLng): boolean;
      getNorthEast(): LatLng;
      getSouthWest(): LatLng;
    }

    interface LatLngBoundsLiteral {
      east: number;
      north: number;
      south: number;
      west: number;
    }

    // Geocoder
    class Geocoder {
      geocode(request: GeocoderRequest, callback: (results: GeocoderResult[], status: GeocoderStatus) => void): void;
    }

    interface GeocoderRequest {
      address?: string;
      location?: LatLng | LatLngLiteral;
      placeId?: string;
      bounds?: LatLngBounds | LatLngBoundsLiteral;
      componentRestrictions?: GeocoderComponentRestrictions;
      region?: string;
    }

    interface GeocoderResult {
      address_components: GeocoderAddressComponent[];
      formatted_address: string;
      geometry: GeocoderGeometry;
      place_id: string;
      types: string[];
    }

    interface GeocoderAddressComponent {
      long_name: string;
      short_name: string;
      types: string[];
    }

    interface GeocoderGeometry {
      location: LatLng;
      location_type: string;
      viewport: LatLngBounds;
      bounds?: LatLngBounds;
    }

    interface GeocoderComponentRestrictions {
      country?: string | string[];
      postalCode?: string | string[];
      locality?: string | string[];
      administrativeArea?: string | string[];
      route?: string | string[];
    }

    enum GeocoderStatus {
      OK = 'OK',
      ZERO_RESULTS = 'ZERO_RESULTS',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR'
    }

    // Directions
    class DirectionsService {
      route(request: DirectionsRequest, callback: (result: DirectionsResult, status: DirectionsStatus) => void): void;
    }

    class DirectionsRenderer {
      constructor(opts?: DirectionsRendererOptions);
      setMap(map: google.maps.Map | null): void;
      setDirections(directions: DirectionsResult): void;
      getMap(): google.maps.Map;
      getPanel(): HTMLElement;
      setOptions(options: DirectionsRendererOptions): void;
      setRouteIndex(routeIndex: number): void;
    }

    interface DirectionsRequest {
      origin: string | LatLng | LatLngLiteral;
      destination: string | LatLng | LatLngLiteral;
      travelMode: TravelMode;
      waypoints?: DirectionsWaypoint[];
      optimizeWaypoints?: boolean;
      provideRouteAlternatives?: boolean;
      avoidHighways?: boolean;
      avoidTolls?: boolean;
      avoidFerries?: boolean;
      region?: string;
    }

    interface DirectionsWaypoint {
      location: string | LatLng | LatLngLiteral;
      stopover?: boolean;
    }

    interface DirectionsResult {
      routes: DirectionsRoute[];
    }

    interface DirectionsRoute {
      bounds: LatLngBounds;
      copyrights: string;
      legs: DirectionsLeg[];
      overview_path: LatLng[];
      overview_polyline: string;
      warnings: string[];
      waypoint_order: number[];
    }

    interface DirectionsLeg {
      distance: Distance;
      duration: Duration;
      end_address: string;
      end_location: LatLng;
      start_address: string;
      start_location: LatLng;
      steps: DirectionsStep[];
      via_waypoints: LatLng[];
    }

    interface DirectionsStep {
      distance: Distance;
      duration: Duration;
      end_location: LatLng;
      instructions: string;
      path: LatLng[];
      start_location: LatLng;
      travel_mode: TravelMode;
    }

    interface Distance {
      text: string;
      value: number;
    }

    interface Duration {
      text: string;
      value: number;
    }

    interface DirectionsRendererOptions {
      directions?: DirectionsResult;
      draggable?: boolean;
      hideRouteList?: boolean;
      infoWindow?: InfoWindow;
      map?: google.maps.Map;
      markerOptions?: MarkerOptions;
      panel?: HTMLElement;
      polylineOptions?: PolylineOptions;
      preserveViewport?: boolean;
      routeIndex?: number;
      suppressBicyclingLayer?: boolean;
      suppressInfoWindows?: boolean;
      suppressMarkers?: boolean;
      suppressPolylines?: boolean;
    }

    enum TravelMode {
      DRIVING = 'DRIVING',
      WALKING = 'WALKING',
      BICYCLING = 'BICYCLING',
      TRANSIT = 'TRANSIT'
    }

    enum DirectionsStatus {
      OK = 'OK',
      NOT_FOUND = 'NOT_FOUND',
      ZERO_RESULTS = 'ZERO_RESULTS',
      MAX_WAYPOINTS_EXCEEDED = 'MAX_WAYPOINTS_EXCEEDED',
      INVALID_REQUEST = 'INVALID_REQUEST',
      OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
      REQUEST_DENIED = 'REQUEST_DENIED',
      UNKNOWN_ERROR = 'UNKNOWN_ERROR'
    }

    // Markers
    class Marker {
      constructor(opts?: MarkerOptions);
      setMap(map: google.maps.Map | null): void;
      setPosition(latlng: LatLng | LatLngLiteral): void;
      setTitle(title: string): void;
      setIcon(icon: string | Icon | Symbol): void;
      getPosition(): LatLng;
      setVisible(visible: boolean): void;
      setAnimation(animation: Animation): void;
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral;
      map?: google.maps.Map;
      title?: string;
      icon?: string | Icon | Symbol;
      label?: string | MarkerLabel;
      draggable?: boolean;
      clickable?: boolean;
      cursor?: string;
      opacity?: number;
      visible?: boolean;
      zIndex?: number;
      animation?: Animation;
    }

    interface MarkerLabel {
      text: string;
      color?: string;
      fontFamily?: string;
      fontSize?: string;
      fontWeight?: string;
    }

    interface Icon {
      url: string;
      size?: Size;
      origin?: Point;
      anchor?: Point;
      scaledSize?: Size;
    }

    interface Symbol {
      path: string | SymbolPath;
      anchor?: Point;
      fillColor?: string;
      fillOpacity?: number;
      labelOrigin?: Point;
      rotation?: number;
      scale?: number;
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
    }

    enum SymbolPath {
      CIRCLE = 'CIRCLE',
      FORWARD_CLOSED_ARROW = 'FORWARD_CLOSED_ARROW',
      FORWARD_OPEN_ARROW = 'FORWARD_OPEN_ARROW',
      BACKWARD_CLOSED_ARROW = 'BACKWARD_CLOSED_ARROW',
      BACKWARD_OPEN_ARROW = 'BACKWARD_OPEN_ARROW'
    }

    enum Animation {
      BOUNCE = 'BOUNCE',
      DROP = 'DROP'
    }

    // InfoWindow
    class InfoWindow {
      constructor(opts?: InfoWindowOptions);
      close(): void;
      getContent(): string | HTMLElement;
      getPosition(): LatLng;
      getZIndex(): number;
      open(map?: google.maps.Map, anchor?: Marker): void;
      setContent(content: string | HTMLElement): void;
      setOptions(options: InfoWindowOptions): void;
      setPosition(position: LatLng | LatLngLiteral): void;
      setZIndex(zIndex: number): void;
    }

    interface InfoWindowOptions {
      content?: string | HTMLElement;
      disableAutoPan?: boolean;
      maxWidth?: number;
      pixelOffset?: Size;
      position?: LatLng | LatLngLiteral;
      zIndex?: number;
    }

    // Places
    namespace places {
      class Autocomplete {
        constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
        getBounds(): LatLngBounds;
        getPlace(): PlaceResult;
        setBounds(bounds: LatLngBounds | LatLngBoundsLiteral): void;
        setComponentRestrictions(restrictions: ComponentRestrictions): void;
        setFields(fields: string[]): void;
        setOptions(options: AutocompleteOptions): void;
        setTypes(types: string[]): void;
        addListener(eventName: string, handler: Function): void;
      }

      interface AutocompleteOptions {
        bounds?: LatLngBounds | LatLngBoundsLiteral;
        componentRestrictions?: ComponentRestrictions;
        fields?: string[];
        placeIdOnly?: boolean;
        strictBounds?: boolean;
        types?: string[];
      }

      interface ComponentRestrictions {
        country?: string | string[];
      }

      interface PlaceResult {
        address_components?: GeocoderAddressComponent[];
        adr_address?: string;
        formatted_address?: string;
        geometry?: PlaceGeometry;
        icon?: string;
        name?: string;
        place_id?: string;
        plus_code?: PlacePlusCode;
        rating?: number;
        reference?: string;
        types?: string[];
        url?: string;
        utc_offset_minutes?: number;
        vicinity?: string;
        website?: string;
      }

      interface PlaceGeometry {
        location?: LatLng;
        viewport?: LatLngBounds;
      }

      interface PlacePlusCode {
        compound_code?: string;
        global_code?: string;
      }
    }

    // Polylines
    class Polyline {
      constructor(opts?: PolylineOptions);
      getPath(): MVCArray<LatLng>;
      setMap(map: google.maps.Map | null): void;
      setOptions(options: PolylineOptions): void;
      setPath(path: MVCArray<LatLng> | LatLng[] | LatLngLiteral[]): void;
    }

    interface PolylineOptions {
      clickable?: boolean;
      draggable?: boolean;
      editable?: boolean;
      geodesic?: boolean;
      icons?: IconSequence[];
      map?: google.maps.Map;
      path?: MVCArray<LatLng> | LatLng[] | LatLngLiteral[];
      strokeColor?: string;
      strokeOpacity?: number;
      strokeWeight?: number;
      visible?: boolean;
      zIndex?: number;
    }

    interface IconSequence {
      fixedRotation?: boolean;
      icon?: Symbol;
      offset?: string;
      repeat?: string;
    }

    // Utility classes
    class MVCArray<T> {
      constructor(array?: T[]);
      clear(): void;
      forEach(callback: (elem: T, i: number) => void): void;
      getArray(): T[];
      getAt(i: number): T;
      getLength(): number;
      insertAt(i: number, elem: T): void;
      pop(): T;
      push(elem: T): number;
      removeAt(i: number): T;
      setAt(i: number, elem: T): void;
    }

    class Size {
      constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
      width: number;
      height: number;
    }

    class Point {
      constructor(x: number, y: number);
      x: number;
      y: number;
    }

    // Events
    namespace event {
      function addListener(instance: object, eventName: string, handler: Function): MapsEventListener;
      function removeListener(listener: MapsEventListener): void;
      function clearInstanceListeners(instance: object): void;
      function trigger(instance: object, eventName: string, ...args: any[]): void;
    }

    interface MapsEventListener {
      remove(): void;
    }
  }
}

declare global {
  interface Window {
    google: any;
  }
  
  var google: any;
}

export {};