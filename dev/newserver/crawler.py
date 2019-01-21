# import requests
# import re
# import time
# import json
# from selenium import webdriver
#
# courses = {
# '1': 'm1a.html',
# '2': 'm2a.html',
# '3': 'm3a.html',
# '4': 'm4a.html',
# '5': 'm5a.html',
# '6': 'm6a.html',
# '7': 'm7a.html',
# '8': 'm8a.html',
# '9': 'm9a.html',
# '10': 'm10a.html',
# '11': 'm11a.html',
# '12': 'm12a.html',
# '14': 'm14a.html',
# '15': 'm15a.html',
# '16': 'm16a.html',
# '17': 'm17a.html',
# '18': 'm18a.html',
# '20': 'm20a.html',
# '21': 'm21a.html',
# '21A': 'm21Aa.html',
# 'CMS': 'mCMSa.html',
# '21W': 'm21Wa.html',
# '21G': 'm21Ga.html',
# '21H': 'm21Ha.html',
# '21L': 'm21La.html',
# '21M': 'm21Ma.html',
# 'WGS': 'mWGSa.html',
# '22': 'm22a.html',
# '24': 'm24a.html',
# 'CC': 'mCCa.html',
# 'CSB': 'mCSBa.html',
# 'EC': 'mECa.html',
# 'EM': 'mEMa.html',
# 'ES': 'mESa.html',
# 'HST': 'mHSTa.html',
# 'IDS': 'mIDSa.html',
# 'MAS': 'mMASa.html',
# 'SCM': 'mSCMa.html',
# 'AS': 'mASa.html',
# 'MS': 'mMSa.html',
# 'NS': 'mNSa.html',
# 'STS': 'mSTSa.html',
# 'SWE': 'mSWEa.html'
# }
#
# browser = webdriver.Chrome('./chromedriver')
# # browser = webdriver.PhantomJS()
# classes = {}
# for course in courses:
#     # print courses[course]
#     browser.get("http://student.mit.edu/catalog/" + courses[course])
#     table = browser.find_element_by_xpath('//div[@id="contentleft"]')
#     results = table.find_element_by_xpath('//table[@border="0" and @width="100%"]')
#     results = results.find_elements_by_tag_name("h3")
#     units_divs = results[0].find_element_by_xpath('..').text
#     a = [m.start() for m in re.finditer('Units', units_divs)]
#     units = []
#     for item in a:
#         units.append(units_divs[item + 7:item + 12])
#         # units.append(int(units_divs[item+7:item+8])+int(units_divs[item+9:item+10])+int(units_divs[item+11:item+12]))
#     # print units
#     # print len(results)
#     # lan = []
#     for index in range(0, len(results)-1):
#         text = results[index].text
#         if text.find(' ') != -1:
#             class_id = text[:text.index(' ')]
#             class_name = text[text.index(' ')+1:]
#             # lan.append([text[:text.index(' ')], text[text.index(' ')+1:]])
#             print class_id, class_name
#             if index > len(units) - 1:
#                 classes[class_id] = {'class_name': class_name, 'units': ""}
#             else:
#                 classes[class_id] = {'class_name': class_name, 'units': units[index]}
# # print classes
# browser.quit()
# with open('class_info.txt', 'w') as outfile:
#     json.dump(classes, outfile)


import requests
import re
import time
import json
from selenium import webdriver

courses = {
'1': 'course1.html',
'2': 'course2.html',
'3': 'course3.html',
'4': 'course4.html',
'5': 'course5.html',
'6': 'course6.html',
'7': 'course7.html',
'8': 'course8.html',
'9': 'course9.html',
'10': 'course10.html',
'11': 'course11.html',
'12': 'course12.html',
'13': 'course13.html',
'14': 'course14.html',
'15': 'course15.html',
'16': 'course16.html',
'17': 'course17.html',
'18': 'course18.html',
'20': 'course20.html',
'21A': 'course21A.html',
'21F': 'course21F.html',
'21W': 'course21W.html',
'21G': 'course21G.html',
'21H': 'course21H.html',
'21L': 'course21L.html',
'21M': 'course21M.html',
'22': 'course22.html',
'24': 'course24.html',
'CC': 'courseCC.html',
'CSB': 'courseCSB.html',
'CMS': 'courseCMS.html',
'CRE': 'courseCRE.html',
'EC': 'courseEC.html',
'EM': 'courseEM.html',
'ES': 'courseES.html',
'ESD': 'courseESD.html',
'HST': 'courseHST.html',
'IDS': 'courseIDS.html',
'MAS': 'courseMAS.html',
'SCM': 'courseSCM.html',
'SMA': 'courseSMA.html',
'WGS': 'courseWGS.html',
'AS': 'courseAS.html',
'MS': 'courseMS.html',
'NS': 'courseNS.html',
'SP': 'courseSP.html',
'STS': 'courseSTS.html',
'PE': 'coursePE.html'
}

browser = webdriver.Chrome('./chromedriver')
# browser = webdriver.PhantomJS()
classes = {}
for course in courses:
    # print courses[course]
    browser.get("https://stellar.mit.edu/classlink/" + courses[course])
    table = browser.find_elements_by_class_name("classtable")
    for t in table:
        tds = t.find_elements_by_tag_name("a")
        for td in tds:
            a = td.get_attribute("href")
            if td.text.find('/') != -1:
                class_name = td.text[:td.text.index('/')]
                if class_name not in classes:
                    classes[class_name] = a
    print course, "done"

browser.quit()
with open('class_info.txt', 'w') as outfile:
    json.dump(classes, outfile)
