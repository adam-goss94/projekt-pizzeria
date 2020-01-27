import{ select, templates, settings, classNames} from '../settings.js';
import AmountWidget from './AmountWidget.js';
import DatePicker from './DatePicker.js';
import HourPicker from './HourPicker.js';
import utils from '../utils.js';

class Booking{
  constructor(bookingElem){
    const thisBooking = this;

    thisBooking.render(bookingElem);
    thisBooking.initWidgets();
    thisBooking.getData();
    
  }

  getData(){
    const thisBooking = this;

    const startDateParam = settings.db.dateStartParamKey + '=' + utils.dateToStr(thisBooking.datePicker.minDate);
    const endDateParam = settings.db.dateEndParamKey + '=' + utils.dateToStr(thisBooking.datePicker.maxDate);

    const params = {
      booking: [
        startDateParam,
        endDateParam,
      ],
      eventsCurrent: [
        settings.db.notRepeatParam,
        startDateParam,
        endDateParam,
      ],
      eventsRepeat: [
        settings.db.repeatParam,
        endDateParam,
      ],
    };

    //console.log('getData params: ', params);

    const urls = {
      booking:       settings.db.url + '/' + settings.db.booking   
                                     + '?' + params.booking.join('&'),
      eventsCurrent: settings.db.url + '/' + settings.db.event 
                                     + '?' + params.eventsCurrent.join('&'),
      eventsRepeat:  settings.db.url + '/' + settings.db.event   
                                     + '?' + params.eventsRepeat.join('&'),
    };

    //console.log('getData urls: ', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ]).then(function(allResponses){
      const bookingsResonse = allResponses[0];
      const eventsCurrentResonse = allResponses[1];
      const eventsRepeatResonse = allResponses[2];
      return Promise.all([
        bookingsResonse.json(),
        eventsCurrentResonse.json(),
        eventsRepeatResonse.json(),
      ]);
    }).then(function([bookings, eventsCurrent, eventsRepeat]){
      /* console.log(bookings);
      console.log(eventsCurrent);
      console.log(eventsRepeat); */
      thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
    }).catch(function(error){
      console.log('CONNECTION ERROR', error);
    });
  }
  
  parseData(bookings, eventsCurrent, eventsRepeat){
    const thisBooking = this;
    thisBooking.booked = {};

    for(let item of bookings){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    
    for(let item of eventsCurrent){
      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }
    
    const minDate = thisBooking.datePicker.minDate;
    const maxDate = thisBooking.datePicker.maxDate;

    for(let item of eventsRepeat){
      if(item.repeat == 'daily'){
        for(let loopDate = minDate; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)){
          thisBooking.makeBooked(utils.dateToStr(loopDate), item.hour, item.duration, item.table);
        }
      }
    }
    //console.log('thisBookin.booked: ', thisBooking.booked);
    thisBooking.updateDOM();
  }

  makeBooked(date, hour, duration, table){
    const thisBooking = this;

    if(typeof thisBooking.booked[date] == 'undefined'){
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for(let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5){
      if(typeof thisBooking.booked[date][hourBlock] == 'undefined'){
        thisBooking.booked[date][hourBlock] = [];
      }
      
      for(let tab of table){
        thisBooking.booked[date][hourBlock].push(tab);
      }
      
    }
  }

  updateDOM(){
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if(
      typeof thisBooking.booked[thisBooking.date] == 'undefined'
      ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ){
      allAvailable = true;
    }

    for(let table of thisBooking.dom.tables){
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      
      if(!isNaN(tableId)){
        tableId = parseInt(tableId);
      }

      if(
        !allAvailable 
        &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ){
        table.classList.add(classNames.booking.tableBooked);
      } else{
        table.classList.remove(classNames.booking.tableBooked);
      }
    }
  }

  render(bookingElem){
    const thisBooking = this;
    const generatedHTML = templates.bookingWidget();
    thisBooking.dom = {};

    thisBooking.dom.wrapper = bookingElem;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;

    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);   
    thisBooking.dom.formSubmit = thisBooking.dom.wrapper.querySelector(select.booking.submit);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters); 
  }

  initWidgets(){
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);

    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    
    thisBooking.dom.wrapper.addEventListener('updated', function(){
      thisBooking.updateDOM();      
    });   

    thisBooking.dom.wrapper.addEventListener('changeTime', function(){    
      /* Remove selected class from tables when change data */      
      for(let table of thisBooking.dom.tables){
        table.classList.remove(classNames.booking.tableSelected);
      }  
      thisBooking.updateDOM();    
    });

    /* Add event listener to clicked tables */
    for(let table of thisBooking.dom.tables){
      table.addEventListener('click', function(){
        if(this.classList.contains(classNames.booking.tableSelected)){
          this.classList.remove(classNames.booking.tableSelected);
        }else{          
          if(!this.classList.contains(classNames.booking.tableBooked)){
            this.classList.add(classNames.booking.tableSelected);
          }
        }
      });
    }
    
    /* Add even listener to submit button */ 
    thisBooking.dom.formSubmit.addEventListener('click', function(event){
      event.preventDefault();
      for(let table of thisBooking.dom.tables){
        if(table.classList.contains(classNames.booking.tableSelected)){
          thisBooking.bookTable();
          thisBooking.peopleAmount.value = settings.amountWidget.defaultValue;
          thisBooking.hoursAmount.value = settings.amountWidget.defaultValue;
          thisBooking.dom.phone.value = '';
          thisBooking.dom.address.value = '';
          break;
        }
      }
      
      
    });
    
  }
  
  bookTable(){
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    
    const payload = {
      date: thisBooking.datePicker.value,
      hour: thisBooking.hourPicker.value,
      table: [],
      duration: thisBooking.hoursAmount.value,
      ppl: thisBooking.peopleAmount.value,
      starters: [],
      address: thisBooking.dom.address.value,
      phone: thisBooking.dom.phone.value,
    };

    for(let tab of thisBooking.dom.tables){
      if(tab.classList.contains(classNames.booking.tableSelected)){
        let tabId = tab.getAttribute('data-table');
        
        if(!isNaN(tabId)){
          tabId = parseInt(tabId);
        }
        
        payload.table.push(tabId);
        tab.classList.add(classNames.booking.tableBooked);
        tab.classList.toggle(classNames.booking.tableSelected);        
      }
    }

    for(let starter of thisBooking.dom.starters){
      if (starter.checked == true){
        payload.starters.push(starter.value);
      }
    }
    // eslint-disable-next-line no-unused-vars
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response){
        if(response.status >= 200 && response.status < 300){
          return response.json();
        }else{
          return Promise.reject(response.status + ' ' + response.statusText);
        }
      // eslint-disable-next-line no-unused-vars
      }).then(function(parsedResponse){
        //console.log('parsedResponse: ', parsedResponse);
        thisBooking.getData();
        
        
      }).catch(function(error){
        console.log('CONNECTION ERROR', error);
      });

    
    
  }

}
export default Booking;