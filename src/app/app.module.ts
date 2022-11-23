import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { NgxThreeModule } from 'ngx-three';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { ThreeComponent } from './three/three.component';

@NgModule({
  declarations: [AppComponent, LoginComponent, HomeComponent, ThreeComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    NgxThreeModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
