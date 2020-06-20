import joblib
import sklearn
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
import librosa, librosa.display
import numpy as np
import matplotlib.pyplot as plt

############ Without Silence #############

def load_file(file_path):
    test_features = []
    
    signal, sr = librosa.load(file_path, sr = 22050)

    n_fft = 2048
    n_mfcc = 13
    hop_length = 512
    num_segments = 1
    SAMPLE_RATE = 22050
    DURATION = 4  # measured in seconds.
    SAMPLES_PER_TRACK = SAMPLE_RATE * DURATION
    
    num_samples_per_segment =  int(SAMPLES_PER_TRACK / num_segments)

    for s in range(num_segments):
        start_sample = num_samples_per_segment * s  # if s= 0 -> then start_sample = 0 
        finish_sample = start_sample + num_samples_per_segment 
        
        # features
        zc = librosa.feature.chroma_stft(y=signal[start_sample: finish_sample],
                                                     sr=sr,n_chroma=12, n_fft=4096)

        mfcc = librosa.feature.mfcc(signal[start_sample: finish_sample],
                                    sr =sr,
                                    n_fft = 2048,
                                    n_mfcc = 13,
                                    hop_length = 512
                                    )

        chroma_cq = librosa.feature.chroma_cqt(y=signal[start_sample: finish_sample], sr=sr)

        pitches, magnitudes = librosa.piptrack(y=signal[start_sample: finish_sample], sr=sr)
        rolloff = librosa.feature.spectral_rolloff(y=signal[start_sample: finish_sample], sr=sr, roll_percent=0.1)
        
        # Combining all the features
        features = np.concatenate((zc, mfcc, chroma_cq, pitches, rolloff), axis = 0)
        test_features.append(features)
        test_feat = np.array(test_features)
        model_features = test_feat.reshape(test_feat.shape[0], (test_feat.shape[1]*test_feat.shape[2]))
    
    return model_features


def predict(cough_fp, saved_model_fp):
    loaded_model = joblib.load(saved_model_fp)
    breath_features = load_file(cough_fp)
    
    y_pred = loaded_model.predict_proba(breath_features)
    k = np.argmax(y_pred)
    if k == 1:
        return y_pred[0][1]
    elif k == 0:
        return 0
