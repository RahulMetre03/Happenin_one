import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  isLogin = true;
  showSuccessPopup = false;
  successMessage = '';

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Login form with enhanced validations
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Register form with enhanced validations
    this.registerForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10}$/)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), this.passwordValidator]],
      role: ['user']
    });
  }

  // Custom password validator
  passwordValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.value || '';

    if (!password) return null; // Let required validator handle empty case

    if (password.length < 6) return null; // Let minLength validator handle this

    if (!/(?=.*[a-z])/.test(password)) {
      return { lowercase: true };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { uppercase: true };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { number: true };
    }

    return null; // Password is valid
  }

  toggleForm(isLoginForm: boolean): void {
    this.isLogin = isLoginForm;
    // Reset forms when switching
    this.loginForm.reset();
    this.registerForm.reset();
    // Set default role for register form
    if (!isLoginForm) {
      this.registerForm.patchValue({ role: 'user' });
    }
  }

  showSuccessMessage(message: string): void {
    this.successMessage = message;
    this.showSuccessPopup = true;

    // Hide popup after 2 seconds
    setTimeout(() => {
      this.showSuccessPopup = false;
    }, 2000);
  }

  onLoginSubmit(): void {
    if (this.loginForm.valid) {
      const data = this.loginForm.value;

      this.authService.loginUser(data).subscribe({
        next: (response: any) => {
          const userRole = response.data.user?.role;

          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
          if (response.data.user) {
            localStorage.setItem('user', JSON.stringify(response.data.user));
          }

          // Show success message
          this.showSuccessMessage('Logged in successfully! 🎉');

          // Navigate after showing success message
          setTimeout(() => {
            if (userRole === 'organizer') {
              this.router.navigate(['/organizer-dashboard']);
            } else if (userRole === 'admin') {
              this.router.navigate(['/admin-dashboard']);
            } else {
              this.router.navigate(['/user-dashboard']);
            }
          }, 2000);
        },
        error: (error) => {
          console.error('Login failed', error);

          // Handle specific error messages
          let errorMessage = 'Login failed. Please check your credentials and try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 401) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (error.status === 0) {
            errorMessage = 'Network error. Please check your connection.';
          }

          alert(errorMessage);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.loginForm);
    }
  }

  onRegisterSubmit(): void {
    if (this.registerForm.valid) {
      const data = this.registerForm.value;

      this.authService.registerUser(data).subscribe({
        next: () => {
          // Show success message
          this.showSuccessMessage('Registration successful! 🌟');

          // Switch to login form after showing success message
          setTimeout(() => {
            this.toggleForm(true);
          }, 2000);
        },
        error: (error) => {
          console.error('Registration failed', error);

          // Handle specific error messages
          let errorMessage = 'Registration failed. Please try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 409) {
            errorMessage = 'Email already exists. Please use a different email.';
          } else if (error.status === 0) {
            errorMessage = 'Network error. Please check your connection.';
          }

          alert(errorMessage);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      this.markFormGroupTouched(this.registerForm);
    }
  }

  // Utility method to mark all form controls as touched
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Get password validation error message (one at a time)
  getPasswordError(formGroup: FormGroup): string | null {
    const passwordControl = formGroup.get('password');
    if (!passwordControl?.errors || !passwordControl?.touched) {
      return null;
    }

    if (passwordControl.errors['required']) {
      return 'Password is required';
    }
    if (passwordControl.errors['minlength']) {
      return 'Password must be at least 6 characters long';
    }

    // Additional validation for register form
    if (formGroup === this.registerForm) {
      if (passwordControl.errors['lowercase']) {
        return 'Password must contain at least one lowercase letter';
      }
      if (passwordControl.errors['uppercase']) {
        return 'Password must contain at least one uppercase letter';
      }
      if (passwordControl.errors['number']) {
        return 'Password must contain at least one number';
      }
    }

    return null;
  }
}
