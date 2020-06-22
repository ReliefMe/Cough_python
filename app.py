from flask import Flask, render_template, url_for, request, jsonify, make_response, flash, redirect
from sklearn.externals import joblib
import librosa
import requests
import uuid
import json

import cough as CP
import text_api
import breath as bm
import os
from ip2geotools.databases.noncommercial import DbIpCity
from urllib.request import urlopen
from pymongo import MongoClient

import pandas as pd
import numpy as np
#from flask_cors import CORS
from werkzeug.utils import secure_filename

application = Flask(__name__)

client = MongoClient("localhost", 27017)
db = client.SentencesDatabase
users = db["Users"]

# UPLOAD_FOLDER = './uploads'
# ALLOWED_EXTENSIONS = {'mp3', 'wav'}

# application.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

#def allowed_file(filename):
#    return '.' in filename and \
#           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@application.route('/', methods=['GET', 'POST'])
def index():
    dicti = data()
    return render_template('app.html',predic=dicti)
        

@application.route('/data', methods=['GET', 'POST'])
def data():
    if request.method == 'POST':
        try:
            age = request.form.get('age')
            gender = request.form.get('gender')
            smoker = request.form.get('smoker')
            symptoms = request.form.getlist('reported_symptoms')
            medical_history = request.form.getlist('medical_history')
            symptoms = ",".join(symptoms) + ","
            medical_history = ",".join(medical_history) + ","
            # hasham = request.files
            hasham = request.files.get("cough_data")
            breath = request.files.get("breath_data")
            location = request.form.get("user_locations")

            # Textual model
            response = {"age": [int(age)], "gender": [gender],
                "smoker": [smoker], "patient_reported_symptoms": [symptoms],
                "medical_history": [medical_history]
                }

            if location == "furqan":
                # ip = urlopen('http://ip.42.pl/raw').read()
                # ip = request.remote_addr
                # loc_response = DbIpCity.get(ip, api_key="free")

                ip_address = request.remote_addr
                resp = requests.get("http://ip-api.com/json/{}".format(ip_address))
                js = resp.json()
                # print(js)
                country = js['country']
                region = js['regionName']
                city = js["city"]
                # print(country)
                
                
                # location = f"{loc_response.country}, {loc_response.region}, {loc_response.city}"
                location = f"{country}, {region}, {city}"
                # print(location)
               
            ####### DB API ####### 
            # pload = {'age':age,'gender':gender, 'smoker': smoker, 'reported_symptoms': symptoms, "medical_history": medical_history,
            #         'cough_audio': hasham.read(), 'breath_audio': breath.read()
            #         }
            # r = requests.post('http://54.145.158.236:5000/add_user',data = pload)
            # print(r.text)
            ##########################

            df1 = pd.DataFrame(response)
            prediction = round(text_api.predict(df1, "./model81.pkl"), 2)
            
            # pp = os.getcwd()
            hash = uuid.uuid4().hex
    
            cough_path = "./uploads/cough/hasham"
            breath_path = "./uploads/breath/breath"
            
            with open(cough_path + hash + ".wav", 'wb') as ft:
                ft.write(hasham.read())

            with open(breath_path + hash + ".wav", 'wb') as ft:
                ft.write(breath.read())
            
            # return symptoms
            # return jsonify(hasham.read())
            # check if the post request has the file part
            # if 'file' not in request.files:
            #     flash('No file part')
            #     return redirect(request.url)
            # file = request.files['file']

            # # if user does not select file, browser also
            # # submit an empty part without filename
            # if file.filename == '':
            #     flash('No selected file')
            #     return redirect(request.url)
            # if file and allowed_file(file.filename):
            #     filename = secure_filename(file.filename)
            #     file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            


            ####### Predictions
            cough_result = CP.predict(cough_path+ hash + ".wav", './cough_model.pkl')
            breath_result = bm.predict(breath_path+ hash + ".wav", './breath_model.pkl')
            cough_result = round(cough_result, 2)
            breath_result = round(breath_result, 2)


            ####### DB insertion
            users.insert_one({
                "age": age,
                "gender" : gender,
                "smoker" : smoker,
                "symptoms": symptoms,
                "medical_history": medical_history,
                "cough_path": cough_path+ hash + ".wav",
                "breath_path": breath_path+ hash + ".wav",
                "statistical_result": prediction,
                "cough_results": cough_result,
                "breath_results":  breath_result,
                "location": location
            })
            
            msg = ""

            ######## Conditions
            if prediction == 0 and cough_result == 0 and breath_result == 0:
                msg = "Hooray! You are safe. You are Covid free!!!"
            elif prediction == 0 and cough_result > 0 and breath_result > 0:
                msg = "We are worried! You need to visit doctor.!!!"
            elif prediction > 0 and cough_result > 0 and breath_result > 0:
                msg = "Your health condition seems Serious. You need to visit doctor!!!"
            elif prediction > 0 and cough_result == 0 and breath_result == 0:
                msg = "Hooray! You are safe. You are Covid free, Just take rest and eat healthy..!!!"
            elif prediction > 0 and cough_result == 0 and breath_result > 0:
                msg = "There are very mild Symptoms, Don't worry, we suggest you to Isolate yourself and eat healthy Food!!!"
            elif prediction > 0 and cough_result > 0 and breath_result == 0:
                msg = "There are mild Symptoms of Corona, we suggest you to Isolate yourself and eat healthy Food!!!"
            elif prediction == 0 and cough_result > 0 and breath_result == 0:
                msg = "There are very mild Symptoms of Corona, Don't worry, we suggest you to Isolate yourself and eat healthy Food!!!"
            elif prediction == 0 and cough_result == 0 and breath_result > 0:
                msg = "There are extremely low symptoms, Don't worry, Stay at Home and eat healthy Food!!!"        

            ############

            return jsonify({
                "prediction": round((prediction * 100), 2),
                "cough_result": round((cough_result * 100), 2),
                "breath_result": round((breath_result * 100), 2),
                "msg": msg
            })

        except:
            return "Please check if the values are entered correctly"
    
# if __name__ == "__main__":
#     application.run(debug=True)
    

# if __name__ == '__main__':
#     application.run(host='0.0.0.0', port=80)


