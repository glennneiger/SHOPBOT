# /index.py

from flask import Flask, request, jsonify, render_template
import os
import dialogflow
import requests
import json
import pusher
import pypyodbc
import hashlib
pusher_client = pusher.Pusher(
        app_id=os.getenv('PUSHER_APP_ID'),
        key=os.getenv('PUSHER_KEY'),
        secret=os.getenv('PUSHER_SECRET'),
        cluster=os.getenv('PUSHER_CLUSTER'),
        ssl=True)

app = Flask(__name__)


@app.route('/')
def index():
    return render_template('index.html')

# @app.route('/get_movie_detail', methods=['POST'])
# def get_movie_detail():
#     data = request.get_json(silent=True)
#     movie = data['queryResult']['parameters']['movie']
#     api_key = os.getenv('OMDB_API_KEY')
#
#     movie_detail = requests.get('http://www.omdbapi.com/?t={0}&apikey={1}'.format(movie, api_key)).content
#     movie_detail = json.loads(movie_detail)
#     response =  """
#         Title : {0}
#         Released: {1}
#         Actors: {2}
#         Plot: {3}
#     """.format(movie_detail['Title'], movie_detail['Released'], movie_detail['Actors'], movie_detail['Plot'])
#
#     reply = {
#         "fulfillmentText": response,
#     }
#
#     return jsonify(reply)


@app.route('/get_product_detail', methods=['POST'])
def get_product_detail():


    #getting the request from dialogflow
    data = request.get_json(silent=True)
    print(data)
    #data.get("result").get("action") == "productQuery"

    if  data['queryResult']['action'] == "productQuery":


    #if bool(set(list(data['queryResult']['parameters'].keys())) & set(['ProductCategory','userCategory','Product-type'])):

        product_category = data['queryResult']['parameters']['ProductCategory']
        user_category = data['queryResult']['parameters']['userCategory']
        product_type = data['queryResult']['parameters']['Product-type']
        print(product_category,user_category,product_type)



# #------API CALL TO SQL SERVER----------------
        global product_summary
        # python-sql connect is working
        product_summary = python_sql(product_category,user_category , product_type )
        global product_new
        product_new = {'1': {}}
        column_names = ['name_title', 'description', ' sale_price', 'list_price', 'Reviews']
        print(product_summary[1][1])

        try:
            for i, v in enumerate(column_names,0):
                product_new['1'][v] = product_summary[1][i]

            print(product_new)

        except:
            print("WHAT THE FUCK")


        response =  """
            You have chosen: {0},
            Here are the products  : {1}
            """.format(product_category, product_summary)
        #response = product_summary
        reply = {
        "fulfillmentText": response
        }

        return jsonify(reply)

    elif data['queryResult']['action'] == "purchase":
        product_num = int(data['queryResult']['parameters']['order_summary'])
        response = """
        Here is your order summary: {0}
        """.format( product_summary[product_num])

        reply = {
            "fulfillmentText": response
        }

        return jsonify(reply)

    

def intent_hash(x):
    str= x
    result = hashlib.md5(str.encode())
    return result.hexdigest()

#CALLING THE INFO FROM THE SQL SERVER
def python_sql(x,y,z):
    """
    
    :param x: intent name
    :return: information about the product
    """
    #hash_output = intent_hash(x)
    connection = pypyodbc.connect(DRIVER= '{SQL Server}', SERVER = 'LAPTOP-1U1BRRQD\REVANTHSQL', DATABASE='RETAIL_DB', trusted_connection='yes')
    cursor = connection.cursor()
    SQLCommand = (" SELECT TOP 5 * FROM ( SELECT name_title, description , sale_price,list_price, Reviews FROM JCPENNY WHERE Product_Category = ?  AND User_Type = ?  AND Product_Type = ?) T ORDER BY list_price DESC"  )
    #SQLCommand = ("SELECT AVG(list_price) FROM JCPENNY WHERE Product_Category = ?")



    Values = [x,y,z]
    cursor.execute(SQLCommand, Values)
    #result = cursor.fetchone()
    products = {}

    i=1
    for row in cursor.fetchall():
        products[i] = row
        i+=1
    return products

# USER SUBMITS A MESSAGE, MESSAGE WILL BE SENT TO DIALOGFLOW TO DETECT THE
#INTENT OF THE USER. DIALOGFLOW WILL PROCESS THE TEXT, THEN SEND BACK A
#FULFILLMENT RESPONSE

def detect_intent_texts(project_id, session_id, text, language_code):
    """

    :param project_id:
    :param session_id:
    :param text: USER INPUT
    :param language_code:
    :return:
    """
    session_client = dialogflow.SessionsClient()
    session = session_client.session_path(project_id, session_id)

    if text:
        text_input = dialogflow.types.TextInput(
            text=text, language_code=language_code)
        query_input = dialogflow.types.QueryInput(text=text_input)
        response = session_client.detect_intent(
            session=session, query_input=query_input)

        #print(response)

        return response.query_result.fulfillment_text

@app.route('/send_message', methods=['POST'])
def send_message():
    message = request.form['message']
    project_id = os.getenv('DIALOGFLOW_PROJECT_ID')
    fulfillment_text = detect_intent_texts(project_id, "unique", message, 'en')
    #fulfillment_text = json.loads(fulfillment_text)
    print(fulfillment_text)

    if "You have chosen" in fulfillment_text:
        print(product_summary)
        #print(product_summary[1].split(','))
        print(type(product_summary[1]))
        print(product_summary[1][0])


        response_text = { "message":  fulfillment_text, "call" : "webhook", "products" : product_new,"rows":len(product_new) }


    else:
        response_text = {"message": fulfillment_text,"call":"notwebhook"}

    #response_text = {"message": fulfillment_text}
    socketId = request.form['socketId']
    pusher_client.trigger('RETAIL_BOT', 'new_message',
                          {'human_message': message, 'bot_message': fulfillment_text},
                          socketId)
    return jsonify(response_text)


# run Flask app
if __name__ == "__main__":
    app.run()

