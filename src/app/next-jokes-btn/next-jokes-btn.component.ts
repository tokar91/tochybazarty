import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-next-jokes-btn',
  templateUrl: './next-jokes-btn.component.html',
  styleUrls: ['./next-jokes-btn.component.css']
})
export class NextJokesBtnComponent implements AfterViewInit {
  
  phase: number = 0;
  throwTimeout: number = 0;
  delayTimeout: number = 0;

  @ViewChild('container', {static: true}) container: ElementRef;
  @ViewChild('spearBox', {static: true}) spearBox: ElementRef;
  @ViewChild('spear', {static: true}) spear: ElementRef;
  @ViewChild('plane',{static:true}) plane: ElementRef;
  @ViewChild('birds',{static:true}) birds: ElementRef;
  @ViewChild('target',{static:true}) target: ElementRef;
  @ViewChild('targetCover',{static:true}) targetCover: ElementRef;

  spearAnimation: (spearBox, spear, isForwards)=>void;
  bgAnimation: (isEnabled)=>void;

  resetButton(){
    if(this.phase === 3){
      this.spearAnimation(undefined, undefined, false);
      this.bgAnimation(false);
      this.phase = 0;
    }
  }

  constructor() { }


  ngAfterViewInit() {

    let container: HTMLElement = this.container.nativeElement;
    let spearBox: HTMLElement = this.spearBox.nativeElement;
    let spear: HTMLElement = this.spear.nativeElement;
    let plane:HTMLElement = this.plane.nativeElement;
    let birds: HTMLElement = this.birds.nativeElement;
    let target: HTMLElement = this.target.nativeElement;
    let targetCover: HTMLElement = this.targetCover.nativeElement;

    this.spearAnimation = 
      (spearBoxAnim = undefined, spearAnim = undefined, isForwards = false)=>{
        spearBox.style.animation = spearBoxAnim;
        spear.style.animation = spearAnim;
        if(isForwards){
          spearBox.style.animationFillMode = 'forwards';
          spear.style.animationFillMode = 'forwards';
      }
    };
    this.bgAnimation = (isEnabled)=>{
      if(isEnabled){
        plane.style.animation = 'runPlane 6s 3s linear';
        birds.style.animation = 'runBirds 11s 1s linear';
        target.style.animation = 'runTarget 12s linear';
        targetCover.style.animation = 'runTarget 12s linear';
        plane.style.animationFillMode = 'forwards';
        birds.style.animationFillMode = 'forwards';
        target.style.animationFillMode = 'forwards';
        targetCover.style.animationFillMode = 'forwards';
      }else{
        plane.style.animation = undefined;
        birds.style.animation = undefined;
        target.style.animation = undefined;
        targetCover.style.animation = undefined;
      }
    };
    
    container.addEventListener('mouseenter', ()=>{
     if(this.phase === 0){
       this.throwTimeout = 0;
       this.delayTimeout = window.setTimeout(()=>{
        this.delayTimeout = 0;
        this.phase = 1;
        this.spearAnimation('getSpearBox 2s 1s','getSpear 2s 1s',true);
        this.throwTimeout = window.setTimeout(
          ()=>{
            this.throwTimeout = 0;
            this.phase = 2;
            container.onclick = ()=> {
              //console.log('Onclick PO 3000ms');
              if(!this.phase) return;
              if(this.phase === 3){
                this.phase = 0;
                this.spearAnimation(undefined, undefined, false);
                this.bgAnimation(false);
              }
              if(this.phase === 2){
                this.phase = 3;
                this.spearAnimation('throwSpearBox 12s linear',
                 'swipeSpear 1.8s linear, moveSpearUp 4.2s 1.8s ease-out,'+
                 'moveSpearDown 6s 6s ease-in', true);
                this.bgAnimation(true);
              } 
          }
         }, 3000);   
         container.onclick = ()=>{
          if(this.phase === 1){
            //console.log('Onclick PRZED 3000ms');
            window.clearTimeout(this.throwTimeout);
            this.throwTimeout = 0;
            this.spearAnimation(undefined, undefined, false);
            this.phase = 0;
          }
         }
        },5000);
      container.onclick = ()=>{
        if(this.delayTimeout){
          window.clearTimeout(this.delayTimeout);
          this.delayTimeout = 0;
        }
      };
     }
    });

    container.addEventListener('mouseleave',()=>{
      if(this.phase === 1 || this.phase === 2){
       this.phase = 0;
       this.spearAnimation(undefined, undefined, false);
       if(this.throwTimeout) window.clearTimeout(this.throwTimeout);
      }
      if(this.delayTimeout) window.clearTimeout(this.delayTimeout);
    });
  }
  

}
