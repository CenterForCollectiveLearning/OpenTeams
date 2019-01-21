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
import requests
import base64
import uuid
from datetime import datetime, timedelta
from imaplib import ParseFlags
import subprocess, signal
import os
REFRESH_NETWORK = 10000 # regenerate network whenever REFRESH_NETWORK emails have been fetched
JUMP = 500 # read 1000f emails at once, this is an optimal value
LIMIT_NEMAILS = 300*1000 # limit to 150K emails for performance


graph_endpoint = 'https://graph.microsoft.com/v1.0{0}'
def make_api_call(method, url, token, user_email, payload=None, parameters=None):
    # Send these headers with all API calls
    headers = {'User-Agent': 'TEAMS/1.0',
               'Authorization': 'Bearer {0}'.format(token),
               'Accept': 'application/json',
               'X-AnchorMailbox': user_email}
    # Use these headers to instrument calls. Makes it easier
    # to correlate requests and responses in case of problems
    # and is a recommended best practice.
    request_id = str(uuid.uuid4())
    instrumentation = {'client-request-id': request_id,
                       'return-client-request-id': 'true'}
    headers.update(instrumentation)
    response = None

    if (method.upper() == 'GET'):
      response = requests.get(url, headers=headers, params=parameters)
    elif (method.upper() == 'DELETE'):
      response = requests.delete(url, headers=headers, params=parameters)
    elif (method.upper() == 'PATCH'):
      headers.update({'Content-Type': 'application/json'})
      response = requests.patch(url, headers=headers, data=json.dumps(payload), params=parameters)
    elif (method.upper() == 'POST'):
      headers.update({'Content-Type': 'application/json'})
      response = requests.post(url, headers=headers, data=json.dumps(payload), params=parameters)

    return response

def get_me(access_token):
    get_me_url = graph_endpoint.format('/me')
    query_parameters = {'$select': '*'} #{'$select': 'displayName,givenName,surname,mail'}

    r = make_api_call('GET', get_me_url, access_token, "", parameters = query_parameters)

    if (r.status_code == requests.codes.ok):
      return r.json()
    else:
      return "{0}: {1}".format(r.status_code, r.text)

def get_my_messages(access_token, user_email, skip, total, base_skip, first_time):
    get_messages_url = graph_endpoint.format('/me/messages') #mailfolders/inbox/messages /contacts
    # get_messages_url = outlook_api_endpoint.format('/Me/MailFolders/Inbox/Messages')
    if base_skip != 0: #DESC
        if first_time:
          print "DESC first time get messages"
          if total < JUMP:
              top = total
          else:
              top = JUMP
          query_parameters = {'$select': 'id, sentDateTime, from, toRecipients, ccRecipients, isRead',
                              '$orderby': 'sentDateTime DESC',
                              '$top': str(top)} #str(LIMIT_NEMAILS)}
        else:
          query_parameters = {'$select': 'id, sentDateTime, from, toRecipients, ccRecipients, isRead',
                              '$orderby': 'sentDateTime DESC',
                              '$skip': str(skip),
                              '$top': str(JUMP)}
                              # '$top': str(total)}
    else:
        if skip == 0: #same as if first_time
          print "ASC first time get messages"
          query_parameters = {'$select': 'id, sentDateTime, from, toRecipients, ccRecipients, isRead',
                              '$orderby': 'sentDateTime ASC',
                              # '$skip': str(skip),
                              '$top': str(JUMP)} #str(LIMIT_NEMAILS)}
        else:
          query_parameters = {'$select': 'id, sentDateTime, from, toRecipients, ccRecipients, isRead',
                              '$orderby': 'sentDateTime ASC',
                              '$skip': str(skip),
                              '$top': str(JUMP)}
                              # '$top': str(total)}
    print "skip", skip, str(skip)

    r = make_api_call('GET', get_messages_url, access_token, user_email, parameters = query_parameters)

    if (r.status_code == requests.codes.ok):
      return r.json()
    else:
      return "{0}: {1}".format(r.status_code, r.text)

def get_my_messages_less(access_token, user_email, skip, total, base_skip, first_time):
    get_messages_url = graph_endpoint.format('/me/messages') #mailfolders/inbox/messages /contacts
    # get_messages_url = outlook_api_endpoint.format('/Me/MailFolders/Inbox/Messages')
    if base_skip != 0: #DESC
        if first_time:
          print "DESC first time get messages"
          if total < JUMP:
              top = total
          else:
              top = JUMP
          query_parameters = {'$select': 'id, sentDateTime, from, toRecipients, ccRecipients, isRead',
                              '$orderby': 'sentDateTime DESC',
                              '$top': str(top)} #str(LIMIT_NEMAILS)}
        else:
          query_parameters = {'$select': 'id, sentDateTime, from, toRecipients, ccRecipients, isRead',
                              '$orderby': 'sentDateTime DESC',
                              '$skip': str(skip),
                              '$top': str(JUMP / 5)}
                              # '$top': str(total)}
    else:
        if skip == 0: #same as if first_time
          print "ASC first time get messages"
          query_parameters = {'$select': 'id, sentDateTime, from, toRecipients, ccRecipients, isRead',
                              '$orderby': 'sentDateTime ASC',
                              # '$skip': str(skip),
                              '$top': str(JUMP)} #str(LIMIT_NEMAILS)}
        else:
          query_parameters = {'$select': 'id, sentDateTime, from, toRecipients, ccRecipients, isRead',
                              '$orderby': 'sentDateTime ASC',
                              '$skip': str(skip),
                              '$top': str(JUMP / 5)}
                              # '$top': str(total)}
    print "skip less", skip, str(skip)

    r = make_api_call('GET', get_messages_url, access_token, user_email, parameters = query_parameters)

    if (r.status_code == requests.codes.ok):
      return r.json()
    else:
      return "{0}: {1}".format(r.status_code, r.text)

def get_my_messages_ids(access_token, skip, user_email):
    get_messages_url = graph_endpoint.format('/me/messages') #mailfolders/inbox/messages /contacts
    # get_messages_url = outlook_api_endpoint.format('/Me/MailFolders/Inbox/Messages')
    query_parameters = {'$select': 'id',
                        '$skip': str(skip),
                        '$top': str(JUMP), #str(LIMIT_NEMAILS),
                        '$orderby': 'sentDateTime ASC'}
    # print "skip ids", skip
    r = make_api_call('GET', get_messages_url, access_token, user_email, parameters = query_parameters)

    if (r.status_code == requests.codes.ok):
      return r.json()
    else:
      return "{0}: {1}".format(r.status_code, r.text)

def get_my_messages_ids_less(access_token, skip, user_email):
    get_messages_url = graph_endpoint.format('/me/messages') #mailfolders/inbox/messages /contacts
    # get_messages_url = outlook_api_endpoint.format('/Me/MailFolders/Inbox/Messages')
    query_parameters = {'$select': 'id',
                        '$skip': str(skip),
                        '$top': str(JUMP / 5), #str(LIMIT_NEMAILS),
                        '$orderby': 'sentDateTime ASC'}
    # print "skip ids", skip
    r = make_api_call('GET', get_messages_url, access_token, user_email, parameters = query_parameters)

    if (r.status_code == requests.codes.ok):
      return r.json()
    else:
      return "{0}: {1}".format(r.status_code, r.text)

def fetch():
  while True:
    email = None
    task = None
    gc.collect()
    task = db.popOutlookTask()
    if task is None:
      time.sleep(3)
      continue
    if task['timestamp'] > datetime.now(pytz.UTC): # if the task is to be served in the future
      db.pushOutlookTaskObject(task)
      time.sleep(3)
      continue
    try:
      email = task['email']
      print 'processing', email#, 'that was queued at', task['timestamp']
      state = db.getState(email, None)
      print "Using fetcher", state
      if state is None: continue
      lastuid = state['lastuid']
      credentials = state['credentials']
      access_token = credentials['access_token']
      version = int(state['version'])

      # # renew access token if expired
      # if credentials.access_token_expired:
      #   credentials.refresh(httplib2.Http())

    except KeyboardInterrupt:
      # add the task again for fetching
      if email: db.pushOutlookTask(email, None)
      print 'interrupted'
      #kill all the process of outlookfetcher.py running
      p = subprocess.Popen(['ps', '-A'], stdout=subprocess.PIPE)
      out, err = p.communicate()
      for line in out.splitlines():
        if 'outlookfetcher' in line:
          pid = int(line.split(None, 1)[0])
          os.kill(pid, signal.SIGKILL)
      return 
    except:
      db.log(email=email, ip=None, module="fetcher", msg=traceback.format_exc(), level=logging.ERROR)
      continue
    try:
      all = get_me(access_token)
      if all is None:
        db.log(email=email, ip=None, module="fetcher", msg="all mail not enabled")
        db.storeState(email, None, state)
        # add the fetching task again to the queue with 5min delay
        task['timestamp'] = datetime.now(pytz.UTC) + timedelta(minutes=3)
        db.pushOutlookTaskObject(task)
        continue

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
      email_ids = get_my_messages_ids(access_token, 0, email)
      # print email_ids
      uids = [d['id'] for d in email_ids['value']]
      while '@odata.nextLink' in email_ids:
          skip = email_ids['@odata.nextLink'][email_ids['@odata.nextLink'].index('skip=')+5:email_ids['@odata.nextLink'].index('&$order')]
          print 'getting ids new skip', skip
          email_ids = get_my_messages_ids(access_token, skip, email)
          for d in email_ids['value']:
              uids.append(d['id'])
          print "email ids length", len(uids)

          # if '@odata.nextLink' not in email_ids:
          #     skip = int(skip) + len(email_ids['value'])
          #     email_ids = get_my_messages_ids_less(access_token, skip, email)
          #     for d in email_ids['value']:
          #         uids.append(d['id'])
          #     print "email ids length less", len(uids)
      uids = uids[-LIMIT_NEMAILS:]
      # print "lastuid", lastuid
      base_skip = 0
      if lastuid > 0 and lastuid in uids:
        base_skip = uids.index(lastuid)+1
        uids = uids[uids.index(lastuid)+1:]
      
      # ignore if the last uid is less or equal to the result 
      if len(uids)==0: uids = []
      
      total = len(uids)
      if total > LIMIT_NEMAILS:
        base_skip += (total - LIMIT_NEMAILS)
      db.log(email=email, ip=None, module="fetcher", msg=str(total) + " new emails since last login")
      loaded = 0
      start = 0
      print "total", total
      
      fetchtime = 0
      parsingtime = 0
      skip = base_skip
      email_data0 = None
      first_time = True
      if len(emails) >= REFRESH_NETWORK:
          emails = []
          append = False
      while loaded < total:
        tmptime = time.time()
        if email_data0 is not None and '@odata.nextLink' in email_data0:
            # print email_data0['@odata.nextLink']
            first_time = False
            skip = email_data0['@odata.nextLink'][email_data0['@odata.nextLink'].index('skip=')+5:]
            if skip.find('&') != -1:
                skip = skip[:skip.index('&')]
        # elif email_data0 is not None:
        #     #see if it's really no more emails or just api error
        #     first_time = False
        #     skip = int(skip) + len(email_data)
        #     email_data0 = get_my_messages_less(access_token, email, skip, total, base_skip, first_time)
        #     email_data = email_data0['value']
        #     print "email_data less", len(email_data)
        #
        #     fetchtime += (time.time() - tmptime)
        #     # for each email
        #     tmptime = time.time()
        #     if append == False:
        #         for i in xrange(0, len(email_data)):
        #             loaded += 1
        #             # print email_data[i]
        #             parsed_email = db.formatOutlookEmails(email, email_data[i])
        #             # print parsed_email
        #             if parsed_email != None:
        #                 emails.append(parsed_email)
        #     else:
        #         for i in xrange(0, len(email_data)):
        #             loaded += 1
        #             parsed_email = db.formatOutlookEmails(email, email_data[i])
        #             # print parsed_email
        #             emails.append(parsed_email)
        #     parsingtime += (time.time() - tmptime)

        print "getting messages, skip now is", skip
        email_data0 = get_my_messages(access_token, email, skip, total, base_skip, first_time)
        email_data = email_data0['value']
        print "email_data", len(email_data)
        fetchtime += (time.time() - tmptime)
        # for each email
        tmptime = time.time()
        if append == False:
          for i in xrange(0, len(email_data)):
            loaded += 1
            # print email_data[i]
            parsed_email = db.formatOutlookEmails(email, email_data[i])
            # print parsed_email
            if parsed_email != None:
                emails.append(parsed_email)
        else:
          for i in xrange(0, len(email_data)):
            loaded += 1
            parsed_email = db.formatOutlookEmails(email, email_data[i])
            # print parsed_email
            emails.append(parsed_email)

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
          print "emails length", len(emails)
          state['lastuid'] = uids[min(start+JUMP-1, len(uids)-1)]
          db.storeState(email, None, state)
          emails = []
          db.log(email=email, ip=None, module="fetcher", msg="new version %s stored in the db" % version)        
        start+=JUMP
      if firstTime:
        db.log(email=email, ip=None, module="fetcher", msg="marked for email")
      db.log(email=email, ip=None, module="fetcher", msg="done fetching. Network time: %ds. Parsing time: %ds." % (fetchtime, parsingtime))    
      #state = db.getState(email)
      if 'working' in state: del state['working']
      # delete the refresh tokens for security reasons
      if 'credentials' in state: del state['credentials']
      db.storeState(email, None, state)
    except KeyboardInterrupt:
      # add the task again for fetching
      if email: db.pushOutlookTask(email, None)
      print 'interrupted'
      # kill all the process of outlookfetcher.py running
      p = subprocess.Popen(['ps', '-A'], stdout=subprocess.PIPE)
      out, err = p.communicate()
      for line in out.splitlines():
        if 'outlookfetcher' in line:
          pid = int(line.split(None, 1)[0])
          os.kill(pid, signal.SIGKILL)
      return
    except:
      db.log(email=email, ip=None, module="fetcher", msg=traceback.format_exc(), level=logging.ERROR)
      # add the task again for fetching
      if email: db.pushOutlookTask(email, None)


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


imaplib.Commands['XLIST'] = ('AUTH', 'SELECTED')


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
        if task['timestamp'] > datetime.now(pytz.UTC):  # if the task is to be served in the future
            db.pushTaskObject(task)
            time.sleep(3)
            continue
        try:
            email = task['email']
            imap_conn = None
            print 'processing', email  # , 'that was queued at', task['timestamp']
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
            # db.markTaskForImap(email)
            # db.markTaskForEmail(email)

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
            ok, data = imap_conn.uid('search', None, 'UID', str(lastuid + 1) + ':*')
            uids = [int(d) for d in data[0].split()]
            uids = uids[-LIMIT_NEMAILS:]

            # ignore if the last uid is less or equal to the result
            if len(uids) == 1 and lastuid >= uids[0]: uids = []

            total = len(uids)
            db.log(email=email, ip=None, module="fetcher", msg=str(total) + " new emails since last login")
            loaded = 0
            start = 0

            fetchtime = 0
            parsingtime = 0
            while loaded < total:
                tmptime = time.time()
                # print str(uids[min(start, len(uids)-1)])+ ":" + str(uids[min(start+JUMP-1, len(uids)-1)])
                ok, data = imap_conn.uid('fetch', str(uids[min(start, len(uids) - 1)]) + ":" + str(
                    uids[min(start + JUMP - 1, len(uids) - 1)]),
                                         '(UID X-GM-LABELS FLAGS X-GM-THRID BODY.PEEK[HEADER.FIELDS (FROM TO CC Date)])')
                fetchtime += (time.time() - tmptime)
                # for each email
                tmptime = time.time()
                for i in xrange(0, len(data), 2):
                    loaded += 1
                    emails.append(data[i])

                parsingtime += (time.time() - tmptime)
                perc = (loaded * 100.0) / total
                if len(emails) >= REFRESH_NETWORK or loaded >= total:
                    if append:
                        db.storeEmails(email, emails, version, None)
                        append = False
                    else:
                        # store the file
                        db.storeEmails(email, emails, version + 1, None)
                        state['version'] = version + 1
                        version += 1
                    # update state
                    state['lastuid'] = uids[min(start + JUMP - 1, len(uids) - 1)]
                    db.storeState(email, None, state)
                    emails = []
                    db.log(email=email, ip=None, module="fetcher", msg="new version %s stored in the db" % version)
                start += JUMP
            imap_conn.logout()
            if firstTime:
                db.pushNotifyDone(email)
                db.log(email=email, ip=None, module="fetcher", msg="marked for email")
            db.log(email=email, ip=None, module="fetcher",
                   msg="done fetching. Network time: %ds. Parsing time: %ds." % (fetchtime, parsingtime))
            # state = db.getState(email)
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



nworkers = 2
proc = []
for i in xrange(nworkers):
  if i < nworkers:
    proc.append(Process(target=fetch))
  # else:
  #   proc.append(Process(target=fetchGmail))
  proc[i].start()

# wait for the processes to finish
for i in xrange(nworkers):
  proc[i].join()

print 'all processes have finished'

