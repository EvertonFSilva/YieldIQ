export interface AssetDocumentProperties {
  documentIdentifier: number | string;
  referenceDate: string;
  documentDownloadUrl: string;
  documentDescription: string;
  documentCategoryName?: string;
  documentCategoryId?: number;
}

export class AssetDocument {
  public readonly documentIdentifier: number | string;
  public readonly referenceDate: string;
  public readonly documentDownloadUrl: string;
  public readonly documentDescription: string;
  public readonly documentCategoryName?: string;
  public readonly documentCategoryId?: number;

  constructor(properties: AssetDocumentProperties) {
    this.documentIdentifier = properties.documentIdentifier;
    this.referenceDate = properties.referenceDate;
    this.documentDownloadUrl = properties.documentDownloadUrl;
    this.documentDescription = properties.documentDescription;
    this.documentCategoryName = properties.documentCategoryName;
    this.documentCategoryId = properties.documentCategoryId;
  }

  public isXmlFormat(): boolean {
    const normalizedUrl = this.documentDownloadUrl.toLowerCase();
    return normalizedUrl.includes('.xml') || normalizedUrl.includes('exibirxml');
  }

  public toJSON() {
    return {
      documentIdentifier: this.documentIdentifier,
      referenceDate: this.referenceDate,
      documentDownloadUrl: this.documentDownloadUrl,
      documentDescription: this.documentDescription,
      documentCategoryName: this.documentCategoryName,
      documentCategoryId: this.documentCategoryId
    };
  }
}
