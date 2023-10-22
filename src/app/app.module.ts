import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AppMaterialModule as MaterialModule } from './material/material.module';
import { HomeComponent } from './home/home.component';
import { MultiplierClassPipe } from './home/multiplier-class.pipe';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MoveDisplayComponent } from './home/move-display/move-display.component';

@NgModule({
  declarations: [AppComponent, HomeComponent, MultiplierClassPipe, MoveDisplayComponent],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MaterialModule,
    HttpClientModule,
    FormsModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
