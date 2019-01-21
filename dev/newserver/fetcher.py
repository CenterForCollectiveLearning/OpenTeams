import db
from db import db as db_direct
import email.utils as eutils
import oauth2client.client
import traceback
import logging
import imaplib
import httplib2
import re
import time
import email as em
from email.header import decode_header
from multiprocessing import Queue
from multiprocessing import Process
import json
import gc
import pytz
from datetime import datetime, timedelta
from imaplib import ParseFlags
REFRESH_NETWORK = 10000 # regenerate network whenever REFRESH_NETWORK emails have been fetched
JUMP = 1000 # read 1000f emails at once, this is an optimal value
LIMIT_NEMAILS = 300*1000 # limit to 150K emails for performance


def getAllMailMailbox(imap):
  pattern = re.compile('\((.*)\) "(.*)" "(.*)"')
  mailboxes = imap.xlist()[1]

  tmp = []
  # print "email example", mailboxes[0]
  for mailbox in mailboxes:
    result = pattern.match(mailbox)
    options = result.group(1).split()
    mname = result.group(3)
    tmp.append((mname, options))
    if '\\AllMail' in options: return mname
  return None

def GenerateOAuth2String(username, access_token, base64_encode=True):
  auth_string = 'user=%s\1auth=Bearer %s\1\1' % (username, access_token)
  if base64_encode:
    auth_string = base64.b64encode(auth_string)
  return auth_string

imaplib.Commands['XLIST'] =  ('AUTH', 'SELECTED')

class ADV_IMAP4_SSL(imaplib.IMAP4_SSL):

  def xlist(self, directory='""', pattern='*'):
    """(X)List mailbox names in directory matching pattern. Using Google's XLIST extension

    (typ, [data]) = <instance>.xlist(directory='""', pattern='*')

    'data' is list of XLIST responses.
    """
    name = 'XLIST'
    typ, dat = self._simple_command(name, directory, pattern)
    return self._untagged_response(typ, dat, name)


def parse_flags(headers):
    """
    Parses flags from headers using Python's `ParseFlags`.

    It drops all the \ in all the flags if it exists, to
    hide the details of the protocol.

    """
    def _parse_flag(f):
        if f.startswith('\\'):
            return f[1:]
        else:
            return f

    return set(map(_parse_flag, ParseFlags(headers)))

def fetchGmail():
  while True:
    email = None
    task = None
    gc.collect()
    task = db.popTask()
    if task is None:
      time.sleep(3)
      continue
    if task['timestamp'] > datetime.now(pytz.UTC): # if the task is to be served in the future
      db.pushTaskObject(task)
      time.sleep(3)
      continue
    try:
      email = task['email']
      imap_conn = None
      print 'processing', email#, 'that was queued at', task['timestamp']
      state = db.getState(email, None)
      print "Using fetcher", state
      if state is None: continue
      lastuid = int(state['lastuid'])
      credentials = oauth2client.client.OAuth2Credentials.from_json(state['credentials'])
      version = int(state['version'])

      # renew access token if expired
      if credentials.access_token_expired:
        credentials.refresh(httplib2.Http())
      
      authstring = GenerateOAuth2String(email, credentials.access_token, base64_encode=False)
      imap_conn = ADV_IMAP4_SSL('imap.gmail.com')
      imap_conn.authenticate('XOAUTH2', lambda x: authstring)
    except KeyboardInterrupt:
      # add the task again for fetching
      if email: db.pushTask(email, None)
      print 'interrupted'
      return 
    except:
      db.log(email=email, ip=None, module="fetcher", msg=traceback.format_exc(), level=logging.ERROR)
      if imap_conn: imap_conn.logout()
      continue
    try:
      all = getAllMailMailbox(imap_conn)
      if all is None:
        imap_conn.logout()
        db.log(email=email, ip=None, module="fetcher", msg="all mail not enabled")
        state['imap'] = True
        db.storeState(email, None, state)
        # add the fetching task again to the queue with 5min delay
        task['timestamp'] = datetime.now(pytz.UTC) + timedelta(minutes=3)
        db.pushTaskObject(task)
        continue
      elif 'imap' in state:
        del state['imap']
        db.storeState(email, None, state)
      #db.markTaskForImap(email)
      #db.markTaskForEmail(email)

      imap_conn.select(all)
      state['working'] = True
      db.storeState(email, None, state)

      append = False
      firstTime = False
      if lastuid > 0:
        emails = db.getEmails(email, version, None)
        append = True
      else:
        emails = []
        firstTime = True
      ok, data = imap_conn.uid('search', None, 'UID', str(lastuid+1) + ':*')
      uids = [int(d) for d in data[0].split()]
      uids = uids[-LIMIT_NEMAILS:]
      
      # ignore if the last uid is less or equal to the result 
      if len(uids)==1 and lastuid >= uids[0]: uids = []
      
      total = len(uids)
      db.log(email=email, ip=None, module="fetcher", msg=str(total) + " new emails since last login")
      loaded = 0
      start = 0
      
      fetchtime = 0
      parsingtime = 0
      while loaded < total:
        tmptime = time.time()
        #print str(uids[min(start, len(uids)-1)])+ ":" + str(uids[min(start+JUMP-1, len(uids)-1)])
        ok, data = imap_conn.uid('fetch', str(uids[min(start, len(uids)-1)])+ ":" + str(uids[min(start+JUMP-1, len(uids)-1)]), '(UID X-GM-LABELS FLAGS X-GM-THRID BODY.PEEK[HEADER.FIELDS (FROM TO CC Date)])')
        fetchtime += (time.time() - tmptime)
        # for each email
        tmptime = time.time()
        for i in xrange(0,len(data),2):
          loaded+=1
          emails.append(data[i])

        parsingtime += (time.time() - tmptime)
        perc = (loaded*100.0)/total
        if len(emails) >= REFRESH_NETWORK or loaded >= total:
          if append:
            db.storeEmails(email, emails, version, None)
            append = False
          else:
            # store the file
            db.storeEmails(email, emails, version + 1, None)
            state['version'] = version + 1
            version+=1
          # update state
          state['lastuid'] = uids[min(start+JUMP-1, len(uids)-1)]
          db.storeState(email, None, state)
          emails = []
          db.log(email=email, ip=None, module="fetcher", msg="new version %s stored in the db" % version)        
        start+=JUMP
      imap_conn.logout()
      if firstTime:
        db.pushNotifyDone(email)
        db.log(email=email, ip=None, module="fetcher", msg="marked for email")    
      db.log(email=email, ip=None, module="fetcher", msg="done fetching. Network time: %ds. Parsing time: %ds." % (fetchtime, parsingtime))    
      #state = db.getState(email)
      if 'working' in state: del state['working']
      # delete the refresh tokens for security reasons
      if 'credentials' in state: del state['credentials']
      db.storeState(email, None, state)
    except KeyboardInterrupt:
      # add the task again for fetching
      if email: db.pushTask(email, None)
      print 'interrupted'
      return
    except:
      db.log(email=email, ip=None, module="fetcher", msg=traceback.format_exc(), level=logging.ERROR)
      if imap_conn: imap_conn.logout()
      # add the task again for fetching
      if email: db.pushTask(email, None)



nworkers = 100
proc = []
for i in xrange(nworkers):
  proc.append(Process(target=fetch))
  proc[i].start()

# wait for the processes to finish
for i in xrange(nworkers):
  proc[i].join()

print 'all processes have finished'

