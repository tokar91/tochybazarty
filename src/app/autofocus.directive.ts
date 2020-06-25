import { Directive, Input, ElementRef, OnInit } from '@angular/core';

@Directive({
  selector: '[realAutofocus]'
})
export class AutofocusDirective implements OnInit {

  private autofocus: boolean = true;

  @Input() set realAutofocus(condition: any){
    this.autofocus = condition !== false;
  }

  constructor(private elementRef: ElementRef) { }

  ngOnInit():void {
    if(this.autofocus) this.elementRef.nativeElement.focus();
  }






}
