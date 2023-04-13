import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { Observable, ReplaySubject } from 'rxjs';
import { PreviewModalComponent } from '../../shared/upload-document/preview-modal/preview-modal.component';
import swal from 'sweetalert2';

declare var AppMenu: any;

@Component({
  selector: 'app-video-testimonials',
  templateUrl: './video-testimonials.component.html',
  styleUrls: ['./video-testimonials.component.css']
})
export class VideoTestimonialsComponent implements OnInit {

  @ViewChild('previewModal') previewModal: PreviewModalComponent;

  // tslint:disable-next-line: no-input-rename
  @Input('page_is_modal') page_is_modal: boolean;
  public show_upload = false;
  public current_b64: any;
  public current_file_name = '';

  constructor(private router: Router, private api: ApiService) { }

  ngOnInit(): void {
    this.api.LogEcommercePipe('video-testimonials', 'pageview');
    localStorage.setItem('video-testimonials', 'true');

    if (AppMenu && !this.page_is_modal) {
      AppMenu.SetMenu('.nav-video-testimonials');
    }
  }

  onClickUploadVideo() {
    this.show_upload = !this.show_upload;

    if (this.show_upload) {
      (<HTMLInputElement>document.getElementById('input_upload')).click();
    }
    return false;
  }

  onSelectFile(files: any) {
    for (const file of files) {
      this.addFile(file);
    }
  }

  addFile(file: File) {
    this.toBase64(file).subscribe(b64 => {
      this.current_b64 = b64;
      this.current_file_name = file.name;
      this.previewModal.openModal(b64, file.name);
    });
  }

  toBase64(fileToRead: File): Observable<FileReader> {
    const base64Observable = new ReplaySubject<any>(1);

    const fileReader = new FileReader();
    fileReader.onload = event => {
      base64Observable.next(fileReader.result);
    };
    fileReader.readAsDataURL(fileToRead);

    return base64Observable;
  }
  saveFile(confirm) {
    if (!confirm) {
      return;
    }
    const extension = this.current_file_name.split('.').pop();
    const files = [];
    files.push({ name: this.current_file_name, b64: this.current_b64, extension: extension });
    this.previewModal.closeModal();

    this.api.post('/documents', { documents: files }, true).subscribe(result => {
      this.setVideoTestimonials(result);
    }, error => {
      this.api.LogEcommercePipe('video-testimonials', 'error_set_video_testimonials');
      swal.fire('Error!', 'Error on upload');
    });
  }

  private setVideoTestimonials(result: any) {
    this.api.post('/video-testimonials', { path: result.data[0].path }, true).subscribe(result_video_testimonials => {
      this.api.LogEcommercePipe('video-testimonials', 'upload_success');
      swal.fire('', 'Your video testimonial has been uploaded successfully!', 'success');
      this.hideUpload();
    }, error => {
      this.api.LogEcommercePipe('video-testimonials', 'error_set_video_testimonials');
      swal.fire('Error!', 'Error on upload');
    });
  }

  public onClickSeeContestRules() {
    this.api.LogEcommercePipe('video-testimonials', 'contest_rules');
    //window.open('https://bmgmoney.com/contest-rules', "_blank");

  }

  hideUpload() {
    this.show_upload = false;
  }
}
