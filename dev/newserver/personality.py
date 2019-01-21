import urllib
import urllib2
import webbrowser
import requests
import json
import re
from lxml import html

def match_personality(x):
  return {
    0: 'Open-Mindedness',
    1: 'Conscientiousness',
    2: 'Extraversion',
    3: 'Agreeableness',
    4: 'Negative Emotionality'
  }[x]

personality = {'Open-Mindedness': 0, 'Conscientiousness': 0, 'Extraversion': 0, 'Agreeableness': 0, 'Negative Emotionality': 0}
demographics = {'gender': '', 'YOB': 1900}
saveurl = ""
url = 'https://www.outofservice.com/bigfive/?score-bigfive'
num_questions = 60
payload = {}
my_age = '25'
my_gender = 'f'
for i in range(1, num_questions + 1):
    name = 'bigfive-me-' + str('%02d'%i)
    payload[name] = '3'
payload['bigfive-dem-gender'] = my_gender
payload['bigfive-dem-age'] = my_age
print payload
r = requests.post(url, data=payload)
i = 0
for m in re.findall('Your percentile: (.*)</nobr>', r.content):
    feature = match_personality(i)
    i += 1
    personality[feature] = m
demographics['gender'] = my_gender
demographics['age'] = my_age
saveurl = r.url

with open("results.html", "w") as f:
    f.write(r.content)
webbrowser.open("results.html")


