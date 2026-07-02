import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  form!: FormGroup;
  saved = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['Alice Johnson', [Validators.required, Validators.minLength(2)]],
      email: ['alice@example.com', [Validators.required, Validators.email]],
      notifications: [true],
    });
  }

  save(): void {
    if (this.form.valid) {
      this.saved = true;
    }
  }
}
