module powerbi.extensibility.visual {
    "use strict";

    import DataViewObjectsParser = powerbi.extensibility.utils.dataview.DataViewObjectsParser;

    export class VisualSettings extends DataViewObjectsParser {
      public settings: VisualSettingsProperties = new VisualSettingsProperties();
    }

    export class VisualSettingsProperties {
      public dummySetting: string = "Default Value";
      public apiKey: string = "";
      public zoomLevel: number = 14;
      public mapType: string = "MAPANDSTREETVIEW";
    }
}
