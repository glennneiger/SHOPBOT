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
    $('.chat-container').scrollTop($('.chat-container')[0].scrollHeight);

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

      } else {
          //var obj = JSON.parse(data.message);
          $('.chat-container').append(`
              <form>
                  <div class="chat-message col-md-20 offset-md-17 bot-message">
                      <h2> Your Top ${data.rows} Products</h2>
                      <table class="w3-table col-md-12" id="product-table">
                          <tr class="col-md-12">
                              <th class="col-md-2"> Product_num</th>
                              <th class="col-md-2"> Name</th>
                              <th class="col-md-2"> description</th>
                              <th class="col-md-2"> sale_price</th>
                              <th class="col-md-2"> list_price</th>
                              <th class="col-md-2"> Reviews</th>
                              <th class="col-md-2"> Quantity</th>
                          </tr>
                      </table>
                  </div>
//                  <div>
//                    <input type="submit" value="Submit" >
//                  </div>
              </form>
            `)

          $('#product-table').append(
            $.map(data.products, function(row, i) {
              return (
                '<tr>' +
                  '<td>' + data.products[i].product_id + '</td>' +
                  '<td>' + data.products[i].name_title + '</td>' +
                  '<td>' + data.products[i].description + '</td>' +
                  '<td>' + data.products[i].sale_price + '</td>' +
                  '<td>' + data.products[i].list_price + '</td>' +
                  '<td>' + data.products[i].Reviews.substring(0,50) + '</td>' +

                  // TODO input box here
                  '<td>' +
                    '<input type="text" name="' + data.products[i].product_id + '" minlength="1" maxlength="2" size="1" />' +
                  '</td>' +

                  /*
                  <td> ${data['products'][i]['name_title']}</td> +
                  <td> ${data['products'][i]['description']}</td> +
                  <td> ${data['products'][i]['sale_price']}</td> +
                  <td> ${data['products'][i]['list_price']}</td> +
                  <td> ${data['products'][i]['Reviews'.substring(0,50)]}</td> +
                  */

                '</tr>'

              )})
          )
          $("form").submit(function( event ) {
            console.log($(this).serializeArray());
            alert('Thank you for placing your order');
            event.preventDefault();
          });

          //             $i = 1
          //             while ($i < ${data.rows})
          //             {
          //             <tr>
          //                 <td> product-1</td>
          //                 <td> ${data['products']['1']['name_title']}</td>
          //                 <td> ${data['products']['1']['description']}</td>
          //                 <td> ${data['products']['1']['sale_price']}</td>
          //                 <td> ${data['products']['1']['list_price']}</td>
          //                 <td> ${data['products']['1']['Reviews']}</td>
          //             </tr>
          //             $i++
          //             }
          //         </table>
          //     </div>
          // `)
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