import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-popup-dialog',
  templateUrl: './popup-dialog.html',
  imports: [CommonModule],
  styleUrls: ['./popup-dialog.css']
})
export class PopupDialogComponent {
  @Input() isVisible = false;
  @Input() title = 'Confirmation';
  @Input() message = 'Are you sure?';
  @Input() confirmText = 'OK';
  @Input() cancelText = 'Cancel';
  @Input() icon = 'bi bi-exclamation-triangle-fill';
  @Input() iconClass = 'warning';
  
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm() {
    this.confirmed.emit();
    this.isVisible = false;
  }

  onCancel() {
    this.cancelled.emit();
    this.isVisible = false;
  }

  onOverlayClick() {
    this.onCancel();
  }
}