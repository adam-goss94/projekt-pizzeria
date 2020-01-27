import {select, templates } from '../settings.js';

class HomePage{
  constructor(homeElem){
    const thisHome = this;

    thisHome.render(homeElem);
    thisHome.initActions();
  }

  render(homeElem){
    const thisHome = this;
    const generatedHTML = templates.homePage();

    thisHome.dom = {};

    thisHome.dom.wrapper = homeElem;
    thisHome.dom.wrapper.innerHTML = generatedHTML;
  }


  initActions(){
    const thisHome = this;
    thisHome.buttons = thisHome.dom.wrapper.querySelectorAll(select.home.buttons);

    for(let button of thisHome.buttons){
      button.addEventListener('click', function(){
        const event = new CustomEvent('buttonClicked', {
          bubbles: true
        });      
        this.dispatchEvent(event);
      });
    }
    
    
  }
}

export default HomePage;