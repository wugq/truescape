import {Component} from '@angular/core';
import {AbstractControl, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  submitted = false;
  isSignInFailed = false;
  errorMessage = "";

  loginForm = new FormGroup({
    username: new FormControl(),
    password: new FormControl(),
  });

  constructor(private formBuilder: FormBuilder, private router: Router) {
    this.createForm();
  }

  createForm() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
  }

  get f(): { [key: string]: AbstractControl } {
    return this.loginForm.controls;
  }

  login() {
    this.submitted = true;
    if (this.loginForm.invalid) {
      return;
    }
    const {username, password} = this.loginForm.getRawValue();
    if (username != "demo") {
      this.isSignInFailed = true;
      this.errorMessage = "username or password is not correct";
      return;
    }

    this.router.navigate(['home']).then(r => {
    });
  }
}
