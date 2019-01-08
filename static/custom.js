/**
 * eric-ui branch
 */

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


//submit_mess@ge will be invoked once the user submits the message
function submit_message(message) {
  
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

      // Variable for time formatting
      var orderDateTime = moment().format('MMMM Do YYYY, h:mm:ssA');      

      var table_summary = (data.run).toString(); // integer of each table as string
      var newArr = data['products'];
      var tableId = "summary-table-" + table_summary; // dynamic id of summary table
      //var rowId = "row" + table_summary; // dynamic id of each row      

      console.log('summary was hit');
      console.log("summary-table"+table_summary);

      // Order Summary Table
      $('.chat-container').append(`
        <div class="chat-message col-md-20 offset-md-17 bot-message" style="width: 100%;">
          <h3>Ordered by: ${data.name}</h3>
          <h5 id="order-date"+${table_summary}>Ordered on: ${orderDateTime}</h5>
          <table class="table table-sm table-responsive table-bordered table-striped table-hover" id="${tableId}">
            <thead>
              <tr class="col-md" >
                <th class="col-md">Name</th>
                <th class="col-md" >Each</th>
                <th class="col-md" >Quantity</th>
                <th class="col-md" >Total</th>
              </tr>
            </thead>
          </table>
          <div id="totals-container-${table_summary}" class="container">
            <div class="row justify-content-end">
              <div id="subtotal-${table_summary}" class="col-4">
                Subtotal: 
              </div>
            </div>
            <div class="row justify-content-end">
              <div id="tax-${table_summary}" class="col-4">
                Tax:
              </div>
            </div>
            <div class="row justify-content-end">
              <div id="total-${table_summary}" class="col-4">
                Total:
              </div>
            </div>
          </div>
        </div>
      `);

      // appending items with template literal format above
      for (let i = 0; i < newArr.length; i++) {
        // $("#" + table_summary).append(`
        $(`#${tableId}`).append(`
          <tr class="col-md" id="row-${i + 1}">
            <td class="col-md" id="name">${newArr[i].name_title}</td>
            <td class="col-md" id="each">${newArr[i].list_price}</td>
            <td class="col-md" id="qnty">${newArr[i].quantity}</td>
            <td class="col-md" id="total">${newArr[i].price}</td>
          </tr>          
        `);
      }

      // Scroll to bottom after reply
      $('.chat-container').scrollTop($('.chat-container')[0].scrollHeight);

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