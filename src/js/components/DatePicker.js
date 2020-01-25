/* global flatpickr */

import BaseWidget from './BaseWidget.js';
import utils from '../utils.js';
import {select, settings} from '../settings.js';

class DatePicker extends BaseWidget{
  constructor(wrapper){
    super(wrapper, utils.dateToStr(new Date()));
    
    const thisWidget = this;
    
    thisWidget.dom.input = thisWidget.dom.wrapper.querySelector(select.widgets.datePicker.input);
    
    thisWidget.initPlugin();
  }

  initPlugin(){
    const thisWidget = this;

    thisWidget.minDate = new Date(thisWidget.value);
    thisWidget.maxDate = utils.addDays(thisWidget.minDate, settings.datePicker.maxDaysInFuture);

    flatpickr(thisWidget.dom.input, {
      defaultDate: thisWidget.minDate,
      minDate: thisWidget.minDate,
      maxDate: thisWidget.maxDate,
      'disable': [
        function(date) {
          return (date.getDay() === 1);

        }
      ],
      'locale': {
        'firstDayOfWeek': 1
      },
      onChange: function(dateStr){
        function convert(str) {
          const date = new Date(str),
            mnth = ('0' + (date.getMonth() + 1)).slice(-2),
            day = ('0' + date.getDate()).slice(-2);
          return [date.getFullYear(), mnth, day].join('-');
        }
        
        thisWidget.value = convert(dateStr);
      },
    });
  }

  parseValue(value){
    return value;
  }
  
  isValid(){
    return true;
  }

  renderValue(){

  }
  
  announce(){
    const thisWidget = this;

    const event = new CustomEvent('changeTime', {
      bubbles: true
    });

    thisWidget.dom.wrapper.dispatchEvent(event);
  }
}

export default DatePicker;