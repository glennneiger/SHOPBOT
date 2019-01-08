// Initialise Pusher
const pusher = new Pusher('b1e2e0c00db08804007a', {
  cluster: 'us2',
  encrypted: true
});

// Subscribe to RETAIL_BOT channel
const channel = pusher.subscribe('RETAIL_BOT');

// bind new_message event to RETAIL_BOT channel
channel.bind('new_message', function(data) {
 // Append human message
  $('.chat-container').append(`
      <div class="chat-message col-md-5 human-message">
          ${input_message}
      </div>
  `)

  // Append bot message
  $('.chat-container').append(`
      <div class="chat-message col-md-5 offset-md-7 bot-message">
          //${data.message}
      </div>
  `)
});


//submit_message will be invoked once the user submits the message
function submit_message(message) {

    // This should scroll to bottom of chat-container each time a message is submitted
    // (user and bot both call this?? or need this in other places too...
    console.log(typeof message);
    $.post( "/send_message", {
        message: message,
        socketId: pusher.connection.socket_id
    }, handle_response);

    function handle_response(data) {
      // append the bot repsonse to the div
      console.log(data.message)
      //var obj = JSON.parse(data.message);
      if (data.call == 'notwebhook') {
          console.log('notwebhook was hit');
          $('.chat-container').append(`

              <div class="chat-message col-md-5 offset-md-7 bot-message">
                  ${data.message}
              </div>
          `)

          // Scroll to bottom after reply
          $('.chat-container').scrollTop($('.chat-container')[0].scrollHeight);
      }

      else if (data.call == 'summary') {

        console.log('summary was hit');

        var table_summary =  (data.run).toString();
        var varid = "summary-table"+table_summary
        console.log("summary-table"+table_summary)
        // Order Summary Table
        $('.chat-container').append(`

        <div class="chat-message col-md-20 offset-md-17 bot-message" style="width: 100%;">
          <h3>Ordered by: ${data.name}</h3>
          <h5 id="order-date"+${table_summary}>Ordered on: </h5>
          <table class="table table-sm table-responsive table-bordered table-striped table-hover" id="${table_summary}" >
            <thead>
              <tr class="col-md" >
                <th class="col-md">Name</th>
                <th class="col-md" >Each</th>
                <th class="col-md" >Quantity</th>
                <th class="col-md" >Total</th>
              </tr>
            </thead>
          </table>
          
          <div id="totals-container"${table_summary} class="container">
            <div class="row justify-content-end">
              <div id="subtotal${table_summary}" class="col-4">
                Subtotal:
              </div>
            </div>
            <div class="row justify-content-end">
              <div id="tax"${table_summary} class="col-4">
                Tax:
              </div>
            </div>
            <div class="row justify-content-end">
              <div id="total"${table_summary} class="col-4">
                Total:
              </div>
            </div>
          </div>
        </div>
        `)


      //console.log(data['products'].slice(1));

      //var newArr = data['products'].slice(1);

      /*
      $('#summary-table'+table_summary.append(
        $.map(newArr, function(row, i) {
          return (
            '<tr class="col-md">' +
              '<td class="col-md">' + newArr[i].name_title + '</td>' + // Name
              '<td class="col-md">' + newArr[i].list_price + '</td>' + // Each
              '<td class="col-md">' + newArr[i].quantity + '</td>' + // Quantity
              '<td class="col-md">' + newArr[i].price + '</td>' + // Total (of one product * qty)
            '</tr>'
          )})
      )
      */

      var newArr = data['products'];
      for (let i = 0; i < newArr.length; i++) {
      console.log('#summary-table'+table_summary);
      //console.log(' + table_summary + ' );
      //var panelId = $(this).attr
        $("#"+table_summary).append(
            '<tr class="col-md" id="row' + table_summary + '">' +
              '<td class="col-md" id="name'+ table_summary + '">' + newArr[i].name_title + '</td>' + // Name
              '<td class="col-md" id="each'+ table_summary + '">' + newArr[i].list_price + '</td>' + // Each
              '<td class="col-md" id="qnty'+ table_summary + '">' + newArr[i].quantity + '</td>' + // Quantity
              '<td class="col-md" id="total'+ table_summary + '">' + newArr[i].price + '</td>' + // Total (of one product * qty)
            '</tr>'

        )
      }


      // Scroll to bottom after reply
      $('.chat-container').scrollTop($('.chat-container')[0].scrollHeight);

      /******************************************
       * Logic for the order summary functions
       ******************************************/
      // tax and totalling

      
      var TaxRate = 0.1;
      var subTotal = grabPriceValues();
      var tax = calculateTax();

      // grabs prices from order-summary table and adds them up
      function grabPriceValues() {
        console.log("summary-table"+table_summary);
        var x = "summary-table"+table_summary
        console.log(typeof x);


        var table = document.getElementById(x).value;
        console.log(table);
        var sumVal = 0;
        // starts at one because its counting header row
        for(var i = 1; i < table.rows.length; i++) {
          sumVal = sumVal + parseFloat(table.rows[i].cells[3].innerHTML);
        }
        return sumVal;
      }

      // calculates tax based on subtotal
      function calculateTax() {
        return ((subTotal * TaxRate));
      }

      $('#subtotal'+table_summary).append(subTotal);
      $('#tax'+table_summary).append(tax);
      $('#total'+table_summary).append((subTotal + tax));

      // Time function
      var d = new Date();
      var curr_hour = d.getHours();
      var a_p = (curr_hour == 12) ? "AM" : "PM";

      if (curr_hour == 0) curr_hour = 12;
      if (curr_hour > 12) curr_hour = curr_hour - 12;

      // toString() to concatenate the 0 if length == 1
      var curr_min = d.getMinutes().toString();

      if (curr_min.length == 1) {
        curr_min = '0' + curr_min;
      }

      $('#order-date'+table_summary).append(
        d.getMonth()+1 + '/' + d.getDate() + '/' + d.getFullYear() + ' at ' + curr_hour + ':' + curr_min + a_p
      );
      

          // post form data as serialized array to another url to save the order
          $.post( "/order_summary", {
            message: selectedProducts
            //socketId: pusher.connection.socket_id // do we need this?
          }, handle_response_new);


      } else {
          //var obj = JSON.parse(data.message);
          console.log('prod table/last else was hit');
          $('.chat-container').append(`
            <form id="myform">
                <div class="chat-message col-md-20 offset-md-17 bot-message" style="width: 100%;">
                    <h2> Your Top ${data.rows} Products</h2>
                    <table class="table table-sm table-responsive table-bordered table-striped table-hover" id="product-table">
                        <thead>
                            <tr class="col-md-12">
                                <th class="col-md">Name</th>
                                <th class="col-md">Description</th>
                                <th class="col-md">Sale_price</th>
                                <th class="col-md">List_price</th>
                                <th class="col-md" style="min-width: 150px;">Reviews</th>
                                <th class="col-md">Quantity</th>
                            </tr>
                        </thead>
                    </table>
                    <div class="container">
                      <div class="row">
                        <div class="col-8">
                          <p>Scroll right to enter quantity</p>
                        </div>
                        <div class="col-4">
                          <input id="order-btn" class="btn-success" type="submit" value="Place Order">
                        </div>
                      </div>
                    </div>
                </div>
            </form>
          `)

          $('#product-table').append(
            $.map(data['products'], function(row, i) {
              return (
                '<tr class="col-md-12">' +
                  // was product ID column here
                  '<td class="col-md">' + data.products[i].name_title + '</td>' +
                  '<td class="col-md">' + data.products[i].description + '</td>' +
                  '<td class="col-md">' + data.products[i].sale_price + '</td>' +
                  '<td class="col-md">' + data.products[i].list_price + '</td>' +
                  '<td class="col-md">' + data.products[i].Reviews + '</td>' +
                  // Qty input box
                  '<td class="col-md">' +
                    '<input type="number" name="' + data.products[i].product_id + '" min="0" max="99" placeholder="0" />' +
                  '</td>' +
                '</tr>'
              )})
          );

          // Scroll to bottom after reply
          $('.chat-container').scrollTop($('.chat-container')[0].scrollHeight);

          // This is the logic for when the table of products is submitted, it will return
          // a product id and qty inputted as JSON object, for now it is just console logging it
          $("#myform").submit(function( event ) {
            event.preventDefault();
            var data = $(this).serializeArray();
            var selectedProducts = [];

            // goes through each product in list and if they have a quantity (element.value)
            // append it to list of purchased products to be sent in post
            data.forEach(element => {
              if (element.value === '' || element.value === '0') {
                //console.log('you got 0 value');
              } else {
                selectedProducts.push(element);
              }
            });

            // convert selected products to json string or else you'll get error
            selectedProducts = JSON.stringify(selectedProducts);

            // post form data as serialized array to another url to save the order
            $.post( "/order_summary", {
              message: selectedProducts
              //socketId: pusher.connection.socket_id // do we need this?
            }, handle_response_new);

            function handle_response_new(data) {

              $('.chat-container').append(`
                <div class="chat-message col-md-5 offset-md-7 bot-message">
                    ${data.message}
                </div>
              `)
            };

            console.log(data);
          });

          // Here is where we can returned serialized array?
          //return $(this).serializeArray();

      } // end of else for bot reply

      // remove the loading indicator
      $( "#loading" ).remove();

    } // end of handle_response

} // end of submit_message

$('#target').on('submit', function(e){
    e.preventDefault();
    const input_message = $('#input_message').val()
    // return if the user does not enter any text
    if (!input_message) {
      return
    }

    $('.chat-container').append(`
        <div class="chat-message col-md-5 human-message">
            ${input_message}
        </div>
    `)

    // loading
    $('.chat-container').append(`
        <div class="chat-message text-center col-md-12 bot-message" id="loading">
            <b>...</b>
        </div>
    `)

    // clear the text input
    $('#input_message').val('')

    // send the message
    submit_message(input_message)
});