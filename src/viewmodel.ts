module powerbi.extensibility.visual {
    "use strict";

  export class VisualViewModel {
      dataPoints: VisualDataPoint[];
  };

  export class VisualDataPoint {
    location: string;
    measure: number;
    ltd: number;
    lng: number;
    selectionId: ISelectionId;
  };

}
