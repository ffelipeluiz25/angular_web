import { Component, OnInit, ViewChild, Input } from '@angular/core';
import { SimplePDFBookmark, SimplePdfViewerComponent, SimpleProgressData } from 'simple-pdf-viewer';

const OUTLINE_MENU = 2;

@Component({
  selector: 'app-pdf-viewer',
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.css']
})
export class PdfViewerComponent {
  @Input() src: any;

  menu = 1;
  backButtonVisible = false;
  errorMsg = '';
  bookmarks: SimplePDFBookmark[] = [];
  snapshots: string[] = [];
  displayedImage: '';

  urlBox: any;
  firstPageBox: any;
  firstZoomBox: any;
  pageBox: any;
  zoomBox: any;
  searchBox: any;

  @ViewChild(SimplePdfViewerComponent) private pdfViewer: SimplePdfViewerComponent;
  // @ViewChild(ViewerComponent) private imgViewer: ViewerComponent;

  isActiveMenu(menu: number): boolean {
    return this.menu === menu && (this.pdfViewer.isDocumentLoaded() || menu === 1);
  }

  setActiveMenu(menu: number) {
    this.menu = menu;
    if (menu === OUTLINE_MENU) {
      this.backButtonVisible = true;
    } else {
      this.backButtonVisible = false;
    }
  }

  openDocument(documents: File[]) {
    this.errorMsg = '';
    if (documents && documents.length > 0) {
      this.pdfViewer.openFile(documents[0]);
    }
  }

  openUrl(url: string) {
    this.errorMsg = '';
    if (url && url.length > 0) {
      this.pdfViewer.openUrl(url);
    }
  }

  onError(event: any) {
    this.errorMsg = 'Failed to load the document';
  }

  onProgress(progress: SimpleProgressData) {
    console.log(progress);
  }

  onLoadComplete()  {
    // see the whole document
    this.pdfViewer.zoomPageWidth();
  }

  createBookmark() {
    this.pdfViewer.createBookmark().then(bookmark => {
      if(bookmark) {
        this.bookmarks.push(bookmark);
      }
    })
  }

  getPageSnapshot() {
    this.pdfViewer.getPageSnapshot().then(snapshot => {
      if(snapshot) {
        this.snapshots.push(URL.createObjectURL(snapshot));
      }
    })
  }

  openImage(url: string) {
    // this.displayedImage = url;
    // this.imgViewer.show();
    // window.open(url);
  }

}