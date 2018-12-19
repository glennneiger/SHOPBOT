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

    // This should scroll to bottom of chat-container each time a message is submitted
    // (user and bot both call this?? or need this in other places too...

    $.post( "/send_message", {
        message: message,
        socketId: pusher.connection.socket_id
    }, handle_response);

    function handle_response(data) {
      // append the bot repsonse to the div
      console.log(data.message)
      //var obj = JSON.parse(data.message);
      if(data.call=='notwebhook') {
            $('.chat-container').append(`
                <div class="chat-message col-md-5 offset-md-7 bot-message">
                    ${data.message}
                </div>
            `)
            $('.chat-container').scrollTop($('.chat-container')[0].scrollHeight);

      } else {
          //var obj = JSON.parse(data.message);
          $('.chat-container').append(`
            <form>
                <div class="chat-message col-md-20 offset-md-17 bot-message" style="width: 100%;">
                    <h2> Your Top ${data.rows} Products</h2>
                    <table class="table table-sm table-responsive table-bordered table-striped table-hover" id="product-table">
                        <thead>
                            <tr class="col-md-12">                          
                                <th class="col-md-2">Name</th>
                                <th class="col-md-2">Description</th>
                                <th class="col-md-2">Sale_price</th>
                                <th class="col-md-2">List_price</th>
                                <th class="col-md-2" style="min-width: 150px;">Reviews</th>
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
            $.map(data.products, function(row, i) {
              return (                
                '<tr class="col-md-12">' +
                  // was product ID column here
                  '<td class="col-md-2">' + data.products[i].name_title + '</td>' +
                  '<td class="col-md-2">' + data.products[i].description + '</td>' +
                  '<td class="col-md-2">' + data.products[i].sale_price + '</td>' +
                  '<td class="col-md-2">' + data.products[i].list_price + '</td>' +                  
                  '<td class="col-md-2">' + data.products[i].Reviews.substring(0,50) + '</td>' +    
                  // Qty input box
                  '<td class="col-md-2">' + 
                    '<input type="number" name="' + data.products[i].product_num + '" min="0" max="99" placeholder="0" />' +                       
                  '</td>' + 
                '</tr>'                 
              )})
          )

          // This is the logic for when the table of products is submitted, it will return
          // a product id and qty inputted as JSON object, for now it is just console logging it
          $("form").submit(function( event ) {
            event.preventDefault();   
            var $data = $(this).serializeArray()
            
            // post form data as serialized array to another url to save the order
            $.post( "/save_order_orsomething", {
              data: $data,
              socketId: pusher.connection.socket_id // do we need this?
            }, function() {
              // TODO some logic here either in front or back to return total price from quantity of selected rows
              $('.chat-container').append(`
                <div class="chat-message col-md-20 offset-md-17 bot-message">
                  Thank you for your order. Here is your order summary:
                  /////Some Table////
                  shows items and order total
                </div>
              `)
            });           

            console.log($data);
            alert('Thank you for placing your order');
            
          });  

          // Here is where we can returned serialized array?
          //return $(this).serializeArray();
          
      } // end of else for bot reply

      // remove the loading indicator
      $( "#loading" ).remove();

      
    }
}





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