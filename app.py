from flask import Flask, render_template, url_for, request, jsonify, make_response, flash, redirect
from sklearn.externals import joblib
import librosa
import requests

import cough as CP
import text_api
import breath as bm
import os
from ip2geotools.databases.noncommercial import DbIpCity
from urllib.request import urlopen


import pandas as pd
import numpy as np
#from flask_cors import CORS
from werkzeug.utils import secure_filename

application = Flask(__name__)

UPLOAD_FOLDER = './uploads'
ALLOWED_EXTENSIONS = {'mp3', 'wav'}

application.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


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
            # location = request.form.get("user_locations")

            # Textual model
            response = {"age": [int(age)], "gender": [gender],
                "smoker": [smoker], "patient_reported_symptoms": [symptoms],
                "medical_history": [medical_history]
                }

            # if not location:
                
            #     ip = urlopen('http://ip.42.pl/raw').read()
            #     response = DbIpCity.get(ip, api_key="free")
            #     # print("\n") # new line
                # print("Your Region is : {0}".format(response.region))

                # print("\n")
                # print("********************")

                # print("Your Country is : {0}".format(response.country))

                # print("\n")
                # print("********************")

                # print("Your City is : {0}".format(response.city))

                # print("\n")
                # print("********************")


            ####### DB API ####### 
            # pload = {'age':age,'gender':gender, 'smoker': smoker, 'reported_symptoms': symptoms, "medical_history": medical_history,
            #         'cough_audio': hasham.read(), 'breath_audio': breath.read()
            #         }
            # r = requests.post('http://54.145.158.236:5000/add_user',data = pload)
            # print(r.text)
            ##########################

            df1 = pd.DataFrame(response)
            prediction = text_api.predict(df1, "./model81.pkl")
            
            # pp = os.getcwd()
            cough_path = "./uploads/hasham.wav"
            breath_path = "./uploads/breath.wav"
            
            with open(cough_path, 'wb') as ft:
                ft.write(hasham.read())

            with open(breath_path, 'wb') as ft:
                ft.write(breath.read())
            
            # fil_cough  = "./uploads/hasham.wav"    
            # fil_breath  = "./uploads/breath.wav"    
            

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
            
            # audio_path = './cough_rec_Int/uploads/'+filename



            ####### Working code
            cough_result = CP.predict(cough_path, './cough_model.pkl')
            breath_result = bm.predict(breath_path, './breath_model.pkl')

            if prediction[0] == 0 and cough_result == 0 and breath_result == 0:
                return "Hooray! You are safe. You are Covid free!!!"
            elif prediction[0] == 0 and cough_result > 0 and breath_result == 1:
                return "We are worried! You need to visit doctor.!!!"
            elif prediction[0] == 1 and cough_result > 0 and breath_result == 1:
                return "Your health condition seems Serious. You need to visit doctor!!!"
            elif prediction[0] == 1 and cough_result == 0 and breath_result == 0:
                return "Hooray! You are safe. You are Covid free, Just take rest and eat healthy..!!!"
            elif prediction[0] == 1 and cough_result == 0 and breath_result == 1:
                return "There are very mild Symptoms, Don't worry, we suggest you to Isolate yourself and eat healthy Food!!!"
            elif prediction[0] == 1 and cough_result > 0 and breath_result == 0:
                return "There are mild Symptoms of Corona, we suggest you to Isolate yourself and eat healthy Food!!!"
            elif prediction[0] == 0 and cough_result > 0 and breath_result == 0:
                return "There are very mild Symptoms of Corona, Don't worry, we suggest you to Isolate yourself and eat healthy Food!!!"
            elif prediction[0] == 0 and cough_result == 0 and breath_result == 1:
                return "There are extremely low symptoms, Don't worry, Stay at Home and eat healthy Food!!!"        
            ##########

        except:
            return "Please check if the values are entered correctly"
    
# if __name__ == "__main__":
#     application.run(debug=True)
    

# if __name__ == '__main__':
#     application.run(host='0.0.0.0', port=80)


