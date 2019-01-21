import requests
import re
import time
from selenium import webdriver


data_a = ["va12", "va14", "va15", "va10", "va02", "va07", "va05", "va03", "va01", "va08", "va11", "va06",
          "va13", "va09", "va04"]
data_b = ["vb02", "vb07", "vb15", "vb14", "vb03", "vb12", "vb09", "vb01", "vb05", "vb11", "vb08", "vb10",
          "vb13", "vb04", "vb06"]
data = {"morality": {1:"1", 2:"1", 3:"1", 4:"1", 5:"1", 6:"2", 7:"2", 8:"2", 9:"2", 10:"2", 11:"3", 12:"3", 13:"3", 14:"3", 15:"3",
        16: "4", 17: "4", 18: "4", 19: "4", 20: "4", 21: "5", 22: "5", 23: "5", 24: "5", 25: "5", 26: "6", 27: "6", 28: "6",
        29: "6", 30: "6"}}
morality = {'Fairness': 0, 'Harm': 0, 'Loyalty': 0, 'Authority': 0, 'Purity': 0}
num_questions = 15
# payload = {}
# for i in range(1, num_questions + 1):
#     payload[data_a[i - 1]] = data['morality'][i]
# for i in range(16, num_questions + 16):
#     payload[data_b[i - 16]] = data['morality'][i]
# browser = webdriver.PhantomJS()
browser = webdriver.Chrome('./chromedriver')
browser.get("http://www.yourpersonality.net/political/griffin1.pl")

submit_button = browser.find_element_by_xpath('//input[@type="submit" and @value="Begin"]')
submit_button.click()
submit_button = browser.find_element_by_xpath('//input[@type="submit" and @value="Next"]')
submit_button.click()
for item in data_a:
    a = item + data['morality'][data_a.index(item) + 1]
    print a
    radio = browser.find_element_by_id(a)
    radio.click()
time.sleep(10)
submit_button = browser.find_element_by_xpath('//input[@type="submit" and @value="Next"]')
submit_button.click()
for item in data_b:
    a = item + data['morality'][data_b.index(item) + 1]
    print a
    radio = browser.find_element_by_id(a)
    radio.click()
time.sleep(10)
submit_button = browser.find_element_by_xpath('//input[@type="submit" and @value="Next"]')
submit_button.click()
results = browser.find_element_by_xpath("//tr[@class='tdbox3']")
results =  results.find_element_by_xpath('..').find_elements_by_tag_name("tr")
for index in range(1, len(results)):
    if index == 1:
        morality['Fairness'] = results[index].find_elements_by_tag_name("td")[1].text
    elif index == 2:
        morality['Harm'] = results[index].find_elements_by_tag_name("td")[1].text
    elif index == 3:
        morality['Loyalty'] = results[index].find_elements_by_tag_name("td")[1].text
    elif index == 4:
        morality['Authority'] = results[index].find_elements_by_tag_name("td")[1].text
    elif index == 5:
        morality['Purity'] = results[index].find_elements_by_tag_name("td")[1].text
time.sleep(10)
browser.quit()
print morality
# print browser.page_source

# options = webdriver.ChromeOptions()
# options.add_argument('--ignore-certificate-errors')
# options.add_argument("--test-type")
# options.binary_location = "/usr/bin/chromium"
# driver = webdriver.Chrome(chrome_options=options)
# driver.get('http://codepad.org')
#
# text_area = driver.find_element_by_id('textarea')
# text_area.send_keys("print('Hello World')")
#
# submit_button = driver.find_element_by_xpath('//input[@type="submit" and @title="next"]')[0]
# submit_button.click()


# browser = webdriver.Chrome('./chromedriver')
# browser.get("https://en.wikipedia.org/wiki/List_of_languages_by_number_of_native_speakers")
# table = browser.find_element_by_xpath('//table[@class="wikitable sortable jquery-tablesorter"]')
# results = table.find_element_by_xpath('//tbody').find_elements_by_tag_name("tr")
# print len(results)
# lan = []
# for index in range(0, len(results)-1):
#   lan.append(results[index].find_elements_by_tag_name("td")[1].find_elements_by_tag_name("a")[0].text)
# print lan
# browser.quit()

