import json
import os
import os.path
import shutil
import gzip
import zlib
import logging
import cStringIO
import time
import sys
from pymongo import MongoClient
from bson.binary import Binary
import datetime
import pytz
import email.utils as eutils
import pymongo
from bson.objectid import ObjectId
import string
import random
import email as em
import traceback
from email.parser import HeaderParser
import calendar
from dateutil.parser import parse as dateparse
from bson.json_util import dumps
import csv
import yaml
import bson
import networkx as nx
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

class EmailType:
  GMAIL = 1
  EXCHANGE = 2
  HOTMAIL = 3
  YAHOO = 4

class AuthStatus:
  PENDING = 1
  AUTHORIZED = 2
  FAILED = 3

class MyEncoder(json.JSONEncoder):
    def default(self, obj):
        return obj.__dict__

try:
  db
except NameError:
  client = MongoClient(tz_aware=True)
  client.the_database.authenticate('teams', 'teams2018', source='immersion')
  db = client['immersion'] #MongoClient(tz_aware=True)['immersion']
  db.states.ensure_index("email") # don't index by both email and studyid, rebuilding time is huge
  db.emails.ensure_index("email") # don't index by both email and studyid, rebuilding time is huge
  db.tasks.ensure_index('timestamp')
  db.tasks.ensure_index('email')
  db.statistics.ensure_index('email')
  db.notifications.ensure_index('email')
  db.errors.ensure_index('email')

try:
  db.create_collection("logs", capped=True, size=1024*1024*1024) # capped at 1GB for storing logs
except:
  pass

def getAllUsers():
    users = db.states.find()
    return users

def getState(email, studyid):
  query = {"email": email}
  # if studyid: query['studyid'] = studyid
  # else: query['studyid'] = {'$exists': False}
  return db.states.find_one(query)

def getInvitedState_test(email):
  query = {"email": email}
  return db.states.find_one(query)


def getStateJson(email, studyid):
  state = getState(email, studyid)
  if state is None: return None
  del state['_id']
  #return json.dumps(state)
  return state
  #if state is None:
  #  state = {'email':email, 'lastuid':0, 'version': -1}
  #  db.states.insert(state)
  #return state


def id_generator(size=6, chars=string.ascii_uppercase + string.digits):
  return ''.join(random.choice(chars) for x in range(size))

def hasStudyID(study_id):
  return db.studies.find_one({'id' : study_id})

def hasGroupID(group_id):
  return db.groups.find_one({'id' : group_id})

def hasTeamID(team_id):
  return db.teams.find_one({'id' : team_id})

def passwordMatch(team_id, password):
  team = db.teams.find_one({'id' : team_id})
  # if team['id'] == password:
  if password == team['password']:
    return True
  else:
    return False

def getTeamMemberCount(team_id):
  return len(db.teams.find_one({'id' : team_id}, {'members': 1})['members'])

def hasMergedTeamID(team_id):
  return db.mergedteams.find_one({'id' : team_id})

def createStudy(study_name, study_description, email):
  password = id_generator(size=10)
  while True:
    study_id = id_generator(size=6)
    if not hasStudyID(study_id): break
  study = {'name': study_name, 'description': study_description, 'id': study_id, 'email': email, 'password': password}
  db.studies.insert(study)
  return study

def getStudy(studyid):
  return db.studies.find_one({'id' : studyid})

def getUserInfo(email):
  tmp = db.states.find_one({"email": email}, {'userinfo':1})
  if 'userinfo' in tmp: return tmp['userinfo']

def storeState(email, studyid, state):
  query = {'email':email}
  if studyid: query['studyid'] = studyid
  else: query['studyid'] = {'$exists': False}
  db.states.update(query, state, upsert=True)

def storeEmailSentTime(email, emailSentTime_info):
  query = {'email':email}
  db.email_sentTime.update(query, emailSentTime_info, upsert=True)

def getEmailSentTime(email):
  query = {'email':email}
  projection = {"_id": 0, "email": 0 }
  data = db.email_sentTime.find_one(query, projection)
  return data

def storeAliases(email, aliases, timestamp, use_length):
  query = {'email':email}
  userinfo = db.states.find_one({"email": email})
  userinfo['userinfo']['aliases'] = aliases
  userinfo['userinfo']['timestamp'] = timestamp
  userinfo['userinfo']['use_length'] = use_length
  db.states.update(query, userinfo, upsert=True)

  data = {'email': email, 'aliases': aliases}
  db.aliases.update(query, data, upsert=True)

def getAliases(email):
  query = {'email':email}
  projection = {"_id": 0, "email": 0}
  data = db.aliases.find_one(query, projection)
  return data

def storePersonality(email, personality):
  query = {'email':email}
  db.personalities.update(query, personality, upsert=True)

def getPersonality(email):
  query = {'email':email}
  projection = {"email": 0, "_id": 0}
  personality = db.personalities.find_one(query, projection)
  return personality

def storeMorality(email, morality):
  query = {'email':email}
  db.moralities.update(query, morality, upsert=True)

def getMorality(email):
  query = {'email':email}
  projection = {"email": 0, "_id": 0}
  morality = db.moralities.find_one(query, projection)
  return morality

def storeDemographic(email, demographic):
  query = {'email':email}
  db.demographics.update(query, demographic, upsert=True)

def getDemographic(email):
  query = {'email':email}
  projection = {"email": 0, "_id": 0}
  demographic = db.demographics.find_one(query, projection)
  return demographic

def storeMetrics(team_id, metrics):
  query = {'id':team_id}
  db.metrics.update(query, metrics, upsert=True)

def getMetrics(team_id):
  query = {'id': team_id}
  projection = {"_id": 0}
  metrics = db.metrics.find_one(query, projection)
  return metrics

def storeCommunication(team_id, batch, year, communication):
  query = {'id':team_id, 'year':year, 'batch':batch}
  db.communication.update(query, communication, upsert=True)

def getCommunication(team_id):
  query = {'id': team_id}
  communication = db.communication.find(query)
  return communication

def storeWholeNetworkVersion(id, network_version):
  query = {'id': id}
  db.network_version.update(query, network_version, upsert=True)

def getWholeNetworkVersion(id):
  query = {'id': id}
  projection = {"_id": 0}
  network_version = db.network_version.find_one(query, projection)
  return network_version

def storeWholeNetwork(id, type, batch, network_info):
  # query = {'id':team_id, 'batch':batch}
  query = {'id': id, 'type': type, 'batch': batch}
  db.whole_network.update(query, network_info, upsert=True)

def getWholeNetwork(id, type, batch):
  query = {'id': id, 'type': type, 'batch': batch}
  projection = {"_id": 0}
  whole_network = db.whole_network.find_one(query, projection)
  return whole_network

def storeOrgsVersion(id, orgs_version):
  query = {'id': id}
  db.orgs_version.update(query, orgs_version, upsert=True)

def getOrgsVersion(id):
  query = {'id': id}
  projection = {"_id": 0}
  orgs_version = db.orgs_version.find_one(query, projection)
  return orgs_version

def storeOrgs(id, batch, orgs):
  # query = {'id':team_id, 'batch':batch}
  query = {'id': id, 'batch': batch}
  db.orgs.update(query, orgs, upsert=True)

def getOrgs(id, batch):
  query = {'id': id, 'batch': batch}
  projection = {"_id": 0}
  orgs = db.orgs.find_one(query, projection)
  return orgs

def storeContacts(email, contacts):
  # query = {'id':team_id, 'batch':batch}
  query = {'email': email}
  db.contacts.update(query, contacts, upsert=True)

def getContacts(email):
  query = {'email': email}
  projection = {"_id": 0}
  contacts = db.contacts.find_one(query, projection)
  return contacts

def storeNetworkStructure(team_id, network):
  # query = {'id':team_id, 'batch':batch}
  query = {'id': team_id}
  db.networks.update(query, network, upsert=True)

def getNetworkStructure(team_id):
  query = {'id': team_id}
  projection = {"id": 0, "_id": 0}
  network = db.networks.find_one(query, projection)
  return network

def storeSlackNetwork(team_id, slack_team_id, network):
  # query = {'id':team_id, 'batch':batch}
  query = {'team_id': slack_team_id}
  db.slack_networks.update(query, network, upsert=True)

def getSlackNetwork(slack_team_id):
  query = {'team_id': slack_team_id}
  projection = {"_id": 0}
  network = db.slack_networks.find_one(query, projection)
  return network

def saveTeamToSlack(team_id, team_to_slack):
  query = {'team_id': team_id}
  db.team_to_slack.update(query, team_to_slack, upsert=True)

def getTeamToSlack(team_id):
  query = {'team_id': team_id}
  projection = {"_id": 0}
  slack_team = db.team_to_slack.find_one(query, projection)
  return slack_team

def getMyTeams(email):
  query = {'members.email':email}
  projection = {"link":0, "members": 0, "_id": 0}
  teams = db.teams.find(query, projection)
  return teams

def removeFromTeams(email):
  query = {'members.email':email}
  projection = {"link":0, "members": 0, "_id": 0}
  teams = db.teams.find_and_modify(query = query, update = {'$pull': {'members': { 'email': email}}})
  # return teams

def check_state(query):
  print "check", db.states.find_one(query)


def storeTestState(email, studyid, state):
  query = {'email':email}
  print "yes update"
  # print "state", state
  db.states.update(query, state, upsert=True)
  print "yes update"
  # print db.states.find_one(query)


def storeStats(email, stats):
  stats['email'] = email
  stats['timestamp'] = datetime.datetime.now(pytz.UTC)
  db.statistics.update({'email':email}, stats, upsert=True)
  # check_state({"email":"junezjx@gmail.com"})

def jsonToGzip(json_obj):
  output = cStringIO.StringIO()
  f = gzip.GzipFile(fileobj=output, mode='w')
  json_dump = json.dumps(json_obj)
  f.write(json_dump)
  f.close()
  contents = output.getvalue()
  output.close()
  return contents

def storeEmails(email, emails, version, studyid):
  version = int(version)
  contents = jsonToGzip(emails)
  query = {'email': email, 'version':version}
  if studyid: query['studyid'] = studyid
  else: query['studyid'] = {'$exists': False}
  
  obj = {'email': email, 'version':version, 'contents': Binary(contents),
    'timestamp': int(time.time()), 'length': len(contents)}
  if studyid: obj['studyid'] = studyid
  print "store emails!!"
  db.emails.update(query, obj, upsert=True)

def getItem(itemName, line1):
  startIdx = line1.find(itemName) + len(itemName) + 1
  if line1[startIdx] == '"':
    item = line1[startIdx+1 : line1.find('"', startIdx + 1)]
  else:
    item = line1[startIdx : line1.find(" ", startIdx)]
  return item

{
'fromField': ['Tricia Navarro (Twitter)', 'n-qfzvyxbi=tznvy.pbz-7a49a@postmaster.twitter.com'],
'toField': [['Daniel Smilkov', 'dsmilkov@gmail.com']],
'dateField': 1372743719,
'UID': '101451',
'isSent': False, 
'threadid': '1439426117975266137',
}


def parseHeader(line1, line2):
  header = {}
  msg = em.message_from_string(line2.encode("utf-8"), strict=False)
  fromStr = msg.get("from")
  # print "message", msg
  if fromStr is None: return None
  fromName, fromAddr = em.utils.parseaddr(fromStr)
  if fromAddr is None: return None
  header['fromField'] = [fromName, fromAddr]
  header['toField'] = map(lambda x: (x[0], x[1]) ,em.utils.getaddresses(msg.get_all("to", []) + msg.get_all("cc", [])))
  # ==== parse the date ====
  try:
    if 'INTERNALDATE' in line1: # check if it is the new format
      header['dateField'] = calendar.timegm(eutils.parsedate(getItem('INTERNALDATE', line1)))
    else: # it is the old format with the date field
      if msg.get("date") is None: return None
      header['dateField'] = calendar.timegm(eutils.parsedate(msg.get("date")))
  except:
    #print 'date failed'
    return None
  # ========================
  header['threadid'] = getItem("X-GM-THRID", line1)
  header['UID'] = getItem("UID", line1)
  header['flags'] = getItem("FLAGS", line1).replace("\\","")[getItem("FLAGS", line1).replace("\\","").index('(')+1:getItem("FLAGS", line1).replace("\\","").index(')')]
  #print header['flags']
  if line1.find("\\Sent") >= 0: header['isSent'] = True
  else: header['isSent'] = False
  return header

def formatOutlookEmails(user_email, email):
  if 'from' in email and 'address' in email['from']['emailAddress']:
    header = {}
    header['fromField'] = [email['from']['emailAddress']['name'], email['from']['emailAddress']['address']]
    header['toField'] = []
    header['ccField'] = []
    for index in range(0, len(email['toRecipients'])):
      header['toField'].append([email['toRecipients'][index]['emailAddress']['name'], email['toRecipients'][index]['emailAddress']['address']])
    for index in range(0, len(email['ccRecipients'])):
      header['ccField'].append([email['ccRecipients'][index]['emailAddress']['name'], email['ccRecipients'][index]['emailAddress']['address']])
    header['dateField'] = calendar.timegm(dateparse(email['sentDateTime']).timetuple())
    header['threadid'] = email['id']
    if email['isRead'] == True:
      header['flags'] = "Seen"
    else:
      header['flags'] = "Unseen"
    if user_email == email['from']['emailAddress']['address']: header['isSent'] = True
    else: header['isSent'] = False
    return header
  else:
    return None


def getEmails(email, version, studyid):
  now = int(time.time())
  gmailStart = time.mktime(datetime.date(2004, 4, 1).timetuple())
  emails = []
  version = int(version)
  query = { 'email': email, 'version':version }
  # print query
  if studyid: query['studyid'] = studyid
  else: query['studyid'] = {'$exists': False}
  headers = db.emails.find_one(query)
  # print headers[0]
  if headers is None: return None
  f = gzip.GzipFile(fileobj=cStringIO.StringIO(headers['contents']))
  headers = json.load(f)
  f.close()
  for header in headers:
    if header is None: continue
    try:
      if isinstance(header, (list, tuple)):
        parsedHeader = parseHeader(header[0], header[1])
      else: parsedHeader = header
    except:
      continue
      #print 'unhandled parsing exception!'
      #print header
      #print '>>> traceback <<<'
      #traceback.print_exc()
      #print '>>> end of traceback <<<'
      #exit(1)
    if parsedHeader is None or parsedHeader['dateField'] < gmailStart or parsedHeader['dateField'] > now: continue
      #print 'parsing failed or invalid date!!'
      #print header
    emails.append(parsedHeader)
  print "email example", emails[len(emails)-1]
  return emails

def getHillaryEmails(email, version, studyid):
  now = int(time.time())
  gmailStart = time.mktime(datetime.date(2004, 4, 1).timetuple())
  emails = []
  projection = {'name': 0, "UID": 1, "isSent": 1, "fromField": 1, "toField": 1, "dateField": 1, "threadid": 1, "_id": 0}
  version = int(version)
  query = { 'name': email}
  # print query
  if studyid: query['studyid'] = studyid
  else: query['studyid'] = {'$exists': False}
  f = db.Htest.find(query, projection)
  # print headers[0]
  headers = json.load(f)
  for header in headers:
    if header is None: continue
    try:
      if isinstance(header, (list, tuple)):
        parsedHeader = parseHeader(header[0], header[1])
      else: parsedHeader = header
    except:
      continue
      #print 'unhandled parsing exception!'
      #print header
      #print '>>> traceback <<<'
      #traceback.print_exc()
      #print '>>> end of traceback <<<'
      #exit(1)
    if parsedHeader is None or parsedHeader['dateField'] < gmailStart or parsedHeader['dateField'] > now: continue
      #print 'parsing failed or invalid date!!'
      #print header
    emails.append(parsedHeader)
  return emails

def distri(test):
    emails = db.states.find({},{"email":1,"version":1,"_id":0})
    emails = list(emails)
    print len(emails)
    # email_len = [0] * 10000 #1000 as a bucket, length as 1000 15833898
    # email_year_len = [[0] * 15840] * 17 #[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] from yesr 2000 to 2016
    # email_year_user = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0] * len(emails)]
    email_year_user = [[0 for i in range(10)] for j in range(len(emails))]
    max = 0
    with open('distribution_year.csv', 'w') as outfile:
        a = csv.writer(outfile, delimiter=',')
        a.writerow(['year_2009_F', 'year_2010_F', 'year_2011_F', 'year_2012_F', 'year_2013_F', 'year_2009_T', 'year_2010_T', 'year_2011_T', 'year_2012_T', 'year_2013_T'])

        for i in range(664, len(emails)):
            print i
            #print email_year_user[i]
            # print emails[i]['email']
            theEmailAdd = emails[i]['email']
            version = emails[i]['version']
            for v in range(0,version+1):
                length = getContentLength(theEmailAdd, v, "")
                if length != 0:
                    content = getEmailsContent(theEmailAdd, v, "")
                    if content != None:
                        content = zlib.decompress(content, zlib.MAX_WBITS | 16)
                        content = json.loads(content)
			#print content[0]
                        for j in range(0, len(content)):
                            # if content[j][0] == :
                            #     print "ha"
                            if content[j] != None:
                                try:
                                    b = content[j][0]
				    parsedHeader = parseHeader(content[j][0], content[j][1])
				    try:
                                        if True:
					    #print datetime.datetime.fromtimestamp(parsedHeader['dateField'])
					    #print int(str(datetime.datetime.fromtimestamp(parsedHeader['dateField']))[0:4])
					    year = int(str(datetime.datetime.fromtimestamp(parsedHeader['dateField']))[0:4])
                                            if year>2008 and year<2014:
				                if parsedHeader['isSent'] == True:
                                            	    email_year_user[i][year - 2009] += 1
					        else:
						    email_year_user[i][year - 2009 + 5] += 1
                                    except (TypeError,ValueError) as e:
                                        t = 0
                                    #if len(content[j])>1 and len(content[j][1])>20 and content[j][1][0:4] == "Date":
                                     #   year = 2008
                                     #   for yy in range(2009, 2014):
                                     #       if content[j][1][0:30].find(str(yy)) != -1:
                                     #           year = yy
                                        # print year
                                     #   if year > 2008 and year<2014 and content[j][1].find("To") != -1 and content[j][1].find("From") != -1:
					#    if content[j][1].find("To") < content[j][1].find(emails[i]['email']):
                                            # print i, year, (year-2000)
                                         #       email_year_user[i][year - 2009 + 5] += 1
					#else:
					#	email_year_user[i][year - 2009] += 1
                                except KeyError, e:
                                    try:
                                        year = int(str(datetime.datetime.fromtimestamp(content[j]['dateField']))[0:4])
                                        if year>2008 and year<2014:
				            if content[j]['isSent'] == True:
                                            	email_year_user[i][year - 2009] += 1
					    else:
						email_year_user[i][year - 2009 + 5] += 1
                                    except ValueError, e:
                                        t = 0
            print email_year_user[i]
            a.writerow([email_year_user[i][0], email_year_user[i][1], email_year_user[i][2], email_year_user[i][3], email_year_user[i][4], email_year_user[i][5], email_year_user[i][6], email_year_user[i][7], email_year_user[i][8], email_year_user[i][9]])

    # for i in range(0, len(emails)):
    #     # print emails[i]
    #     # print emails[i]['email']
    #     theEmailAdd = emails[i]['email']
    #     # content = db.getEmailsContent(theEmailAdd, 0, "")
    #     length = getContentLength(theEmailAdd, 0, "")
    #     if length == None:
    #         length = 0
    #     if length > max:
    #         max = length
    #     print length
    #     email_len[int(length / 1000)] += 1
    # # print email_len
    # print "max", max

    # for i in range(0, len(emails)):
    #         # print emails[i]['email']
    #         theEmailAdd = emails[i]['email']
    #         length = getContentLength(theEmailAdd, 0, "")
    #         if length != 0:
    #             content = getEmailsContent(theEmailAdd, 0, "")
    #             if content != None:
    #                 content = zlib.decompress(content, zlib.MAX_WBITS | 16)
    #                 content = json.loads(content)
    #                 email_len[int(len(content) / 1000)] += 1
    #         print i
    #
    # with open('distribution.csv', 'w') as outfile:
    #     a = csv.writer(outfile, delimiter=',')
    #     a.writerow(['count', 'number'])
    #     for i in range(0,len(email_len)):
    #         a.writerow([i*1000, email_len[i]])



def getEmailsForUser(email, studyid):
  state = getState(email, studyid)
  nvers = state['version'] + 1
  allemails = []
  for version in xrange(nvers):
    emails = getEmails(email, version, studyid)
    if emails is None: return None
    allemails += emails
  return allemails

def getModifiedTimestamp(email, version, studyid):
  version = int(version)
  projection = {'timestamp': 1}
  query = {'email': email, 'version':version}
  if studyid: query['studyid'] = studyid
  else: query['studyid'] = {'$exists': False}
  emails = db.emails.find_one(query, projection)
  if emails is None: return None
  return emails['timestamp']

def geHillarytModifiedTimestamp(email):
  projection = {'timestamp': 1}
  query = {'email': email}
  emails = db.emails.find_one(query, projection)
  if emails is None: return None
  return emails['timestamp']

def getContentLength(email, version, studyid):
  version = int(version)
  projection = {'length': 1}
  query = {'email': email, 'version':version}
  if studyid: query['studyid'] = studyid
  else: query['studyid'] = {'$exists': False}
  emails = db.emails.find_one(query, projection)
  if emails is None: return None
  return emails['length']

def getEmailsContent(email, version, studyid):
  version = int(version)
  query = {'email': email, 'version':version}
  if studyid: query['studyid'] = studyid
  else: query['studyid'] = {'$exists': False}
  emails = db.emails.find_one(query)
  if emails is None: return None
  return emails['contents']

def getLeakEmailsContent(name):
  query = {'name': name}
  projection = {"UID": 1, "isSent": 1, "fromField": 1, "toField": 1, "ccField": 1, "dateField": 1, "threadid": 1, "_id": 0}

  emails = db.Htest.find_one({"UID": 10}, projection)
  if name == "Hillary Clinton":
    ee = db.Htest.find({}, projection)
  else:
    ee = db.Jtest.find({}, projection)
  # print ee.count()
  l = list(ee)
  if ee is None: return None
  return l #here


def deleteData(email, studyid): #check this, remove all related data in db
  query = {'email' : email}
  if studyid: query['studyid'] = studyid
  else: query['studyid'] = {'$exists': False}
  # delete task
  db.tasks.remove(query)
  # delete state
  db.states.remove(query)
  # delete emails
  db.emails.remove(query)
  # delete personality
  db.personalities.remove(query)
  # delete moralities
  db.moralities.remove(query)
  #delete aliases
  db.aliases.remove(query)

def submitFeedback(email, text, ip):
  db.feedback.insert({
    'email': email,
    'text': text,
    'ip' : ip,
    'timestamp': datetime.datetime.now(pytz.UTC)
  })

def waitlisting(email, ip):
  db.waitlist.insert({
    'email': email,
    'ip' : ip,
    'timestamp': datetime.datetime.now(pytz.UTC)
  })

def log(email, ip, module, msg, level=logging.INFO):
  timestamp = datetime.datetime.now(pytz.UTC)
  print "log", '%s | %s | %s | %s | %s | %s' % (eutils.formatdate(time.time(), usegmt=True),
    logging.getLevelName(level), module, email, ip, msg)
  db.logs.insert({
    'email' : email,
    'ip' : ip,
    'module' : module,
    'msg' : msg,
    'level' : level,
    'timestamp': timestamp
  })

def popTask():
  task = db.tasks.find_and_modify(sort=[("timestamp", pymongo.ASCENDING)], remove=True)
  return task

def popOutlookTask():
  task = db.outlook_tasks.find_and_modify(sort=[("timestamp", pymongo.ASCENDING)], remove=True)
  return task

def get(key):
  tmp = db.dict.find_one({'key': key})
  if tmp is not None: return tmp['value']
  return None

def put(key, value):
  doc = {'key': key, 'value': value}
  db.dict.update({'key': key}, doc, upsert=True)

def getOutlookTaskTimeAheadofQueue():
  tmp = db.outlook_tasks.find_one(sort=[("timestamp", pymongo.ASCENDING)])
  if tmp is not None and tmp['timestamp'] is not None: return tmp['timestamp']
  return None

def hasOutlookTask(email, studyid):
  query = {'email' : email}
  if studyid: query['studyid'] = studyid
  else: query['studyid'] = {'$exists':False}
  return db.outlook_tasks.find_one(query) is not None

def pushOutlookTask(email, studyid, authid=None):
  task = {'email': email, 'timestamp': datetime.datetime.now(pytz.UTC) , 'authid': authid}
  if studyid: task['studyid'] = studyid
  db.outlook_tasks.insert(task)

def pushOutloojkTaskObject(task):
  db.outlook_tasks.insert(task)

def updateOutlookTask(email, authid):
  db.outlook_tasks.update({'email': email}, {'authid': authid}, upsert=True)

def getTaskTimeAheadofQueue():
  tmp = db.tasks.find_one(sort=[("timestamp", pymongo.ASCENDING)])
  if tmp is not None and tmp['timestamp'] is not None: return tmp['timestamp']
  return None

def hasTask(email, studyid):
  query = {'email' : email}
  if studyid: query['studyid'] = studyid
  else: query['studyid'] = {'$exists':False}
  return db.tasks.find_one(query) is not None

def pushTask(email, studyid, authid=None):
  task = {'email': email, 'timestamp': datetime.datetime.now(pytz.UTC) , 'authid': authid}
  if studyid: task['studyid'] = studyid
  db.tasks.insert(task)

def pushOutlookTask(email, studyid, authid=None):
  task = {'email': email, 'timestamp': datetime.datetime.now(pytz.UTC) , 'authid': authid}
  if studyid: task['studyid'] = studyid
  db.outlook_tasks.insert(task)

def pushTaskObject(task):
  db.tasks.insert(task)

def pushOutlookTaskObject(task):
  db.outlook_tasks.insert(task)

def updateTask(email, authid):
  db.tasks.update({'email': email}, {'authid': authid}, upsert=True)

def updateOutlookTask(email, authid):
  db.outlook_tasks.update({'email': email}, {'authid': authid}, upsert=True)

def pushNotifyDone(email):
  db.notifications.update({'email': email}, {'$set': {'done':True}}, upsert=True)

def pushNotifyImap(email):
  db.notifications.update({'email': email}, {'$set': {'imap':True}}, upsert=True)

def popNotify():
  task = db.notifications.find_and_modify(remove=True)
  return task

def storeError(email, error):
  error['email'] = email
  error['timestamp'] = datetime.datetime.now(pytz.UTC)
  db.errors.update({'email':email}, error, upsert=True)

def removeAuthRequest(authid):
  return db.authrequests.remove({'_id': ObjectId(authid)})


def insertAuthRequest(username, email, password, emailType, studyid):
  #changed by Jingxian: one email only appears once, no matter the previous one authorized or not
  authRequest = {'username': username, 'email':email, 'password': password, 'emailType': emailType, 'status': AuthStatus.PENDING}
  if studyid: authRequest['studyid'] = studyid
  # if db.authrequests.find_one({'email':email}):
  #     db.authrequests.remove({'email':email})
  return str(db.authrequests.insert(authRequest))

  # authRequest = {'username': username, 'email':email, 'password': password, 'emailType': emailType, 'status': AuthStatus.PENDING}
  # if studyid: authRequest['studyid'] = studyid
  # return str(db.authrequests.insert(authRequest))

def getAuthRequest(authid):
  return db.authrequests.find_one({'_id': ObjectId(authid)})

import urllib2, urllib
def sendInvitation(self, email, name, toField, toField_name, link):
  a = 0
  # print "Not used. We switch to php."
  # print "We failed to post from js to php. We are back again."

  # mydata=[('email', email), ('name', name), ('toField', toField), ('toField_name', toField_name), ('link', link)]
  # mydata=[('email', 'email'), ('name', 'name')]
  # mydata=urllib.urlencode(mydata)
  #
  # class MyException(Exception):
  #   pass
  # try:
  #     header = {"content-type": "application/x-www-form-urlencoded"}
  #     # url = "https://" + self.request.host + "/static/email.php"
  #     url = "https://" + self.request.host + "/static/test.php"
  #     print url
  #     req = urllib2.Request(url, mydata, header)
  #     page = urllib2.urlopen(req)
  #     print "page opened"
  #     page = page.read()
  #     print page
  # except urllib2.URLError, e:
  #     raise MyException("There was an error: %r" % e)


  # Plain text
  msg = MIMEText('Hi there! I would like to invite you to see a combined network of our email contacts. If you agree, please click here to see the network.')
  msg['Subject'] = 'Invitation to see a combined email network'
  msg['From'] = email
  msg['To'] = toField
  s = smtplib.SMTP(host = 'localhost', port = 1025)
  s.sendmail(email, [toField], msg.as_string())
  s.quit()


# def saveGroup(emails, names, link):
def saveGroup(data, link):
  while True:
    group_id = id_generator(size=6)
    if not hasGroupID(group_id): break
  # study = {'emails': emails, 'names': names, 'id': group_id, 'link': link}
  # add sth to check if the cobination doesn't exist in the db
  group = {'members': data, 'id': group_id, 'link': link}
  db.groups.insert(group)
  return group_id

def getPassword(team_id):
  if not hasTeamID(team_id):
    return False
  team = db.teams.find_one({'id': team_id})
  return team['password']

def saveTeam(data, team_id, team_password, link):
  if hasTeamID(team_id):
      return False
  team = {'members': data, 'id': team_id, 'password': team_password, 'link': link}
  db.teams.insert(team)
  return team_id

def saveMergedTeam(data, team_id):
  team = {'members': data, 'id': team_id}
  if hasMergedTeamID(team_id):
    db.mergedteams.update({'id': team_id}, team, upsert=True)
  else:
    db.mergedteams.insert(team)
  return

def joinTeam(team_id, userinfo):
  if not hasTeamID(team_id):
      return False
  data = db.teams.find_one({'id' : team_id})
  if len(data['members']) == 0:
      data['admin'] = userinfo
  for i in range(len(data['members'])):
      if data['members'][i]['name'] == userinfo['name'] or data['members'][i]['given_name'] + data['members'][i]['family_name'] == userinfo['name'] or userinfo['given_name'] + userinfo['family_name'] == data['members'][i]['name']:
          data['members'][i]['email'] = userinfo['email']
          data['members'][i]['name'] = userinfo['name']
          data['members'][i]['given_name'] = userinfo['given_name']
          data['members'][i]['family_name'] = userinfo['family_name']
          if data['admin']['name'] == userinfo['name'] or data['admin']['given_name'] + data['admin']['family_name'] == userinfo['name'] or userinfo['given_name'] + userinfo['family_name'] == data['admin']['name']:
            data['admin']['email'] = userinfo['email']
            data['admin']['name'] = userinfo['name']
            data['admin']['given_name'] = userinfo['given_name']
            data['admin']['family_name'] = userinfo['family_name']
          db.teams.update({'id': team_id}, data, upsert=True)
          return data
  data['members'].append(userinfo)
  db.teams.update({'id': team_id}, data, upsert=True)
  return data

def inTeam(team_id, userinfo):
  if not hasTeamID(team_id):
      return False
  data = db.teams.find_one({'id' : team_id})
  for i in range(len(data['members'])):
      if data['members'][i]['name'] == userinfo['name'] or data['members'][i]['given_name'] + data['members'][i]['family_name'] == userinfo['name'] or userinfo['given_name'] + userinfo['family_name'] == data['members'][i]['name']:
          return True
  return False

def exitTeam(email, team_id):
  if not hasTeamID(team_id):
      return False
  data = db.teams.find_one({'id' : team_id})
  for i in range(len(data['members'])):
      if data['members'][i]['email'] == email:
          db.teams.update({'id' : team_id},{'$pull': {"members" : {"email":email}}})
          return True
  return False

def updateGroup(group_id, ind, email, name):
  if not hasGroupID(group_id):
      return False
  data = db.groups.find_one({'id' : group_id})
  print data['members'][ind]['email'], email
  data['link'] = string.replace(data['link'], data['members'][ind]['email'], email)
  print data['link']
  data['members'][ind]['accept'] = 1
  data['members'][ind]['email'] = email
  data['members'][ind]['name'] = name
  db.groups.update({'id': group_id}, data, upsert=True)
  print "updateGroup ", data
  return True


def getGroupAdd(group_id):
  print group_id
  group = db.groups.find_one({'id' : group_id})
  print group
  return group

def getTeamAdd(team_id):
  team = db.teams.find_one({'id' : team_id})
  return team

def getMergedTeamAdd(team_id):
  team = db.mergedteams.find_one({'id' : team_id})
  return team

def storeCentralities(email, centralities, team_id):
  data = db.teams.find_one({'id': team_id})
  for i in range(len(data['members'])):
    for j in range(len(centralities)):
      if data['members'][i]['name'] == centralities[j]['name']:
          data['members'][i]['centralities'] = {'degree': centralities[j]['degree'], 'betweenness': centralities[j]['betweenness']}
  db.teams.update({'id': team_id}, data, upsert=True)

def storeMergedCentralities(email, centralities, team_id):
  data = db.mergedteams.find_one({'id': team_id})
  for i in range(len(data['members'])):
    for j in range(len(centralities)):
      if data['members'][i]['name'] == centralities[j]['name']:
          data['members'][i]['centralities'] = {'degree': centralities[j]['degree'], 'betweenness': centralities[j]['betweenness']}
  db.mergedteams.update({'id': team_id}, data, upsert=True)

def storePairs(email, pairs, team_id):
  data = db.teams.find_one({'id': team_id})
  data['pairs'] = pairs
  db.teams.update({'id': team_id}, data, upsert=True)

def storeMergedPairs(email, pairs, team_id):
  data = db.mergedteams.find_one({'id': team_id})
  data['pairs'] = pairs
  db.mergedteams.update({'id': team_id}, data, upsert=True)

def storeResponseTime(team_id, times):
  query = {'id': team_id}
  db.response_time.update(query, times, upsert=True)

def getResponseTime(team_id):
  query = {'id': team_id}
  projection = {"id": 0, "_id": 0}
  times = db.response_time.find_one(query, projection)
  return times

def networkAna(nodes, links, bet_flag):
  g = nx.Graph()
  # g.add_nodes_from(nodes)
  for node in nodes:
      g.add_node(node['node'], weight=node['weight'])
  for link in links:
      g.add_edge(link['src'], link['trg'], weight=link['weight'])

  gfs = nx.connected_component_subgraphs(g)

  #average vertex degree of networks
  ave_degree = [0 for i in range(len(gfs))]
  for gf in gfs:
    degree_list = list(gf.degree(weight='weight').values())
    ave_degree[gfs.index(gf)] = float(sum(degree_list)) / max(len(degree_list), 1)
  the_ave_degree = float(sum(ave_degree)) / max(len(ave_degree), 1)

  #density of networks
  density = [0 for i in range(len(gfs))]
  for gf in gfs:
    density[gfs.index(gf)] = nx.density(gf)
  the_ave_density = float(sum(density)) / max(len(density), 1)

  #fractional size of the largest component
  giant = max(nx.connected_component_subgraphs(g), key=len)
  frac_size = float(len(giant.nodes())) / float(len(g.nodes()))

  #average shortest path length
  ave_SPL = [0 for i in range(len(gfs))]
  for gf in gfs:
    ave_SPL[gfs.index(gf)] = nx.average_shortest_path_length(gf)
  the_ave_SPL = float(sum(ave_SPL)) / max(len(ave_SPL), 1)

  #average clustering coefficient
  ave_clus = [0 for i in range(len(gfs))]
  for gf in gfs:
    ave_clus[gfs.index(gf)] = nx.average_clustering(gf)
  the_ave_clus = float(sum(ave_clus)) / max(len(ave_clus), 1)

  print "the_ave_degree:", the_ave_degree
  print "the_ave_density:", the_ave_density
  print "frac_size:", frac_size
  print "the_ave_SPL:", the_ave_SPL
  print "the_ave_clus:", the_ave_clus

  # # for nts in gs:
  # bet_cen = nx.betweenness_centrality(g)
  # # clo_cen = nx.closeness_centrality(g)
  # # eig_cen = nx.eigenvector_centrality(g)
  # bet_cen = yaml.safe_load(json.dumps(bet_cen))
  # columns = list(set(bet_cen.keys()))
  # if bet_flag == 1:
  #     # columns = map(lambda x: x.keys(), bet_cen)
  #     # columns = reduce(lambda x,y: x+y, columns)
  #     # columns = list(set(columns))
  #     # print "newnew"
  #     with open('./betweeness.csv', 'w') as out_file:
  #       csv_w = csv.writer(out_file)
  #       csv_w.writerow(columns)
  #       csv_w.writerow(map(lambda x: bet_cen.get( x, "" ), columns))
  #     bet_flag = 1
  # else:
  #     with open('./betweeness.csv', 'a') as out_file:
  #       csv_w = csv.writer(out_file)
  #       csv_w.writerow(columns)
  #       csv_w.writerow(map(lambda x: bet_cen.get( x, "" ), columns))
  # i += 1

  # bt = open('./betweeness.csv','a')
  # bt.write(bet_cen)
  # bt.close()
  # return bet_cen
  return 0