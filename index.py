# /index.py

from flask import Flask, request, jsonify, render_template
from functools import wraps
import os
import dialogflow
import requests
import json
import pusher
import pypyodbc
import hashlib
import random
pusher_client = pusher.Pusher(
        app_id=os.getenv('PUSHER_APP_ID'),
        key=os.getenv('PUSHER_KEY'),
        secret=os.getenv('PUSHER_SECRET'),
        cluster=os.getenv('PUSHER_CLUSTER'),
        ssl=True)

app = Flask(__name__)
global user_id_dict, cart, run, orderID,summary_run,product_table_run
user_id_dict = {}
cart={}
run = 0
summary_run = 0
product_table_run = 0

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/get_product_detail', methods=['POST'])
def get_product_detail():


    #getting the request from dialogflow
    data = request.get_json(silent=True)
    #print(data)
    #data.get("result").get("action") == "productQuery"

    if data['queryResult']['action'] == "WelcomeIntent":
        global name
        name = data['queryResult']['parameters']['given-name']
        phone_num = data['queryResult']['parameters']['phone-number']
        email_id = data['queryResult']['parameters']['email']

        ################################################################################
        ##check if this user has already a user- id
        ###############################################################################

        sql_user_info(name, phone_num, email_id)

        response = """
                    What can I do for you today?  Do you need product information or place an order
                    """
        # response = product_summary
        reply = {
            "fulfillmentText": response
        }

        return jsonify(reply)


    elif  data['queryResult']['action'] == "productQuery":
        # name, phone-num ,email of the user




    #if bool(set(list(data['queryResult']['parameters'].keys())) & set(['ProductCategory','userCategory','Product-type'])):

        product_category = data['queryResult']['parameters']['ProductCategory']
        user_category = data['queryResult']['parameters']['userCategory']
        product_type = data['queryResult']['parameters']['Product-type']

        print(product_category,user_category,product_type)

# #------API CALL TO SQL SERVER----------------
        global product_summary
        # python-sql connect is working
        product_summary = sql_product_info(product_category,user_category , product_type )
        global product_new
        product_new={}
        global products_list
        products_list = []

        column_names = ['product_id','name_title', 'description', ' sale_price', 'list_price', 'Reviews']
        #print(product_summary[1][1])

        try:
            for k, val in product_summary.items():
                product_new[str(k)]={}
                for i, v in enumerate(column_names,0):
                    product_new[str(k)][v] = product_summary[k][i]


            #print(product_new)

        except:

           print("WHAT THE FUCK")

        ######################################################################################################################
        # will convert a big json object to list of json objects.
        for k,v in product_new.items():
            #l = {}; l[k]=v
            products_list.append(v)
        print('my product list is {}, type is {}'.format(products_list, type(products_list)))
        ######################################################################################################################


        response =  """
            You have chosen: {0},
            Here are the products  : {1}
            """.format(product_category, product_summary)
        #response = product_summary
        reply = {
        "fulfillmentText": response
        }

        return jsonify(reply)

    elif data['queryResult']['action'] == "order_summary":

        #product_num = int(data['queryResult']['parameters']['order_summary'])
        global order_summary_new
        # python-sql connect is working
        order_summary_new = user_order_summary()
        global summary_new
        summary_new = {}
        global summary_list
        summary_list = []

        #adding the name of the user as a json object to summary_list
        #name_user = {'name':name}
        #summary_list.append(name_user)

        column_names_summary = ['name_title', 'quantity', 'list_price', 'price']
        # print(product_summary[1][1])

        try:
            for k, val in order_summary_new.items():
                summary_new[str(k)] = {}
                for i, v in enumerate(column_names_summary, 0):
                    summary_new[str(k)][v] = order_summary_new[k][i]

            #print(summary_new)

        except:

            print("WHAT THE FUCK")

        ######################################################################################################################
        # will convert a big json object to list of json objects.
        for k, v in summary_new.items():
            # l = {}; l[k]=v
            summary_list.append(v)

        #adding name of the user to the json object.
        print('my summary list is {}, type is {}'.format(summary_list, type(summary_list)))
        ######################################################################################################################

        response = """
        Here is your order summary: {0}
        """.format(summary_list)

        reply = {
            "fulfillmentText": response
        }

        return jsonify(reply)

# decorator function which can be used by any function----------------change 1
def run_once(function):

    def wrapper(*args,**kwargs):
        print("wrapper ran this before calling ")
        return function(*args,**kwargs)
    wrapper.has_run = False
    return wrapper
#################################################################################
def intent_hash(x):
    str= x
    result = hashlib.md5(str.encode())
    return result.hexdigest()

#CALLING THE INFO FROM THE SQL SERVER
def sql_product_info(x,y,z):
    """
    
    :param x: intent name
    :return: information about the product
    """
    #hash_output = intent_hash(x)
    global product_table_run
    product_table_run+=1

    connection = pypyodbc.connect(DRIVER= '{SQL Server}', SERVER = 'LAPTOP-1U1BRRQD\REVANTHSQL', DATABASE='RETAIL_DB', trusted_connection='yes')
    cursor = connection.cursor()
    SQLCommand = (" SELECT TOP 5 * FROM ( SELECT product_id, name_title, description , sale_price,list_price, Reviews FROM JCPENNY WHERE Product_Category = ?  AND User_Type = ?  AND Product_Type = ?) T ORDER BY list_price DESC"  )
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
#@check_userid
def sql_user_info(name, phone_num, email_id):
    global userID
    userID = str(user_id())
    #print(type(userID))
    phone_num = str(phone_num)
    user_id_dict[userID]  = [name,phone_num,email_id]

    connection = pypyodbc.connect(DRIVER='{SQL Server}', SERVER='LAPTOP-1U1BRRQD\REVANTHSQL', DATABASE='RETAIL_DB',
                                  trusted_connection='yes')
    cursor = connection.cursor()
    SQLCommand = ("INSERT INTO USERINFO (User_id, Name, Email_id,Mobile_num) VALUES (?,?,?,?)")
    Values = [userID,name,phone_num,email_id]
    cursor.execute(SQLCommand,Values)
    connection.commit()
    connection.close()
    return 'done'

############################################################################################################ decorator
def check_userid(sql_user_info):

    @wraps(sql_user_info)
    def wrapper(name,phone_num,email_id):
        if [name,phone_num,email_id] not in user_id_dict.values():
            return sql_user_info(name,phone_num,email_id)
        else:
            return 'user-id is present in the database'
    return wrapper
#####################################################################################################################

def sql_order_summary(userID, product_quantity):
    global run
    if run == 0:
        global orderID
        orderID = str(order_id())
        run+=1
    else:
        orderID = orderID
    connection = pypyodbc.connect(DRIVER='{SQL Server}', SERVER='LAPTOP-1U1BRRQD\REVANTHSQL', DATABASE='RETAIL_DB',
                                  trusted_connection='yes')
    cursor = connection.cursor()
    SQLCommand = ("INSERT INTO ORDER_SUMMARY (ORDER_ID, User_id, PRODUCT_ID, quantity_ordered) VALUES (?,?,?,?)")
    # product_quantity is the one which will be returned from UI
    for i in product_quantity:
        Values = [orderID, userID, i['name'], int(i['value'])]
        cursor.execute(SQLCommand,Values)
    #Values = [orderID, userID, product_quantity['name'], product_quantity['value']]
    #cursor.execute(SQLCommand, Values)
    connection.commit()
    connection.close()

    return 'done'

def user_order_summary():
    global summary_run
    summary_run+=1

    connection = pypyodbc.connect(DRIVER='{SQL Server}', SERVER='LAPTOP-1U1BRRQD\REVANTHSQL', DATABASE='RETAIL_DB',
                                  trusted_connection='yes')
    cursor = connection.cursor()
    SQLCommand = (
        " sp_userOrderSummary ?")
    # SQLCommand = ("SELECT AVG(list_price) FROM JCPENNY WHERE Product_Category = ?")
    global userID
    Values = [str(userID)]
    cursor.execute(SQLCommand, Values)
    # result = cursor.fetchone()
    user_ordersummary = {}

    i = 1
    for row in cursor.fetchall():
        user_ordersummary[i] = row
        i += 1
    return user_ordersummary



def user_id():

    return random.randint(1,1001)#random userid

def order_id():
    return random.randint(1,1001) # random orderid


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


@app.route('/order_summary', methods = ['POST'])
def order_summary():

    order  = request.form['message'] # should have product_id and quantity info in a json object
    order = json.loads(order)
    #global userID


    print(type(order))
    print(order)

    sql_order_summary(userID, order)
    # storing that order info in sql server
    response = {'message': 'Thanks for placing the order, Do you want to order more or see your order summary'}

    return jsonify(response)
    # call sql_order_summary function


@app.route('/send_message', methods=['POST'])
def send_message():
    message = request.form['message']

    project_id = os.getenv('DIALOGFLOW_PROJECT_ID')
    fulfillment_text = detect_intent_texts(project_id, "unique", message, 'en')
    #fulfillment_text = json.loads(fulfillment_text)
    #print(fulfillment_text)

    if "You have chosen" in fulfillment_text:
        #print(product_summary)
        #print(product_summary[1].split(','))
        #print(type(product_summary[1]))
        #print(product_summary[1][0])


        response_text = { "message":  fulfillment_text, "call" : "webhook", "products" : products_list,"run":product_table_run,
                          "rows":len(product_new) }

    elif "order summary" in fulfillment_text:
        response_text = {"message": fulfillment_text, "call": "summary", "products": summary_list, "run": summary_run,
                         "rows": len(order_summary_new),"name": name}



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

