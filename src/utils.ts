module powerbi.extensibility.visual {
    "use strict";

  export class Utils {

    public static getSelectionIds(dataView: DataView, host: IVisualHost): ISelectionId[] {
      return dataView.table.identity.map((identity: DataViewScopeIdentity) => {
          const categoryColumn: DataViewCategoryColumn = {
              source: dataView.table.columns[0],
              values: null,
              identity: [identity]
          };

          return host.createSelectionIdBuilder()
              .withCategory(categoryColumn, 0)
              .createSelectionId();
      });
    }

    public static hasValidDataViews(dataViews: DataView[]) {
      if (!dataViews
        || !dataViews[0]
        || !dataViews[0].categorical
        || !dataViews[0].categorical.categories
        || !dataViews[0].categorical.categories[0].source
        || !dataViews[0].categorical.values)
        return false;  // We don'y have any data, return default. 
      return true;
    }

    public static getColumnIndex(md: DataViewMetadata, columnName: string): number {
      let RetValue: number = null;
      for (let i = 0; i < md.columns.length; i++) {
          if (md.columns[i].roles[columnName] === true) {
              RetValue = i;
              break;
          }
      }
      return RetValue;
  }

 }

  
}
