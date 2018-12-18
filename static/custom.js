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
              <div class="chat-message col-md-20 offset-md-17 bot-message">
                  <h2> Your Top ${data.rows} Products</h2>
                  <table class="w3-table col-md-12" id="product-table">
                      <tr class="col-md-12">
                          
                          <th class="col-md-2"> Name</th>
                          <th class="col-md-2"> description</th>
                          <th class="col-md-2"> sale_price</th>
                          <th class="col-md-2"> list_price</th>
                          <th class="col-md-2"> Reviews</th>
                      </tr>
                  </table>
              </div>
            `)

          $('#product-table').append(
            $.map(data.products, function(row, i) {
              return (
                '<tr>' +
                  // was product ID column here
                  '<td>' + data.products[i].name_title + '</td>' +
                  '<td>' + data.products[i].description + '</td>' +
                  '<td>' + data.products[i].sale_price + '</td>' +
                  '<td>' + data.products[i].list_price + '</td>' +
                  // TODO input box here
                  // '<td>' + 'Quantity: ' + '<input>' + '</td>' +
                  '<td>' + data.products[i].Reviews.substring(0,50) + '</td>' +                  

                '</tr>'
              )})
          )

          // This is the logic for when the table of products is submitted, it will return
          // a product id and qty inputted as JSON object, for now it is just console logging it
          $("form").submit(function( event ) {               
            console.log($(this).serializeArray());
            alert('Thank you for placing your order');
            event.preventDefault();   
          });  
          
      }
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