import math
import time
import tornado
import tornado.ioloop
import tornado.web
import tornado.escape
import tornado.log
import tornado.options
import tornado.httpserver
from tornado.escape import json_encode
from oauth2client.client import flow_from_clientsecrets
from oauth2client.file import Storage
# from oauth2client.multistore_file import get_credential_storage
import json
import string
import random
import sys
import httplib2
import os
import os.path
from tornado.web import URLSpec
import db
import base64
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from tornado.websocket import WebSocketHandler
import base64
import uuid
import emailer
import email.utils
import traceback
import logging
import pytz
from db import db as db_direct
import re
import csv
import oauth2client.client
import requests
from bson.json_util import dumps
from selenium import webdriver
import numpy as np
from scipy import stats
from slackclient import SlackClient
from ast import literal_eval
import networkx as nx
from networkx.readwrite import json_graph

flag = 1
bet_flag = 1
graph_endpoint = 'https://graph.microsoft.com/v1.0{0}'
# outlook_api_endpoint = 'https://outlook.office.com/api/v2.0{0}'

def match_personality(x):
  return {
    0: 'Open-Mindedness',
    1: 'Conscientiousness',
    2: 'Extraversion',
    3: 'Agreeableness',
    4: 'Negative Emotionality'
  }[x]

########### GENERIC HANDLERS ####################
#
# All handlers should extend the Basic handler
class BaseHandler(tornado.web.RequestHandler):
  # @tornado.web.asynchronous
  # def get(self):
  #    self.write("This is your response")
  #    self.finish()
  def _prepare_context(self):
    self._context = {}
    self._context['debug'] = tornado.options.options.debug
    self._context['exhibit'] = tornado.options.options.exhibit

  def prepare(self):
    self._prepare_context()
    self.set_header("Access-Control-Allow-Origin", "*")
    self.set_header("Access-Control-Allow-Methods", "HEAD, GET, POST, PUT, DELETE")

  def get_current_user(self):
    return self.get_secure_cookie("email")

  def get_current_study(self):
    return self.get_secure_cookie("studyid")

  def get_authid(self):
    return self.get_secure_cookie("authrequestid")

  def unset_authid(self):
    self.clear_cookie("authrequestid")

  def set_authid(self, authid):
    self.set_secure_cookie("authrequestid", authid)

  def render_string(self, template_name, **kwargs):
    """Override default render_string, add context to template."""
    assert "context" not in kwargs, "context is a reserved word for \
            template context valuable."
    kwargs['context'] = self._context

    return super(BaseHandler, self).render_string(template_name, **kwargs)

  def stream_file(self,f):
    while True:
      data = f.read(1024*1024) # 1MB at a time
      if data == "": break
      self.write(data)
      self.flush()

  def get_api_response(self, credentials, uri):
    http = credentials.authorize(httplib2.Http())
    response, content = http.request(uri)
    content = json.loads(content)
    # print "content", response
    return content

  def update_api_response(self, credentials, uri):
    http = credentials.access(httplib2.Http())
    response, content = http.request(uri)
    content = json.loads(content)
    return content



  def slack_get_token_from_code(self, auth_code, redirect_uri):
    # Build the post form for the token request
    post_data = { 'grant_type': 'authorization_code',
                  'code': auth_code,
                  'redirect_uri': redirect_uri,
                  'scope': client_info_slack['web']['scope'],
                  'client_id': client_info_slack['web']['client_id'],
                  'client_secret': client_info_slack['web']['client_secret']
                }

    r = requests.post(client_info_slack['web']['token_uri'], data = post_data)

    try:
      return r.json()
    except:
      return 'Error retrieving token: {0} - {1}'.format(r.status_code, r.text)


  def get_user_agent(self):
    # Check for custom user-agent and append if found
    if self.custom_user_agent:
      custom_ua_list = ["/".join(client_info) for client_info in self.custom_user_agent]
      custom_ua_string = " ".join(custom_ua_list)
      self.default_user_agent['custom'] = custom_ua_string

    # Concatenate and format the user-agent string to be passed into request headers
    ua_string = []
    for key, val in self.default_user_agent.items():
      ua_string.append(val)

    user_agent_string = " ".join(ua_string)
    return user_agent_string

  def get_token_from_code(self, auth_code, redirect_uri):
    # Build the post form for the token request
    post_data = { 'grant_type': 'authorization_code',
                  'code': auth_code,
                  'redirect_uri': redirect_uri,
                  'scope': client_info_outlook['web']['scope'],
                  'client_id': client_info_outlook['web']['client_id'],
                  'client_secret': client_info_outlook['web']['client_secret']
                }

    r = requests.post(client_info_outlook['web']['token_uri'], data = post_data)

    try:
      return r.json()
    except:
      return 'Error retrieving token: {0} - {1}'.format(r.status_code, r.text)

  def get_token_from_refresh_token(self, refresh_token, redirect_uri):
    # Build the post form for the token request
    post_data = {'grant_type': 'refresh_token',
                 'refresh_token': refresh_token,
                 'redirect_uri': redirect_uri,
                 'scope': client_info_outlook['web']['scope'],
                 'client_id': client_info_outlook['web']['client_id'],
                 'client_secret': client_info_outlook['web']['client_secret']
                 }

    r = requests.post(client_info_outlook['web']['token_uri'], data=post_data)

    try:
      return r.json()
    except:
      return 'Error retrieving token: {0} - {1}'.format(r.status_code, r.text)

  def make_api_call(self, method, url, token, user_email, payload = None, parameters = None):
    # Send these headers with all API calls
    headers = { 'User-Agent' : 'TEAMS/1.0',
                'Authorization' : 'Bearer {0}'.format(token),
                'Accept' : 'application/json',
                'X-AnchorMailbox' : user_email }
    # Use these headers to instrument calls. Makes it easier
    # to correlate requests and responses in case of problems
    # and is a recommended best practice.
    request_id = str(uuid.uuid4())
    instrumentation = { 'client-request-id' : request_id,
                        'return-client-request-id' : 'true' }
    headers.update(instrumentation)
    print url
    response = None

    if (method.upper() == 'GET'):
        response = requests.get(url, headers = headers, params = parameters)
    elif (method.upper() == 'DELETE'):
        response = requests.delete(url, headers = headers, params = parameters)
    elif (method.upper() == 'PATCH'):
        headers.update({ 'Content-Type' : 'application/json' })
        response = requests.patch(url, headers = headers, data = json.dumps(payload), params = parameters)
    elif (method.upper() == 'POST'):
        headers.update({ 'Content-Type' : 'application/json' })
        response = requests.post(url, headers = headers, data = json.dumps(payload), params = parameters)

    return response

  def get_me(self, access_token):
    get_me_url = graph_endpoint.format('/me')
    # get_me_url = outlook_api_endpoint.format('/Me')

    # Use OData query parameters to control the results
    #  - Only return the displayName and mail fields
    query_parameters = {'$select': '*'} #{'$select': 'displayName,givenName,surname,mail'}

    r = self.make_api_call('GET', get_me_url, access_token, "", parameters = query_parameters)

    if (r.status_code == requests.codes.ok):
      return r.json()
    else:
      return "{0}: {1}".format(r.status_code, r.text)


  def get_my_messages(self, access_token, user_email):
    get_messages_url = graph_endpoint.format('/me/messages') #mailfolders/inbox/messages /contacts
    # get_messages_url = outlook_api_endpoint.format('/Me/MailFolders/Inbox/Messages')

    # Use OData query parameters to control the results
    #  - Only first 10 results returned
    #  - Only return the ReceivedDateTime, Subject, and From fields
    #  - Sort the results by the ReceivedDateTime field in descending order
    query_parameters = {'$select': 'sentDateTime, from, toRecipients, ccRecipients',
                        '$orderby': 'sentDateTime ASC',
                        # '$top': '1000',
                        '$skip': '158'} #'sentDateTime, from, toRecipients, ccRecipients'
                       #'$orderby': 'receivedDateTime DESC'

    r = self.make_api_call('GET', get_messages_url, access_token, user_email, parameters = query_parameters)

    print r.json()
    print r.json()['value']
    print len(r.json()['value'])
    if (r.status_code == requests.codes.ok):
      return r.json()
    else:
      return "{0}: {1}".format(r.status_code, r.text)


# Handlers that require user to be logged in should extent this handler
class LoggedInRequiredHandler(BaseHandler):
  def prepare(self):
    super(LoggedInRequiredHandler, self).prepare()
    if self.current_user is None: self.redirect(self.reverse_url('index'))

# Handlers that require user to have auth request should extent this handler
class AuthRequestRequiredHandler(BaseHandler):
  def prepare(self):
    super(AuthRequestRequiredHandler, self).prepare()
    if self.get_authid() is None: self.redirect(self.reverse_url('index'))

########## END GENERIC HANDLERS ###############################

########### ALL HANDLERS BEGIN HERE ###############
# def read_credentials(fname):
#     """Reads JSON with credentials from file."""
#     if os.path.isfile(fname):
#         f = open(fname, "r")
#         credentials = AuthorizerReturned.credentials.to_json(f.read())
#         f.close()
#     else:
#         credentials = None
#
#     return credentials
#
# def write_credentials(fname, credentials):
#     """Writes credentials as JSON to file."""
#     f = file(fname, "w")
#     f.write(credentials.to_json())
#     f.close()

# class SlackLogin(BaseHandler):
#   def get(self):
#     try:
#       self.redirect("https://teams.media.mit.edu")
#     except:
#       self.redirect(self.reverse_url('busy'))

class AuthorizerReturned(BaseHandler):
  credentials = ""
  uri = ""
  code = ""
  def get(self):
    try:
      print self.request.protocol + "://" + self.request.host + "/" + client_info['web']['redirect_uris'][0]
      redirect_uri = self.request.protocol + "://" + self.request.host + "/" + client_info['web']['redirect_uris'][0]
      flow = flow_from_clientsecrets('client_secrets.json', scope=client_info['web']['scope'], redirect_uri=redirect_uri)
      AuthorizerReturned.code = self.get_argument("code", None)
      if AuthorizerReturned.code is None:
        db.log(email=None, ip=self.request.remote_ip, module="AuthorizerReturned", msg='rejected MITeams')
        # self.redirect(self.reverse_url('index'))
        self.redirect(self.reverse_url('busy'))
        return
      studyid = self.get_current_study()
      AuthorizerReturned.credentials = flow.step2_exchange(AuthorizerReturned.code)
      AuthorizerReturned.uri = "https://www.googleapis.com/oauth2/v2/userinfo/?alt=json" # user info uri
      userinfo = self.get_api_response(AuthorizerReturned.credentials, AuthorizerReturned.uri)
      email = userinfo['email']
      print userinfo
      # we practically have the email now

      # store refresh token
      state = db.getState(email, studyid)

      if state is None:
        state = {'email': email, 'userinfo' : userinfo, 'lastuid': 0, 'version': -1} # new user
        if studyid: state['studyid'] = studyid

      # backward compatibility, store userinfo again anyway
      state['userinfo'] = userinfo

      storage = Storage('test_credentials')
      storage.put(AuthorizerReturned.credentials)


      # always store the new credentials
      state['credentials'] = AuthorizerReturned.credentials.to_json()
      db.storeState(email, studyid, state)

      # we store a secure cookie to remember that user is logged in
      self.set_secure_cookie("email", email)
      # print state

      group_id_ind = self.get_argument("state", None)
      group_id = None
      team_id = None
      new_member = False
      if group_id_ind != None:
          if group_id_ind.find('&') == -1:
              team_id = group_id_ind

              if team_id != "onlyfortest":
                new_member = db.inTeam(team_id, userinfo)
                print "auth returned team id = ", team_id
                team = db.joinTeam(team_id, userinfo)
                print "team", team

                if team != False:
                    adds = ["" for i in range(len(team['members']))]
                    for item in team['members']:
                        adds[team['members'].index(item)] = item['email']
                else:
                    self.redirect(self.reverse_url('busy'))
          else:
              group_id_ind = base64.b64decode(group_id_ind)
              print "group id + ind:", group_id_ind
              group_id = group_id_ind.split('&')[0]
              ind = int(group_id_ind.split('&')[1])
              print "auth returned group id = ", group_id, " ind = ", ind

              group = db.getGroupAdd(group_id)
              adds = ["" for i in range(len(group['members']))]
              for item in group['members']:
                  adds[group['members'].index(item)] = item['email']

      # only add if there is no other task in the queue for the same person
      if not db.hasTask(email, studyid):
        db.pushTask(email, studyid)
        print 'Pushtask with', studyid
        db.log(email=email, ip=self.request.remote_ip, module="AuthorizerReturned", msg='Added a fetching task')
      # self.redirect(self.reverse_url('viz'))

      # if restEmails == None:
      #   # l = 0
      #   self.redirect(self.reverse_url('viz'))
      # else:
      #   self.redirect(self.request.protocol + "://" + self.request.host + "/viz_join/" + rest_emails)
      #   # self.redirect(self.reverse_url('viz_join'))
      #   # self.redirect(self.request.protocol + "://" + self.request.host + "/viz_multi/" + rest_emails)

      if group_id == None and team_id == None:
        # l = 0
        self.redirect(self.reverse_url('viz'))
      elif group_id == None:
          if team_id == "onlyfortest":
            self.redirect(self.request.protocol + "://" + self.request.host + "/dotest")
          if new_member == True:
            self.redirect(self.request.protocol + "://" + self.request.host + "/teamviz/" + team_id)
          else:
            self.redirect(self.request.protocol + "://" + self.request.host + "/teamviz/" + team_id)
      else:
        if db.updateGroup(group_id, ind, email, userinfo['name']) == True:
            self.redirect(self.request.protocol + "://" + self.request.host + "/viz_join/id=" + group_id)
        else:
            print "Group id not found and can't go to viz_join"

    except:
      db.log(email=None, ip=self.request.remote_ip, module="AuthorizerReturned", msg=traceback.format_exc(), level=logging.ERROR)
      self.redirect(self.reverse_url('busy'))

class AuthorizerReturnedV2(BaseHandler):
  credentials = ""
  uri = ""
  code = ""
  def get(self):
    try:
      print self.request.protocol + "://" + self.request.host + "/" + client_info['web']['redirect_urisv2'][0]
      redirect_uri = self.request.protocol + "://" + self.request.host + "/" + client_info['web']['redirect_urisv2'][0]
      flow = flow_from_clientsecrets('client_secrets.json', scope=client_info['web']['scope'], redirect_uri=redirect_uri)
      AuthorizerReturnedV2.code = self.get_argument("code", None)
      if AuthorizerReturnedV2.code is None:
        db.log(email=None, ip=self.request.remote_ip, module="AuthorizerReturned", msg='rejected MITeams')
        # self.redirect(self.reverse_url('index'))
        self.redirect(self.reverse_url('busy'))
        return
      studyid = self.get_current_study()
      AuthorizerReturnedV2.credentials = flow.step2_exchange(AuthorizerReturnedV2.code)
      AuthorizerReturnedV2.uri = "https://www.googleapis.com/oauth2/v2/userinfo/?alt=json" # user info uri
      userinfo = self.get_api_response(AuthorizerReturnedV2.credentials, AuthorizerReturnedV2.uri)
      email = userinfo['email']
      print userinfo
      # we practically have the email now

      # store refresh token
      state = db.getState(email, studyid)

      if state is None:
        state = {'email': email, 'userinfo' : userinfo, 'lastuid': 0, 'version': -1} # new user
        if studyid: state['studyid'] = studyid

      # backward compatibility, store userinfo again anyway
      state['userinfo'] = userinfo

      storage = Storage('test_credentials')
      storage.put(AuthorizerReturnedV2.credentials)


      # always store the new credentials
      state['credentials'] = AuthorizerReturnedV2.credentials.to_json()
      db.storeState(email, studyid, state)

      # we store a secure cookie to remember that user is logged in
      self.set_secure_cookie("email", email)
      # print state

      group_id_ind = self.get_argument("state", None)
      group_id = None
      team_id = None
      new_member = False
      if group_id_ind != None:
          if group_id_ind.find('&') == -1:
              team_id = group_id_ind

              if team_id != "onlyfortest":
                new_member = db.inTeam(team_id, userinfo)
                print "auth returned team id = ", team_id
                team = db.joinTeam(team_id, userinfo)
                print "team", team

                if team != False:
                    adds = ["" for i in range(len(team['members']))]
                    for item in team['members']:
                        adds[team['members'].index(item)] = item['email']
                else:
                    self.redirect(self.reverse_url('busy'))
          else:
              group_id_ind = base64.b64decode(group_id_ind)
              print "group id + ind:", group_id_ind
              group_id = group_id_ind.split('&')[0]
              ind = int(group_id_ind.split('&')[1])
              print "auth returned group id = ", group_id, " ind = ", ind

              group = db.getGroupAdd(group_id)
              adds = ["" for i in range(len(group['members']))]
              for item in group['members']:
                  adds[group['members'].index(item)] = item['email']

      # only add if there is no other task in the queue for the same person
      if not db.hasTask(email, studyid):
        db.pushTask(email, studyid)
        print 'Pushtask with', studyid
        db.log(email=email, ip=self.request.remote_ip, module="AuthorizerReturned", msg='Added a fetching task')
      # self.redirect(self.reverse_url('viz'))

      # if restEmails == None:
      #   # l = 0
      #   self.redirect(self.reverse_url('viz'))
      # else:
      #   self.redirect(self.request.protocol + "://" + self.request.host + "/viz_join/" + rest_emails)
      #   # self.redirect(self.reverse_url('viz_join'))
      #   # self.redirect(self.request.protocol + "://" + self.request.host + "/viz_multi/" + rest_emails)

      if group_id == None and team_id == None:
        # l = 0
        self.redirect(self.reverse_url('viz'))
      elif group_id == None:
          if team_id == "onlyfortest":
            self.redirect(self.request.protocol + "://" + self.request.host + "/dotest")
          if team_id == "":
            self.redirect(self.request.protocol + "://" + self.request.host + "/viz")
          if new_member == True:
            self.redirect(self.request.protocol + "://" + self.request.host + "/teamviz/" + team_id)
          else:
            self.redirect(self.request.protocol + "://" + self.request.host + "/teamviz/" + team_id)
      else:
        if db.updateGroup(group_id, ind, email, userinfo['name']) == True:
            self.redirect(self.request.protocol + "://" + self.request.host + "/viz_join/id=" + group_id)
        else:
            print "Group id not found and can't go to viz_join"

    except:
      db.log(email=None, ip=self.request.remote_ip, module="AuthorizerReturned", msg=traceback.format_exc(), level=logging.ERROR)
      self.redirect(self.reverse_url('busy'))

class GetSlackNetwork(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    slack_team = db.getTeamToSlack(team_id)
    if slack_team:
      slack_team_id = slack_team['slack_team_id']
      the_data = db.getSlackNetwork(slack_team_id)

      if the_data:
        self.write({'success': True, 'data': the_data})
      else:
        self.write({'success': False})
    else:
      self.write({'success': False})

class AuthorizerReturnedSlack(BaseHandler):
  credentials = ""
  uri = ""
  code = ""
  def get(self):
    try:
      redirect_uri = self.request.protocol + "://" + self.request.host + "/" + client_info_slack['web']['redirect_uris'][0]
      # flow = flow_from_clientsecrets('client_secrets_outlook.json', scope=client_info_outlook['web']['scope'], redirect_uri=redirect_uri)
      AuthorizerReturned.code = self.get_argument("code", None)
      team_id = self.get_argument("state", None)
      if AuthorizerReturned.code is None:
        db.log(email=None, ip=self.request.remote_ip, module="AuthorizerReturnedSlack", msg='rejected MITeams')
        # self.redirect(self.reverse_url('busy'))
        self.redirect(self.reverse_url('busy'))
        return
      client_info_outlook['web']['code'] = AuthorizerReturned.code
      studyid = self.get_current_study()

      token = self.slack_get_token_from_code(AuthorizerReturned.code, redirect_uri)
      access_token = token['access_token']
      slack_team_id = token['team_id']
      slack_team_name = token['team_name']
      sc = SlackClient(token['access_token'])

      data = sc.api_call("users.profile.get") #identity.email
      the_user_email = data['profile']['email']
      the_user_real_name = data['profile']['real_name']

      saved_data = db.getSlackNetwork(slack_team_id)
      if saved_data:
        members = saved_data['members']
        member_ids = []
        for user in members:
          member_ids.append(user['id'])
        data = sc.api_call("users.list")
        for member in data['members']:
          if 'email' in member['profile'] and (member['id'] not in member_ids) :
            members.append({"id": member['id'], "email": member['profile']['email'], "name": member['profile']['real_name']})
          if 'email' in member['profile'] and member['profile']['email'] == the_user_email and member['profile']['real_name'] == the_user_real_name:
            the_user = member['id']

        list = saved_data['messages']
        room_ids = []
        for channel in list:
          room_ids.append(channel['id'])
        parts = ["channels.list", "groups.list", "im.list", "mpim.list"]  # "conversations.list",
        for part in parts:
          names = sc.api_call(part)
          if parts.index(part) == 0:# or parts.index(part) == 1:
            attr = "channels"
            attr2 = "members"
          elif parts.index(part) == 2:
            attr = "ims"
            attr2 = "user"
          else:
            attr = "groups"
            attr2 = "members"
          for name in names[attr]:
            if parts.index(part) == 2:
              if the_user < name[attr2]:
                room_name = the_user + "+" + name[attr2]
              else:
                room_name = name[attr2] + "+" + the_user
              users = [name[attr2], the_user]
            else:
              room_name = name['name_normalized']
              users = name[attr2]
            room_id = name['id']
            if room_id not in room_ids:
              room_ids.append(room_id)
              list.append({"id": room_id, "name": room_name, "users": users, "events": []})
            elif set(users) != set(list[room_ids.index(room_id)]['users']):
              list[room_ids.index(room_id)]['users'] = users

        for room in list:
          id = room['id']
          events = list[room_ids.index(id)]['events']
          new_events = []
          if len(events) > 0:
            data = sc.api_call("conversations.history", channel=id, oldest=events[0]['ts'])
          else:
            data = sc.api_call("conversations.history", channel=id)
          if data['ok'] == True:
            messages = data['messages']
            for message in messages:
              if 'type' in message and message['type'] == 'message':
                if 'user' in message and 'ts' in message:
                  new_events.append({"user": message['user'], "ts": message['ts']})

            while data['has_more'] == True:
              latest_ts = data['messages'][len(data['messages']) - 1]['ts']
              data = sc.api_call("conversations.history", channel=id, latest=latest_ts)
              messages = data['messages']
              for message in messages:
                if 'type' in message and message['type'] == 'message':
                  if 'user' in message and 'ts' in message:
                    new_events.append({"user": message['user'], "ts": message['ts']})
            room['events'] = new_events + events

      else:
        data = sc.api_call("users.list")
        members = []
        for member in data['members']:
          if 'email' in member['profile']:
            members.append({"id": member['id'], "email": member['profile']['email'], "name": member['profile']['real_name']})
            if member['profile']['email'] == the_user_email and member['profile']['real_name'] == the_user_real_name:
              the_user = member['id']

        list = []
        room_ids = []
        parts = ["channels.list", "groups.list", "im.list", "mpim.list"] #"conversations.list",
        # data_cv = sc.api_call("conversations.list") data_ch = sc.api_call("channels.list")
        # data_gr = sc.api_call("groups.list") data_im = sc.api_call("im.list") data_mpim = sc.api_call("mpim.list")
        for part in parts:
          names = sc.api_call(part)
          if parts.index(part) == 0:# or parts.index(part) == 1:
            attr = "channels"
            attr2 = "members"
          elif parts.index(part) == 2:
            attr = "ims"
            attr2 = "user"
          else:
            attr = "groups"
            attr2 = "members"
          for name in names[attr]:
            if parts.index(part) == 2:
              if the_user < name[attr2]:
                room_name = the_user + "+" + name[attr2]
              else:
                room_name = name[attr2] + "+" + the_user
              users = [the_user, name[attr2]]
            else:
              room_name = name['name_normalized']
              users = name[attr2]
            room_id = name['id']
            if room_id not in room_ids:
              room_ids.append(room_id)
              list.append({"id": room_id, "name": room_name, "users": users, "events": []})

        for room in list:
          id = room['id']
          events = []
          data = sc.api_call("conversations.history", channel=id)
          if data['ok'] == True:
            messages = data['messages']
            for message in messages:
              if 'type' in message and message['type'] == 'message':
                if 'user' in message and 'ts' in message:
                  events.append({"user": message['user'], "ts": message['ts']})

            while data['has_more'] == True:
              latest_ts = data['messages'][len(data['messages']) - 1]['ts']
              data = sc.api_call("conversations.history", channel=id, latest=latest_ts)
              messages = data['messages']
              for message in messages:
                if 'type' in message and message['type'] == 'message':
                  if 'user' in message and 'ts' in message:
                    events.append({"user": message['user'], "ts": message['ts']})
            room['events'] = events

      # data = sc.api_call("conversations.list")

      team = {'team_id': slack_team_id, 'team_name':slack_team_name, 'members': members, 'messages': list}
      db.storeSlackNetwork(team_id, slack_team_id, team)

      team_to_slack = {'team_id': team_id, 'slack_team_id': slack_team_id}
      db.saveTeamToSlack(team_id, team_to_slack)

      self.render('test_slack.html', data=json.dumps(team))

    except:
      db.log(email=None, ip=self.request.remote_ip, module="AuthorizerReturned", msg=traceback.format_exc(),
             level=logging.ERROR)
      self.redirect(self.reverse_url('busy'))

class AuthorizerReturnedOutlook(BaseHandler):
  credentials = ""
  uri = ""
  code = ""
  def get(self):
    try:
      print self.request.protocol + "://" + self.request.host + "/" + client_info_outlook['web']['redirect_uris'][0]
      redirect_uri = self.request.protocol + "://" + self.request.host + "/" + client_info_outlook['web']['redirect_uris'][0]
      # flow = flow_from_clientsecrets('client_secrets_outlook.json', scope=client_info_outlook['web']['scope'], redirect_uri=redirect_uri)
      AuthorizerReturned.code = self.get_argument("code", None)
      if AuthorizerReturned.code is None:
        db.log(email=None, ip=self.request.remote_ip, module="AuthorizerReturnedOutlook", msg='rejected MITeams')
        # self.redirect(self.reverse_url('index'))
        self.redirect(self.reverse_url('busy'))
        return
      client_info_outlook['web']['code'] = AuthorizerReturned.code
      studyid = self.get_current_study()

      token = self.get_token_from_code(AuthorizerReturned.code, redirect_uri)
      access_token = token['access_token']
      refresh_token = token['refresh_token']
      expires_in = token['expires_in']
      expiration = int(time.time()) + expires_in - 300
      now = int(time.time())
      if not (access_token and now < expiration):
        # Token expired
        new_tokens = self.get_token_from_refresh_token(refresh_token, redirect_uri)
        access_token = new_tokens['access_token']
        refresh_token = new_tokens['refresh_token']
        expires_in = new_tokens['expires_in']
        expiration = int(time.time()) + expires_in - 300

      original_userinfo = self.get_me(access_token)
      userinfo = {'name': original_userinfo['displayName'], 'given_name' : original_userinfo['givenName'], 'family_name': original_userinfo['surname'], 'email': original_userinfo['userPrincipalName']}
      print userinfo
      email = userinfo['email']

      # store refresh token
      state = db.getState(email, "None")
      if state is None:
        state = {'email': email, 'userinfo': userinfo, 'lastuid': 0, 'version': -1}  # new user
        if studyid: state['studyid'] = studyid

      # backward compatibility, store userinfo again anyway
      state['userinfo'] = userinfo
      state['credentials'] = {'access_token': access_token, 'refresh_token': refresh_token, 'token_expires': expiration}

      # always store the new credentials. should here be token?
      db.storeState(email, studyid, state)

      # we store a secure cookie to remember that user is logged in
      self.set_secure_cookie("email", email)

      # messages = self.get_my_messages(access_token, email)
      # print messages

      group_id_ind = self.get_argument("state", None)
      group_id = None
      team_id = None
      new_member = False
      if group_id_ind != None and group_id_ind != '':
        if group_id_ind.find('&') == -1:
          team_id = group_id_ind

          if team_id != "onlyfortest":
            new_member = db.inTeam(team_id, userinfo)
            print "auth returned team id = ", team_id
            team = db.joinTeam(team_id, userinfo)
            print "team", team

            if team != False:
              adds = ["" for i in range(len(team['members']))]
              for item in team['members']:
                adds[team['members'].index(item)] = item['email']
            else:
              self.redirect(self.reverse_url('busy'))
        else:
          group_id_ind = base64.b64decode(group_id_ind)
          print "group id + ind:", group_id_ind
          group_id = group_id_ind.split('&')[0]
          ind = int(group_id_ind.split('&')[1])
          print "auth returned group id = ", group_id, " ind = ", ind

          group = db.getGroupAdd(group_id)
          adds = ["" for i in range(len(group['members']))]
          for item in group['members']:
            adds[group['members'].index(item)] = item['email']

      # only add if there is no other task in the queue for the same person
      if not db.hasOutlookTask(email, studyid):
        db.pushOutlookTask(email, studyid)
        print 'Pushtask with', studyid
        db.log(email=email, ip=None, module="AuthOutlook", msg='Added a fetching task')

      if group_id == None and team_id == None:
        # l = 0
        self.redirect(self.reverse_url('viz'))
      elif group_id == None:
        if team_id == "onlyfortest":
          self.redirect(self.request.protocol + "://" + self.request.host + "/dotest")
        if new_member == True:
          self.redirect(self.request.protocol + "://" + self.request.host + "/teamviz/" + team_id)
        else:
          self.redirect(self.request.protocol + "://" + self.request.host + "/teamviz/" + team_id)
      else:
        if db.updateGroup(group_id, ind, email, userinfo['name']) == True:
          self.redirect(self.request.protocol + "://" + self.request.host + "/viz_join/id=" + group_id)
        else:
          print "Group id not found and can't go to viz_join"

    except:
      db.log(email=None, ip=self.request.remote_ip, module="AuthorizerReturned", msg=traceback.format_exc(),
             level=logging.ERROR)
      self.redirect(self.reverse_url('busy'))

# class AuthorizerReturnedJoin(BaseHandler):
#   credentials = ""
#   uri = ""
#   code = ""
#   def get(self, para):
#     try:
#       restEmails = para
#       print "Rest Emails: ", restEmails
#       print self.request.protocol + "://" + self.request.host + "/" + client_info['web']['redirect_uris'][0]
#       redirect_uri = self.request.protocol + "://" + self.request.host + "/" + client_info['web']['redirect_uris'][0]
#       flow = flow_from_clientsecrets('client_secrets.json', scope=client_info['web']['scope'], redirect_uri=redirect_uri)
#       AuthorizerReturnedJoin.code = self.get_argument("code", None)
#       if AuthorizerReturnedJoin.code is None:
#         db.log(email=None, ip=self.request.remote_ip, module="AuthorizerReturnedJoin", msg='rejected immersion')
#         self.redirect(self.reverse_url('index'))
#         return
#       studyid = self.get_current_study()
#       AuthorizerReturnedJoin.credentials = flow.step2_exchange(AuthorizerReturnedJoin.code)
#       AuthorizerReturnedJoin.uri = "https://www.googleapis.com/oauth2/v2/userinfo/?alt=json" # user info uri
#       userinfo = self.get_api_response(AuthorizerReturned.credentials, AuthorizerReturnedJoin.uri)
#       email = userinfo['email']
#       # we practically have the email now
#
#       # store refresh token
#       state = db.getState(email, studyid)
#
#       if state is None:
#         state = {'email': email, 'userinfo' : userinfo, 'lastuid': 0, 'version': -1} # new user
#         if studyid: state['studyid'] = studyid
#
#       # backward compatibility, store userinfo again anyway
#       state['userinfo'] = userinfo
#
#       storage = Storage('test_credentials')
#       storage.put(AuthorizerReturnedJoin.credentials)
#
#
#       # always store the new credentials
#       state['credentials'] = AuthorizerReturnedJoin.credentials.to_json()
#       # print studyid
#       if email == "junezjx@gmail.com":
#           # print "yes test"
#
#           db.storeState(email, studyid, state)
#       else:
#           db.storeState(email, studyid, state)
#
#       # we store a secure cookie to remember that user is logged in
#       self.set_secure_cookie("email", email)
#
#       # only add if there is no other task in the queue for the same person
#       if not db.hasTask(email, studyid):
#         db.pushTask(email, studyid)
#         print 'Pushtask with', studyid
#         db.log(email=email, ip=self.request.remote_ip, module="AuthorizerReturnedJoin", msg='Added a fetching task')
#       # self.redirect(self.reverse_url('viz_multi'))
#       self.redirect(self.request.host + "/viz_multi/" + restEmails)
#     except:
#       db.log(email=None, ip=self.request.remote_ip, module="AuthorizerReturnedJoin", msg=traceback.format_exc(), level=logging.ERROR)
#       self.redirect(self.reverse_url('busy'))

class AuthorizerReturnedUpdate(BaseHandler):
  def get(self):
    try:
      # print self.request.protocol + "://" + self.request.host + "/" + client_info['web']['redirect_uris'][0]
      redirect_uri = self.request.protocol + "://" + self.request.host + "/" + client_info['web']['redirect_uris'][0]
      print "Update emails"
      # flow = flow_from_clientsecrets('client_secrets.json', scope=client_info['web']['scope'], redirect_uri=redirect_uri)
      # code = AuthorizerReturned.code
      # if code is None:
      #   db.log(email=None, ip=self.request.remote_ip, module="AuthorizerReturned", msg='rejected immersion')
      #   self.redirect(self.reverse_url('index'))
      #   return
      studyid = self.get_current_study()
      # print code
      # credentials = flow.step2_exchange(code)
      uri = "https://www.googleapis.com/oauth2/v2/userinfo/?alt=json" # user info uri
      # credentials = AuthorizerReturned.credentials
      uri = AuthorizerReturned.uri
      # userinfo = self.get_api_response(credentials, uri)
      # email = userinfo['email']
      # we practically have the email now

      # store refresh token
      # state = db.getState(email, studyid)
      print "user", self.current_user
      state = db.getState(self.current_user, studyid)
      # credentials = state['credentials']
      storage = Storage('test_credentials')
      credentials = storage.get()
      # renew access token if expired
      # credentials = oauth2client.client.OAuth2Credentials.from_json(credentials)
      if credentials.access_token_expired:
        credentials.refresh(httplib2.Http())
        print "new credentials"

      userinfo = state['userinfo']
      email = userinfo['email']
      # print "cred", credentials
      state = db.getState(email, studyid)
      state['credentials'] = credentials.to_json()
      db.storeState(email, studyid, state)
      # self.update_api_response(credentials, uri)

      # if state is None:
      #   state = {'email': email, 'userinfo' : userinfo, 'lastuid': 0, 'version': -1} # new user
      #   if studyid: state['studyid'] = studyid

      # backward compatibility, store userinfo again anyway
      # state['userinfo'] = userinfo

      # always store the new credentials
      # state['credentials'] = credentials.to_json()
      # db.storeState(email, studyid, state)

      # we store a secure cookie to remember that user is logged in
      # self.set_secure_cookie("email", email)

      # only add if there is no other task in the queue for the same person
      if not db.hasTask(email, studyid):
        db.pushTask(email, studyid)
        print 'Pushtask with', studyid
        db.log(email=email, ip=self.request.remote_ip, module="UpdateEmails", msg='Added a fetching task')

      self.write(json_encode("done"))
      self.finish()
      # self.redirect(self.reverse_url('viz'))
    except:
      db.log(email=None, ip=self.request.remote_ip, module="AuthorizerReturned", msg=traceback.format_exc(), level=logging.ERROR)
      self.redirect(self.reverse_url('busy'))


class IndexStudy(BaseHandler):
  def get(self, studyid):
    # remember the studyid for the user session
    if studyid: self.set_secure_cookie("studyid", studyid)

    form_email = self.get_secure_cookie("form_email")
    if form_email is None: form_email = ''
    form_username = self.get_secure_cookie("form_username")
    if form_username is None: form_username = ''
    study = db.getStudy(studyid)
    if study == None: raise tornado.web.HTTPError(404)
    self.render('indexStudy.html', form_email=form_email, form_username=form_username, study=study)



class Index(BaseHandler):
  def get(self):
    studyid = self.get_current_study()
    if studyid: self.redirect(self.reverse_url('indexStudy', studyid))
    #if self.request.protocol == 'http': self.redirect("https://" + self.request.host) # always redirect to secure traffic
    #redirect_uri = "https://" + self.request.host + "/" + client_info['web']['redirect_uris'][0]
    #flow = flow_from_clientsecrets('client_secrets.json', scope=client_info['web']['scope'], redirect_uri=redirect_uri)
    #authurl = flow.step1_get_authorize_url()#.replace('access_type=offline', 'access_type=online')
    form_email = self.get_secure_cookie("form_email")
    if form_email is None: form_email = ''
    form_username = self.get_secure_cookie("form_username")
    if form_username is None: form_username = ''
    self.render('index.html', form_email=form_email, form_username=form_username)

class WikiLeaks(BaseHandler):
  def get(self):
    self.render('wikileaks.html')


class SubmitFeedback(LoggedInRequiredHandler):
  def post(self):
    text = self.get_argument("feedback_text")
    db.submitFeedback(self.current_user, text, self.request.remote_ip)

class SendError(LoggedInRequiredHandler):
  def post(self):
    error  = self.get_argument("json", None)
    if error is None: return
    error = json.loads(error)
    # print error
    db.storeError(self.current_user, error)

class SaveCentralities(LoggedInRequiredHandler):
  def post(self):
    stats = self.get_argument("json", None)
    team_id = self.get_argument("teamid", None)
    if stats is None or team_id is None: return
    stats = json.loads(stats)
    team_id = json.loads(team_id)
    team_id = team_id['team_id']
    db.storeCentralities(self.current_user, stats, team_id)

class SaveMergedCentralities(LoggedInRequiredHandler):
  def post(self):
    stats = self.get_argument("json", None)
    team_id = self.get_argument("teamid", None)
    if stats is None or team_id is None: return
    stats = json.loads(stats)
    team_id = json.loads(team_id)
    team_id = team_id['team_id']
    db.storeMergedCentralities(self.current_user, stats, team_id)

class SavePairs(LoggedInRequiredHandler):
  def post(self):
    stats = self.get_argument("json", None)
    team_id = self.get_argument("teamid", None)
    if stats is None or team_id is None: return
    stats = json.loads(stats)
    team_id = json.loads(team_id)
    team_id = team_id['team_id']
    db.storePairs(self.current_user, stats, team_id)

class SaveMergedPairs(LoggedInRequiredHandler):
  def post(self):
    stats = self.get_argument("json", None)
    team_id = self.get_argument("teamid", None)
    if stats is None or team_id is None: return
    stats = json.loads(stats)
    team_id = json.loads(team_id)
    team_id = team_id['team_id']
    db.storeMergedPairs(self.current_user, stats, team_id)

class SaveResponseTime(LoggedInRequiredHandler):
  def post(self):
    stats = self.get_argument("json", None)
    team_id = self.get_argument("teamid", None)
    if stats is None or team_id is None: return
    stats = json.loads(stats)
    team_id = json.loads(team_id)
    team_id = team_id['team_id']
    times = {'id': team_id, 'response_times': stats}
    db.storeResponseTime(team_id, times)

class GetResponseTime(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['team_id']
    times = db.getResponseTime(team_id)

    if times:
      self.write({'success': True, 'response_time': times['response_times']})
    else:
      self.write({'success': False})

class SaveAliases(LoggedInRequiredHandler):
  def post(self):
    stats  = self.get_argument("json", None)
    if stats is None: return
    stats = json.loads(stats)
    db.storeAliases(stats['email'], stats['aliases'], stats['timestamp'], stats['use_length'])

class SaveEmailSentTime(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    email = data['email']
    hours = data['hours']
    days = data['days']

    emailSentTime_info = {'email': email, 'hours': hours, 'days': days}
    db.storeEmailSentTime(email, emailSentTime_info)
    self.write({'success': True})

class GetEmailSentTime(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    email = data['email']
    emailSentTime = db.getEmailSentTime(email)

    if emailSentTime:
      self.write({'success': True, 'email': email, 'hours': emailSentTime['hours'], 'days': emailSentTime['days']})
    else:
      self.write({'success': False})

class SendStats(LoggedInRequiredHandler):
  def post(self):
    stats  = self.get_argument("json", None)
    # db.check_state({"email":"junezjx@gmail.com"})
    if stats is None: return
    stats = json.loads(stats)
    # db.check_state({"email":"junezjx@gmail.com"})
    db.storeStats(self.current_user, stats)

class GetStats(LoggedInRequiredHandler):
  def get(self, para):
    if para[len(para)-1] == '&':
        text = ""
    else:
        text = para[para.index('=')+1:]
    print "mm", text
    if text == "":
        ncollaborators = db.get("ncollaborators")
        nsent = db.get("nsent")
        nrcv = db.get("nrcv")
        obj = {'ncollaborators': ncollaborators, 'nsent' : nsent, 'nrcv' : nrcv }
    else:
        InvitedPerson = db_direct.statistics.find_one({"email": text})
        print "invited", InvitedPerson
        ncollaborators = InvitedPerson['ncollaborators']
        nsent = InvitedPerson["nsent"]
        nrcv = InvitedPerson["nrcv"]
        obj = {'ncollaborators': ncollaborators, 'nsent' : nsent, 'nrcv' : nrcv }
    self.set_header('Content-Encoding','gzip')
    content = db.jsonToGzip(obj)
    self.write(content)
    # print "here", db.check_state({"email":"junezjx@gmail.com"})

class AddToWaitlist(LoggedInRequiredHandler):
  def post(self):
    waitlist_email = self.get_argument("waitlist_email")
    db.waitlisting(waitlist_email, self.request.remote_ip)

class ExitTheTeam(BaseHandler):
  def get(self):
    self.render('exit_the_team.html')

class LogoutDelete(BaseHandler):
  def get(self):
    self.render('logout_delete.html')

class LogoutSave(BaseHandler):
  def get(self):
    self.render('logout_save.html')

class ImapPage(BaseHandler):
  def get(self):
    self.render('gmail/imap.html')

class BusyPage(BaseHandler):
  def get(self):
    self.render('gmail/busy.html')


class Logout(LoggedInRequiredHandler):
  def get(self):
    email = self.current_user
    studyid = self.get_current_study()
    team_id = self.get_argument('team', False)
    if email:
      self.clear_cookie("email")
      if email == 'demo@demo.com' or studyid:
        if studyid: self.clear_cookie("studyid")
        self.redirect('/')
        return
      if self.get_argument('delete', False):
        if team_id:
          team_exited = db.exitTeam(self.current_user, team_id)
        db.deleteData(email, studyid)
        #delete the user from all teams he/she is in
        db.removeFromTeams(email)
        db.log(email=email, ip=self.request.remote_ip, module="Logout", msg="logged out and deleted data")
        self.redirect(self.reverse_url('logout_delete'))
      else:
        db.log(email=email, ip=self.request.remote_ip, module="Logout", msg="logged out and saved data")
        self.redirect(self.reverse_url('logout_save'))
    # don't logout from google for the web app
    else: self.redirect('/')


class InviteName(LoggedInRequiredHandler): #LoggedInRequiredHandler
    invited_email = ""
    def post(self):
      data = json.loads(self.get_argument("json", None))
      toField = []
      toField_name = []
      groupInfo = []
      link = "https://" + self.request.host + "/viz_multi/add=" + self.current_user + "&add="
      state = db.getState(self.current_user, None)
      print "current user", self.current_user, state['userinfo']
      # email = data['email'] #self.current_user
      # name = data['name']
      # link = data['link']
      for ind in data:
        toField.append(ind['email'])
        toField_name.append(ind['name'])
        link += ind['email']
        if data.index(ind) != len(data) - 1:
            link += "&add="

        groupInfo.append({'name': ind['name'], 'email': ind['email'], 'accept': 0})
      print link

      studyid = self.get_current_study()
      state = db.getState(self.current_user, studyid)
      groupInfo.append({'name': state['userinfo']['name'], 'email': self.current_user, 'accept': 1})
      # db.saveGroup(toField, toField_name, link)
      group_id = db.saveGroup(groupInfo, link)
      print "groupInfo ", groupInfo

      host = self.request.host
      print toField, toField_name
      # print "https://" + self.request.host + "/static/email.php"

      # db.sendInvitation(self, email, name, toField, toField_name, link)
      emailer.sendEmailWithNetwork(toField, link, group_id, host, state['userinfo'])


    #   state = db.getState(self.current_user, studyid)
    #   invited = db.getInvitedState_test(InviteName.invited_email)
    #   if state is None or 'userinfo' not in state:
    #     self.redirect(self.reverse_url('index'))
    #
    #   working = 0
    #   if 'working' in state and state['working']: working = 1
    #   if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))
    #
    #   waittime = 1
    #   time = db.getTaskTimeAheadofQueue()
    #   if time is not None:
    #     now = datetime.now(pytz.UTC)
    #     if now > time:
    #       delta = now - time
    #       waittime = int(math.ceil(delta.seconds/60.0)) + 1
    #   if studyid == None: studyid = 0
    #   self.render('viz2.html', type="multi", version=state['version'], userinfo = json.dumps([state['userinfo'], invited['userinfo']]), working=working, waittime=waittime, studyid=studyid)
    #
    # def post(self):
    #   text = self.get_argument("json", None)
    #   text = json.loads(text)
    #   InviteName.invited_email = text
    #   # InviteName.get(self)


class exitTeam(LoggedInRequiredHandler):
    def get(self, para):
      team_id = para.split('=')[1]
      studyid = self.get_current_study()
      state = db.getState(self.current_user, studyid)
      team_exited = db.exitTeam(self.current_user, team_id)
      if team_exited == False:
          self.redirect(self.reverse_url('busy'))
      else:
          # db.log(email=email, ip=self.request.remote_ip, module="exitTeam", msg="exit a team") #need to record team_id
          self.redirect(self.reverse_url('exit_the_team'))

class addTeamName(BaseHandler): #LoggedInRequiredHandler
    def get(self, para):
      team_id = para
      link = "https://" + self.request.host + "/teamviz/" + team_id
      teamInfo = []
      studyid = self.get_current_study()
      state = db.getState(self.current_user, studyid)
      team_id = db.saveTeam(teamInfo, team_id, db.getPassword(team_id), link)
      if team_id == False:
          self.redirect(self.reverse_url('busy'))

class AnalysisPage(BaseHandler):
    def get(self, para):
      team_id = para.split('&')[0]
      admin = para.split('&')[1].split('+')[0]
      if len(para.split('&')[1].split('+')) > 1:
        demo = para.split('&')[1].split('+')[1]
      else:
        demo = 0
      print "team_id ", team_id

      studyid = self.get_current_study()
      if self.current_user is not None: state = db.getState(self.current_user, None)

      team = db.getTeamAdd(team_id)
      # nn = 0
      # for ii in range(0, len(team['members'])):
      #   nn += 1
      # emails = ["" for i in range(nn)]
      # usersinfo = ["" for i in range(nn)]
      # centralities = ["" for i in range(nn)]
      # emailSentTime = [0 for i in range(nn)]
      emails = []
      usersinfo = []
      centralities = []
      emailSentTime = []
      nnn = 0
      if admin is not "None":
        for ii in range(0, len(team['members'])):
          this_userinfo = db.getState(team['members'][ii]['email'], None)
          if this_userinfo is not None:
            the_userinfo = this_userinfo['userinfo']
            if 'centralities' in team['members'][ii]:
              centralities.append(team['members'][ii]['centralities'])
            else:
              centralities.append({"betweenness" : -10000, "degree" : -10000})
            emails.append(team['members'][ii]['email'])
            if 'use_length' in the_userinfo:
              use_length = the_userinfo['use_length']
            else:
              use_length = 1
            usersinfo.append({'name': the_userinfo['name'], 'given_name': the_userinfo['given_name'],
                            'family_name': the_userinfo['family_name'], 'email': the_userinfo['email'],
                            'use_length': use_length})
            emailSentTime.append(db.getEmailSentTime(team['members'][ii]['email']))
            nnn += 1
      else:
        for ii in range(0, len(team['members'])):
          if team['members'][ii]['email'] == state['userinfo']['email']:
            if 'use_length' in state['userinfo']:
              use_length = state['userinfo']['use_length']
            else:
              use_length = 1
            usersinfo.append({'name': state['userinfo']['name'], 'given_name': state['userinfo']['given_name'],
                              'family_name': state['userinfo']['family_name'], 'email': state['userinfo']['email'],
                              'use_length': use_length})
            emails.append(state['userinfo']['email'])
            if 'centralities' in team['members'][ii]:
              centralities.append(team['members'][ii]['centralities'])
            else:
              centralities.append({"betweenness" : -10000, "degree" : -10000})
            emailSentTime.append(db.getEmailSentTime(state['userinfo']['email']))
          else:
            this_userinfo = db.getState(team['members'][ii]['email'], None)
            if this_userinfo is not None:
              the_userinfo = this_userinfo['userinfo']
              emails.append(team['members'][ii]['email'])
              if 'use_length' in the_userinfo:
                use_length = the_userinfo['use_length']
              else:
                use_length = 1
              usersinfo.append({'name': the_userinfo['name'], 'given_name': the_userinfo['given_name'],
                              'family_name': the_userinfo['family_name'], 'email': the_userinfo['email'],
                                'use_length': use_length})
              if 'centralities' in team['members'][ii]:
                centralities.append(team['members'][ii]['centralities'])
              else:
                centralities.append({"betweenness": -10000, "degree": -10000})
              emailSentTime.append(db.getEmailSentTime(team['members'][ii]['email']))
              nnn += 1

      response_time = None
      times = db.getResponseTime(team_id)
      if times:
        response_time = times['response_times']
      else:
        response_time = {}

      metrics = db.getMetrics(team_id)

      personalities = []
      moralities = []
      demographics = []
      m_percent = 0
      f_percent = 0
      dict = {}
      # get demographic data for members
      now = datetime.now()
      for ii in range(0, len(emails)):
        morality = db.getMorality(emails[ii])
        if morality is None:
          moralities.append({})
        else:
          moralities.append(morality['morality'])

        demographic = db.getDemographic(emails[ii])
        if demographic is None:
          demographics.append({})
        else:
          demographics.append(demographic['demographics'])

        personality = db.getPersonality(emails[ii])
        if personality is None:
          personalities.append({})
          dict[emails[ii]] = {}
          dict[emails[ii]]['gender'] = 'n'
        else:
          personality['demographics']['age'] = int(now.year) - int(personality['demographics']['YOB'])
          personalities.append(personality)
          dict[emails[ii]] = {}
          dict[emails[ii]]['gender'] = personality['demographics']['gender']
          if dict[emails[ii]]['gender'] == 'm':
            m_percent += 1
          else:
            f_percent += 1
      total = m_percent + f_percent
      f_percent = float(f_percent) / float(total)
      m_percent = float(m_percent) / float(total)

      # replace ids with genders
      new_sample = {}
      to_list = {}
      fact_same_gender = {}
      fact_diff_gender = {}
      fact_ff = {}
      fact_mm = {}
      fact_same_gender2 = {}
      fact_diff_gender2 = {}
      fact_ff2 = {}
      fact_mm2 = {}
      sample = db.getCommunication(team_id)

      gap = {'simu': {'simu_same_gender': {}, 'simu_diff_gender': {}, 'simu_ff': {}, 'simu_mm': {}},
             'fact': {'fact_same_gender': {}, 'fact_diff_gender': {}, 'fact_ff': {}, 'fact_mm': {}},
             'pvalues': {'pvalue_same_gender': {}, 'pvalue_diff_gender': {}, 'pvalue_ff': {}, 'pvalue_mm': {}}}
      if sample:
        for the_emails in sample:
          # if 'year' in emails:
          if the_emails['year'] not in new_sample:
            new_sample[the_emails['year']] = []
            to_list[the_emails['year']] = []
            fact_same_gender[the_emails['year']] = 0
            fact_diff_gender[the_emails['year']] = 0
            fact_ff[the_emails['year']] = 0
            fact_mm[the_emails['year']] = 0
            fact_same_gender2[the_emails['year']] = 0
            fact_diff_gender2[the_emails['year']] = 0
            fact_ff2[the_emails['year']] = 0
            fact_mm2[the_emails['year']] = 0
        #
        #     gap['simu']['simu_same_gender'][the_emails['year']] = []
        #     gap['simu']['simu_diff_gender'][the_emails['year']] = []
        #     gap['simu']['simu_ff'][the_emails['year']] = []
        #     gap['simu']['simu_mm'][the_emails['year']] = []
            gap['fact']['fact_same_gender'][the_emails['year']] = 0
            gap['fact']['fact_diff_gender'][the_emails['year']] = 0
            gap['fact']['fact_ff'][the_emails['year']] = 0
            gap['fact']['fact_mm'][the_emails['year']] = 0
        #     gap['pvalues']['pvalue_same_gender'][the_emails['year']] = 0
        #     gap['pvalues']['pvalue_diff_gender'][the_emails['year']] = 0
        #     gap['pvalues']['pvalue_ff'][the_emails['year']] = 0
        #     gap['pvalues']['pvalue_mm'][the_emails['year']] = 0

          for email in the_emails['communication']:
            if email['from'] in emails and email['to'] in emails:
              new_email = {'from': dict[email['from']]['gender'], 'to': dict[email['to']]['gender'],
                           'time': email['time']}
              to_list[the_emails['year']].append(dict[email['to']]['gender'])
              if new_email['from'] == new_email['to']:
                fact_same_gender[the_emails['year']] += 1
                fact_same_gender2[the_emails['year']] += 1
                if new_email['from'] == 'm':
                  fact_mm[the_emails['year']] += 1
                  fact_mm2[the_emails['year']] += 1
                else:
                  fact_ff[the_emails['year']] += 1
                  fact_ff2[the_emails['year']] += 1
              else:
                fact_diff_gender[the_emails['year']] += 1
                fact_diff_gender2[the_emails['year']] += 1
              new_sample[the_emails['year']].append(new_email)

        for item in new_sample:
        #   new_sample[item] = sorted(new_sample[item], key=lambda x: x['time'], reverse=False)
        #
        #   times = 1000
        #   numbers_same_gender = [0 for i in range(0, times)]
        #   numbers_diff_gender = [0 for i in range(0, times)]
        #   numbers_ff = [0 for i in range(0, times)]
        #   numbers_mm = [0 for i in range(0, times)]
        #   numbers_same_gender2 = [0 for i in range(0, times)]
        #   numbers_diff_gender2 = [0 for i in range(0, times)]
        #   numbers_ff2 = [0 for i in range(0, times)]
        #   numbers_mm2 = [0 for i in range(0, times)]
        #
        #   #time window = 1 month
        #   time_end_timestamp = int(new_sample[item][len(new_sample[item]) - 1]['time'])/1000
        #   window_end = datetime.fromtimestamp(int(new_sample[item][0]['time'])/1000) + timedelta(days=30) #relativedelta(months=+6)
        #   window_end_timestamp = time.mktime((window_end).timetuple())
        #   start = 0
        #   end = len(new_sample[item])
        #   while window_end_timestamp <= time_end_timestamp:
        #     emails_in_window = []
        #     to_list_in_window = []
        #     for k in range(start, end):
        #       if int(new_sample[item][k]['time'])/1000 <= window_end_timestamp:
        #         emails_in_window.append(new_sample[item][k])
        #         to_list_in_window.append(new_sample[item][k]['to'])
        #       else:
        #         start = k
        #         break
        #     # randomize genders by shuffling the to_list
        #     for iter in range(0, times):
        #       new_to_list = to_list_in_window
        #       random.shuffle(new_to_list)
        #       same_gender = 0
        #       diff_gender = 0
        #       ff = 0
        #       mm = 0
        #       for index in range(0, len(emails_in_window)):
        #         from_gender = emails_in_window[index]['from']
        #         to_gender = new_to_list[index]
        #         if from_gender == to_gender:
        #           same_gender += 1
        #           if from_gender == 'm':
        #             mm += 1
        #           else:
        #             ff += 1
        #         else:
        #           diff_gender += 1
        #       numbers_same_gender[iter] += same_gender
        #       numbers_diff_gender[iter] += diff_gender
        #       numbers_ff[iter] += ff
        #       numbers_mm[iter] += mm
        #
        #       numbers_same_gender2[iter] += same_gender
        #       numbers_diff_gender2[iter] += diff_gender
        #       numbers_ff2[iter] += ff
        #       numbers_mm2[iter] += mm
        #
        #     if window_end_timestamp == time_end_timestamp:
        #       break
        #     window_end += timedelta(days=30)
        #     window_end_timestamp = time.mktime((window_end).timetuple())
        #     if window_end_timestamp > time_end_timestamp:
        #       window_end_timestamp = time_end_timestamp
        #
        #   the_mean = np.mean(numbers_same_gender)
        #   the_std = np.std(numbers_same_gender)
        #   the_mean_diff = np.mean(numbers_diff_gender)
        #   the_std_diff = np.std(numbers_diff_gender)
        #   the_mean_mm = np.mean(numbers_mm)
        #   the_std_mm = np.std(numbers_mm)
        #   the_mean_ff = np.mean(numbers_ff)
        #   the_std_ff = np.std(numbers_ff)
        #
        #   for i in range(0, len(numbers_same_gender)):
        #     numbers_same_gender[i] = (numbers_same_gender[i] - the_mean) / the_std
        #     numbers_diff_gender[i] = (numbers_diff_gender[i] - the_mean_diff) / the_std_diff
        #     numbers_mm[i] = (numbers_mm[i] - the_mean_mm) / the_std_mm
        #     numbers_ff[i] = (numbers_ff[i] - the_mean_ff) / the_std_ff
        #
        #  if fact_same_gender[item] != 0:
        #    fact_same_gender[item] = (fact_same_gender[item] - the_mean) / the_std
        #     p_value = stats.norm.sf((fact_same_gender[item]))
        #   else:
        #     p_value = 0
        #
        #   if fact_diff_gender[item] != 0:
        #     fact_diff_gender[item] = (fact_diff_gender[item] - the_mean_diff) / the_std_diff
        #     p_value_diff = stats.norm.sf((fact_diff_gender[item]))
        #   else:
        #     p_value_diff = 0
        #
        #   if fact_ff[item] != 0:
        #     fact_ff[item] = (fact_ff[item] - the_mean_ff) / the_std_ff
        #     p_value_ff = stats.norm.sf((fact_ff[item]))
        #   else:
        #     p_value_ff = 0
        #
        #   if fact_mm[item] != 0:
        #     fact_mm[item] = (fact_mm[item] - the_mean_mm) / the_std_mm
        #     p_value_mm = stats.norm.sf((fact_mm[item]))
        #   else:
        #     p_value_mm = 0
        #
        #   gap['simu']['simu_same_gender'][item] = numbers_same_gender2
        #   gap['simu']['simu_diff_gender'][item] = numbers_diff_gender2
        #   gap['simu']['simu_ff'][item] = numbers_ff2
        #   gap['simu']['simu_mm'][item] = numbers_mm2
          gap['fact']['fact_same_gender'][item]= fact_same_gender2[item]
          gap['fact']['fact_diff_gender'][item] = fact_diff_gender2[item]
          gap['fact']['fact_ff'][item] = fact_ff2[item]
          gap['fact']['fact_mm'][item] = fact_mm2[item]
        #   gap['pvalues']['pvalue_same_gender'][item] = p_value
        #   gap['pvalues']['pvalue_diff_gender'][item] = p_value_diff
        #   gap['pvalues']['pvalue_ff'][item] = p_value_ff
        #   gap['pvalues']['pvalue_mm'][item] = p_value_mm

         ## gap = {'simu': {'simu_same_gender': numbers_same_gender2, 'simu_diff_gender': numbers_diff_gender2, 'simu_ff': numbers_ff2, 'simu_mm': numbers_mm2},
          #        'fact': {'fact_same_gender': fact_same_gender2, 'fact_diff_gender': fact_diff_gender2, 'fact_ff': fact_ff2, 'fact_mm': fact_mm2},
          #        'pvalues': {'pvalue_same_gender': p_value, 'pvalue_diff_gender': p_value_diff, 'pvalue_ff': p_value_ff, 'pvalue_mm': p_value_mm}}
          #
          # gap = {'simu': {'simu_same_gender': numbers_same_gender2, 'simu_diff_gender': numbers_diff_gender2, 'simu_ff': numbers_ff2, 'simu_mm': numbers_mm2},
          #        'fact': {'fact_same_gender': fact_same_gender2, 'fact_diff_gender': fact_diff_gender2, 'fact_ff': fact_ff2, 'fact_mm': fact_mm2},
         ##        'pvalues': {'pvalue_same_gender': p_value, 'pvalue_diff_gender': p_value_diff, 'pvalue_ff': p_value_ff, 'pvalue_mm': p_value_mm}}
      if 'pairs' in team:
        pairs = team['pairs']
      else:
        pairs = []

      if team_id != None:
        self.render('analysis.html', team_id=team_id, usersinfo=json.dumps(usersinfo), demo=demo,
                    personalities=json.dumps(personalities), moralities=json.dumps(moralities), demographics=json.dumps(demographics),
                    centralities = json.dumps(centralities), pairs = json.dumps(pairs),
                    responseTime = json.dumps(response_time), emailSentTime = json.dumps(emailSentTime), gap = json.dumps(gap),
                    metrics = json.dumps(metrics))

class MergedAnalysisPage(LoggedInRequiredHandler):
    def get(self, para):
      team_id = para #.split('=')[1]
      print "team_id ", team_id

      studyid = self.get_current_study()
      state = db.getState(self.current_user, None)

      team = db.getMergedTeamAdd(team_id)
      nn = 0
      for ii in range(0, len(team['members'])):
        nn += 1
      emails = ["" for i in range(nn)]
      usersinfo = ["" for i in range(nn)]
      centralities = ["" for i in range(nn)]
      nnn = 0
      usersinfo[nnn] = {'name': state['userinfo']['name'], 'given_name': state['userinfo']['given_name'],
                            'family_name': state['userinfo']['family_name'], 'email': state['userinfo']['email']}
      emails[nnn] = state['userinfo']['email']
      nnn += 1
      for ii in range(0, len(team['members'])):
        if team['members'][ii]['email'] == state['userinfo']['email']:
          centralities[0] = team['members'][ii]['centralities']
        if team['members'][ii]['email'] != state['userinfo']['email']:
          emails[nnn] = team['members'][ii]['email']
          the_userinfo = db.getState(team['members'][ii]['email'], None)['userinfo']
          usersinfo[nnn] = {'name': the_userinfo['name'], 'given_name': the_userinfo['given_name'],
                            'family_name': the_userinfo['family_name'], 'email': the_userinfo['email']}
          centralities[nnn] = team['members'][ii]['centralities']
          nnn += 1

      personalities = []
      for ii in range(0, len(emails)):
        personality = db.getPersonality(emails[ii])
        if personality is None:
          personalities.append({})
        else:
          personalities.append(personality)
      pairs = team['pairs']

      if team_id != None:
        self.render('analysis.html', team_id=team_id, usersinfo=json.dumps(usersinfo), personalities=json.dumps(personalities), centralities = json.dumps(centralities), pairs = json.dumps(pairs))

class PreTest(BaseHandler):
    def get(self):
      global flag
      flag = 0
      para = "onlyfortest"
      studyid = self.get_current_study()
      form_email = self.get_secure_cookie("form_email")
      if form_email is None: form_email = ''
      form_username = self.get_secure_cookie("form_username")
      if form_username is None: form_username = ''
      self.render('dotest.html', form_email=form_email, form_username=form_username, team_id=para)

class PreViz(LoggedInRequiredHandler):
    def get(self):
      global flag
      flag = 1
      if self.current_user is None: self.redirect(self.reverse_url('index'))
      studyid = self.get_current_study()

      # comment the next lines and uncomment the next section for testing
      state = db.getState(self.current_user, studyid)
      # print state
      if state is None or 'userinfo' not in state:
        self.redirect(self.reverse_url('index'))
        return

      userinfo = ["" for i in range(1)]
      userinfo[0] = state['userinfo']
      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0
      self.render('viz2_new.html', version=state['version'], type="single", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)


class DoTest(LoggedInRequiredHandler):
  def get(self):
    global flag
    flag = 1
    if self.current_user is None: self.redirect(self.reverse_url('index'))
    studyid = self.get_current_study()

    # comment the next lines and uncomment the next section for testing
    state = db.getState(self.current_user, studyid)
    # print state
    if state is None or 'userinfo' not in state:
      self.redirect(self.reverse_url('index'))
      return

    userinfo = ["" for i in range(1)]
    userinfo[0] = state['userinfo']
    ################################################
    # email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
    # email = 'dsmilkov@gmail.com'
    # state = db.getState(email, None)
    # if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
    # self.set_secure_cookie("email", email)
    # print email, state['version']
    ################################################

    working = 0
    if 'working' in state and state['working']: working = 1
    if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

    waittime = 1
    time = db.getTaskTimeAheadofQueue()
    if time is not None:
      now = datetime.now(pytz.UTC)
      if now > time:
        delta = now - time
        waittime = int(math.ceil(delta.seconds / 60.0)) + 1
    if studyid == None: studyid = 0
    self.render('viz2_test.html', version=state['version'], type="single", userinfo=json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)


class PersonalReport(LoggedInRequiredHandler):
  def get(self):
    global flag
    flag = 1
    if self.current_user is None: self.redirect(self.reverse_url('index'))
    studyid = self.get_current_study()

    # comment the next lines and uncomment the next section for testing
    state = db.getState(self.current_user, studyid)
    # print state
    if state is None or 'userinfo' not in state:
      self.redirect(self.reverse_url('index'))
      return

    userinfo = ["" for i in range(1)]
    userinfo[0] = state['userinfo']

    morality = db.getMorality(userinfo[0]['email'])
    demographic = db.getDemographic(userinfo[0]['email'])
    personality = db.getPersonality(userinfo[0]['email'])

    if personality is None:
      personality = {}

    if morality is None:
      morality = {}
    else:
      morality = morality['morality']
    if demographic is None:
      demographic = {}
    else:
      demographic = demographic['demographics']

    # emailSentTime = db.getEmailSentTime(userinfo[0]['email'])
    # pairs = []
    # response_time = []

    working = 0
    if 'working' in state and state['working']: working = 1
    if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

    waittime = 1
    time = db.getTaskTimeAheadofQueue()
    if time is not None:
      now = datetime.now(pytz.UTC)
      if now > time:
        delta = now - time
        waittime = int(math.ceil(delta.seconds / 60.0)) + 1
    if studyid == None: studyid = 0
    self.render('personal_report.html', version=state['version'], type="single", userinfo=json.dumps(userinfo),
                personality=json.dumps(personality), morality=json.dumps(morality),
                demographics=json.dumps(demographic),
                #pairs=json.dumps(pairs), responseTime=json.dumps(response_time), emailSentTime=json.dumps(emailSentTime),
                working=working, waittime=waittime, studyid=studyid)


class PersonalReport_single(BaseHandler):
  def get(self, para):
    global flag
    flag = 1
    text = para[para.index('=') + 1:]
    # if self.current_user is None: self.redirect(self.reverse_url('index'))
    # studyid = self.get_current_study()
    studyid = None

    # comment the next lines and uncomment the next section for testing
    state = db.getState(text, studyid)
    # print state
    if state is None or 'userinfo' not in state:
      self.redirect(self.reverse_url('index'))
      return

    userinfo = ["" for i in range(1)]
    userinfo[0] = state['userinfo']

    morality = db.getMorality(userinfo[0]['email'])
    demographic = db.getDemographic(userinfo[0]['email'])
    personality = db.getPersonality(userinfo[0]['email'])

    if personality is None:
      personality = {}

    if morality is None:
      morality = {}
    else:
      morality = morality['morality']
    if demographic is None:
      demographic = {}
    else:
      demographic = demographic['demographics']

    # emailSentTime = db.getEmailSentTime(userinfo[0]['email'])
    # pairs = []
    # response_time = []

    working = 0
    if 'working' in state and state['working']: working = 1
    if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

    waittime = 1
    time = db.getTaskTimeAheadofQueue()
    if time is not None:
      now = datetime.now(pytz.UTC)
      if now > time:
        delta = now - time
        waittime = int(math.ceil(delta.seconds / 60.0)) + 1
    if studyid == None: studyid = 0
    self.render('personal_report.html', version=state['version'], type="single", userinfo=json.dumps(userinfo),
                personality=json.dumps(personality), morality=json.dumps(morality),
                demographics=json.dumps(demographic),
                #pairs=json.dumps(pairs), responseTime=json.dumps(response_time), emailSentTime=json.dumps(emailSentTime),
                working=working, waittime=waittime, studyid=studyid)


class Viz(LoggedInRequiredHandler):
    def get(self):
      global flag
      flag = 1
      if self.current_user is None: self.redirect(self.reverse_url('index'))
      studyid = self.get_current_study()

      # comment the next lines and uncomment the next section for testing
      state = db.getState(self.current_user, studyid)
      # print state
      if state is None or 'userinfo' not in state:
        self.redirect(self.reverse_url('index'))
        return

      userinfo = ["" for i in range(1)]
      userinfo[0] = state['userinfo']
      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0
      self.render('viz2_single.html', version=state['version'], type="single", userinfo=json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)
      # self.render('viz.html', version=state['version'], userinfo = json.dumps(state['userinfo']), working=working, waittime=waittime, studyid=studyid)

class VizJoin(LoggedInRequiredHandler):
    def get(self, para):
      if self.current_user is None: self.redirect(self.reverse_url('index'))
      studyid = self.get_current_study()

      # comment the next lines and uncomment the next section for testing
      state = db.getState(self.current_user, studyid)
      if state is None or 'userinfo' not in state:
        self.redirect(self.reverse_url('index'))
        return

      # text = para.split('&')
      # userinfo = ["" for i in range(len(text))]
      # userNames = ["" for i in range(len(text))]
      # for item in text:
      #     the_item = item.split('=')[1]
      #     userNames[text.index(item)] = (the_item)
      #     userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      # print userNames
      # print userinfo
      print "VizJoin current user", state['userinfo']
      group_id = para.split('=')[1]
      group = db.getGroupAdd(group_id)
      nn = 0
      for ii in range(0, len(group['members'])):
          if group['members'][ii]['accept'] != 0:
              nn += 1
      adds = ["" for i in range(nn)]
      userinfo = ["" for i in range(nn)]
      nnn = 0
      userinfo[nnn] = state['userinfo']
      adds[nnn] = state['userinfo']['email']
      nnn += 1
      for ii in range(0, len(group['members'])):
          if group['members'][ii]['email'] != state['userinfo']['email']:
              print ii, group['members'][ii]['email']
              if group['members'][ii]['accept'] != 0:
                  adds[nnn] = group['members'][ii]['email']
                  userinfo[nnn] = (db.getState(group['members'][ii]['email'], studyid)['userinfo'])
                  nnn += 1
      print adds

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      self.render('viz2_new.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)


class GetTeams(LoggedInRequiredHandler):
    def get(self, para):
      email = para.split('=')[1]
      studyid = self.get_current_study()

      teams = db.getMyTeams(email)
      teams = dumps(teams)
      self.write(teams)

class TeamViz(LoggedInRequiredHandler):
    def get(self, para):
      team_id = para
      if self.current_user is None:
          self.redirect(self.request.protocol + "://" + self.request.host + "/teams/" + team_id)
          # self.redirect(self.reverse_url('index'))
      studyid = self.get_current_study()

      state = db.getState(self.current_user, studyid)
      if state is None or 'userinfo' not in state:
        self.redirect(self.request.protocol + "://" + self.request.host + "/teams/" + team_id)
        return
      if not db.inTeam(team_id, state['userinfo']):
        self.redirect(self.request.protocol + "://" + self.request.host + "/teams/" + team_id)
        return
      # print "VizJoin current user", state['userinfo']
      team = db.getTeamAdd(team_id)
      nn = 0
      for ii in range(0, len(team['members'])):
          nn += 1
      adds = ["" for i in range(nn)]
      usersinfo = ["" for i in range(nn)]
      nnn = 0
      usersinfo[nnn] = state['userinfo']
      adds[nnn] = state['userinfo']['email']
      nnn += 1
      for ii in range(0, len(team['members'])):
          if team['members'][ii]['email'] != state['userinfo']['email']:
              # print ii, team['members'][ii]['email']
              adds[nnn] = team['members'][ii]['email']
              usersinfo[nnn] = (db.getState(team['members'][ii]['email'], studyid)['userinfo'])
              nnn += 1
      # print adds

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      self.render('viz2_new_study_loggedin.html', version=state['version'], type="multi", userinfo = json.dumps(usersinfo), teamid=team_id, working=working, waittime=waittime, studyid=studyid)


class TeamVizV2(LoggedInRequiredHandler):
  def get(self, para):
    team_id = para
    member_count = db.getTeamMemberCount(team_id)
    if member_count == 0:
      self.set_secure_cookie("first", '1')
    else:
      self.set_secure_cookie("first", '0')
    if self.current_user is None:
      self.redirect(self.request.protocol + "://" + self.request.host + "/login/" + team_id)
      # self.redirect(self.reverse_url('index'))
    studyid = self.get_current_study()

    special_str = ""
    state = db.getState(self.current_user, studyid)
    if state is None or 'userinfo' not in state:
      self.redirect(self.request.protocol + "://" + self.request.host + "/login/" + team_id)
      return
    if not db.inTeam(team_id, state['userinfo']):
      self.redirect(self.request.protocol + "://" + self.request.host + "/login/" + team_id)
      return
    # print "VizJoin current user", state['userinfo']
    team = db.getTeamAdd(team_id)
    # nn = 0
    # for ii in range(0, len(team['members'])):
    #   nn += 1
    # adds = ["" for i in range(nn)]
    # usersinfo = ["" for i in range(nn)]
    adds = []
    usersinfo = []
    nnn = 0
    usersinfo.append(state['userinfo'])
    special_str += state['userinfo']['name']
    ali = db.getAliases(state['userinfo']['email'])
    if ali:
      usersinfo[nnn]['aliases'] = ali['aliases']
    adds.append(state['userinfo']['email'])
    nnn += 1
    for ii in range(0, len(team['members'])):
      if team['members'][ii]['email'] != state['userinfo']['email']:
        print ii, team['members'][ii]['email']
        # if team['members'][ii]['accept'] != 0:
        adds.append(team['members'][ii]['email'])
        this_userinfo = (db.getState(team['members'][ii]['email'], studyid))
        if this_userinfo is not None:
          usersinfo.append(this_userinfo['userinfo'])
          special_str += this_userinfo['userinfo']['name']
          ali = db.getAliases(team['members'][ii]['email'])
          if ali:
            usersinfo[nnn]['aliases'] = ali['aliases']
          nnn += 1
    # print adds

    ################################################
    # email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
    # email = 'dsmilkov@gmail.com'
    # state = db.getState(email, None)
    # if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
    # self.set_secure_cookie("email", email)
    # print email, state['version']
    ################################################

    working = 0
    if 'working' in state and state['working']: working = 1
    if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

    waittime = 1
    time = db.getTaskTimeAheadofQueue()
    if time is not None:
      now = datetime.now(pytz.UTC)
      if now > time:
        delta = now - time
        waittime = int(math.ceil(delta.seconds / 60.0)) + 1
    if studyid == None: studyid = 0

    study_teams = ["applieddataviz", "cityscience"]
    partial = 0
    if team_id in study_teams:
      partial = 1

    self.render('viz2_new_study_loggedin_v2.html', version=state['version'], admin="None", type="multi", demo=0, partial=partial, userinfo=json.dumps(usersinfo),
                teamid=team_id, working=working, waittime=waittime, studyid=studyid, special_str=special_str)


class DemoTeamVizV2(BaseHandler):
  def get(self, para):
    team = para
    if team == "team1":
      team_id = "test"
    elif team == "team2":
      team_id = "demo2" #"applieddataviz"
    else:
      team_id = "demo3" #"cl2017"

    team = db.getTeamAdd(team_id)
    adds = []
    usersinfo = []
    nnn = 0
    for ii in range(0, len(team['members'])):
      adds.append(team['members'][ii]['email'])
      this_userinfo = (db.getState(team['members'][ii]['email'], None))
      if this_userinfo is not None:
        usersinfo.append(this_userinfo['userinfo'])
        ali = db.getAliases(team['members'][ii]['email'])
        if ali:
          usersinfo[nnn]['aliases'] = ali['aliases']
        nnn += 1

    working = 0
    waittime = 1
    time = db.getTaskTimeAheadofQueue()
    if time is not None:
      now = datetime.now(pytz.UTC)
      if now > time:
        delta = now - time
        waittime = int(math.ceil(delta.seconds / 60.0)) + 1
    studyid = 0

    self.render('viz2_new_study_loggedin_v2.html', version=0, admin="Yes", type="multi", demo=1, partial=0, userinfo=json.dumps(usersinfo),
                teamid=team_id, working=working, waittime=waittime, studyid=studyid, special_str="")

class AdminLogin(BaseHandler):
  def post(self):
    team_id = self.get_argument('teamid', None)
    email = self.get_argument('email', None)
    password = self.get_argument('password', None)
    team = db.getTeamAdd(team_id)
    print email, team_id
    adds = []
    usersinfo = []
    nnn = 0
    for ii in range(0, len(team['members'])):
      user_states = db.getState(team['members'][ii]['email'], None)
      if user_states:
        adds.append(team['members'][ii]['email'])
        usersinfo.append((user_states['userinfo']))
        nnn += 1
    print adds

    ################################################
    # email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
    # email = 'dsmilkov@gmail.com'
    # state = db.getState(email, None)
    # if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
    # self.set_secure_cookie("email", email)
    # print email, state['version']
    ################################################

    working = 0
    waittime = 1
    time = db.getTaskTimeAheadofQueue()
    if time is not None:
      now = datetime.now(pytz.UTC)
      if now > time:
        delta = now - time
        waittime = int(math.ceil(delta.seconds / 60.0)) + 1
    studyid = 0

    self.render('viz2_new_study_loggedin_v2.html', version=0, admin="Yes", type="multi", demo=0, partial=0, userinfo=json.dumps(usersinfo),
                teamid=team_id, working=working, waittime=waittime, studyid=studyid, special_str="")


class MergeTeams(LoggedInRequiredHandler):
  def get(self, para):
    text = para.split('&')
    teamid = ""
    usersinfo = []
    adds = []

    if self.current_user is None:
      self.redirect(self.reverse_url('busy'))
      return
    studyid = self.get_current_study()

    state = db.getState(self.current_user, studyid)
    if state is None or 'userinfo' not in state:
      self.redirect(self.reverse_url('busy'))
      return

    ind = 0
    usersinfo.append(state['userinfo'])
    for item in text:
      the_item = item.split('=')[1]
      teamid += the_item
      if ind != len(text) - 1:
        teamid += "+"
      team = db.getTeamAdd(the_item)
      for ii in range(0, len(team['members'])):
        if team['members'][ii]['email'] != state['userinfo']['email'] and (team['members'][ii]['email'] not in adds):
          if db.getState(team['members'][ii]['email'], studyid):
            usersinfo.append(db.getState(team['members'][ii]['email'], studyid)['userinfo'])
            adds.append(team['members'][ii]['email'])
      ind += 1
    db.saveMergedTeam(usersinfo, teamid)

    working = 0
    if 'working' in state and state['working']: working = 1
    if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

    waittime = 1
    time = db.getTaskTimeAheadofQueue()
    if time is not None:
      now = datetime.now(pytz.UTC)
      if now > time:
        delta = now - time
        waittime = int(math.ceil(delta.seconds / 60.0)) + 1
    if studyid == None: studyid = 0

    self.render('viz2_merge.html', version=state['version'], admin = "None", type="multi", demo = 0, partial=0, userinfo=json.dumps(usersinfo), teamid = teamid,
                working=working, waittime=waittime, studyid=studyid, special_str="")


class MergeTwo(BaseHandler):
  def get(self, para):
    text = para.split('&')
    teamid = ""
    usersinfo = []
    adds = []

    ind = 0
    for item in text:
      the_item = item.split('=')[1]
      teamid += the_item
      if ind != len(text) - 1:
        teamid += "+"
      team = db.getTeamAdd(the_item)
      for ii in range(0, len(team['members'])):
        if team['members'][ii]['email'] not in adds:
            usersinfo.append(db.getState(team['members'][ii]['email'], None)['userinfo'])
            adds.append(team['members'][ii]['email'])
      ind += 1
    db.saveMergedTeam(usersinfo, teamid)

    working = 0
    waittime = 1
    time = db.getTaskTimeAheadofQueue()
    if time is not None:
      now = datetime.now(pytz.UTC)
      if now > time:
        delta = now - time
        waittime = int(math.ceil(delta.seconds / 60.0)) + 1
    studyid = 0

    self.render('viz2_merge.html', version=0, type="multi", userinfo=json.dumps(usersinfo), teamid = teamid,
                working=working, waittime=waittime, studyid=None)


class VizOrg(LoggedInRequiredHandler):
    def get(self, para):
      if self.current_user is None: self.redirect(self.reverse_url('index'))
      studyid = self.get_current_study()

      # comment the next lines and uncomment the next section for testing
      state = db.getState(self.current_user, studyid)
      if state is None or 'userinfo' not in state:
        self.redirect(self.reverse_url('index'))
        return

      # text = para.split('&')
      # userinfo = ["" for i in range(len(text))]
      # userNames = ["" for i in range(len(text))]
      # for item in text:
      #     the_item = item.split('=')[1]
      #     userNames[text.index(item)] = (the_item)
      #     userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      # print userNames
      # print userinfo

      group_id = para.split('=')[1]
      group = db.getGroupAdd(group_id)
      adds = ["" for i in range(len(group['members']))]
      userinfo = ["" for i in range(len(group['members']))]
      for ii in range(0, len(group['members'])):
          print ii, group['members'][ii]['email']
          if group['members'][ii]['accept'] != 0:
              adds[ii] = group['members'][ii]['email']
              userinfo[ii] = (db.getState(group['members'][ii]['email'], studyid)['userinfo'])
      print adds

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      self.render('viz_org.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)


# class Demo(BaseHandler):
#     def get(self):
#       global flag
#       flag = 1
#       # login as demo
#       self.set_secure_cookie("email", "demo@demo.com")
#       working = 0
#       userinfo = {'name': 'Demo User', 'given_name':'Demo', 'family_name': 'User', 'email':'demo@demo.com'}
#       self.render('viz.html', version=2, userinfo = json.dumps(userinfo), working=working, waittime=0, studyid=0)

class VizSingle(BaseHandler):
    userName = ""
    # def get(self):
    #   global flag
    #   flag = 1
    #   if self.current_user is None: self.redirect(self.reverse_url('index'))
    #   studyid = self.get_current_study()
    #
    #   # comment the next lines and uncomment the next section for testing
    #   state = db.getState(self.current_user, studyid)
    #   # print state
    #   if state is None or 'userinfo' not in state:
    #     self.redirect(self.reverse_url('index'))
    #     return
    #
    #   userinfo = ["" for i in range(1)]
    #   userinfo[0] = state['userinfo']
    #   ################################################
    #   # email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
    #   # email = 'dsmilkov@gmail.com'
    #   # state = db.getState(email, None)
    #   # if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
    #   # self.set_secure_cookie("email", email)
    #   # print email, state['version']
    #   ################################################
    #
    #   working = 0
    #   if 'working' in state and state['working']: working = 1
    #   if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))
    #
    #   waittime = 1
    #   time = db.getTaskTimeAheadofQueue()
    #   if time is not None:
    #     now = datetime.now(pytz.UTC)
    #     if now > time:
    #       delta = now - time
    #       waittime = int(math.ceil(delta.seconds / 60.0)) + 1
    #   if studyid == None: studyid = 0
    #   self.render('viz2_new.html', version=state['version'], type="single", userinfo=json.dumps(userinfo),
    #               working=working, waittime=waittime, studyid=studyid)

    def get(self, para):
      global flag
      flag = 0
      text = para[para.index('=')+1:]
      # print text
      VizSingle.userName = text
      studyid = self.get_current_study()
      # print studyid
      # studyid = None

      # comment the next lines and uncomment the next section for testing
      state = db.getState(VizSingle.userName, studyid)
      if state is None or 'userinfo' not in state:
        self.redirect(self.reverse_url('index'))
        return

      userinfo = ["" for i in range(1)]
      userinfo[0] = state['userinfo']

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0
      self.render('viz2_single.html', version=state['version'], type="single", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)

class VizMulti(BaseHandler): #LoggedInRequiredHandler
    def get(self, para):
      global flag
      flag = 0
      print "para", para
      text = para.split('&')
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item.split('=')[1]
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('viz2.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)


class VizMultiNew(BaseHandler): #LoggedInRequiredHandler
    def get(self, para):
      global flag
      flag = 0
      print "para", para
      text = para.split('&')
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item.split('=')[1]
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      # print userNames
      # print userinfo

      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      special_str = state['userinfo']['name']
      partial = 0
      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      self.render('viz2_new_study_loggedin_v2.html', version=state['version'], admin="None", type="multi", demo=0,
                  partial=partial, userinfo=json.dumps(userinfo),
                  teamid=None, working=working, waittime=waittime, studyid=studyid, special_str=special_str)


      # # comment the next lines and uncomment the next section for testing
      # # state = db.getState(self.current_user, studyid)
      # state = db.getState(userNames[0], studyid)
      # if state is None or 'userinfo' not in state:
      #   print self.current_user
      #   self.redirect(self.reverse_url('index'))
      #   return
      #
      # ################################################
      # #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      # #email = 'dsmilkov@gmail.com'
      # #state = db.getState(email, None)
      # #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      # #self.set_secure_cookie("email", email)
      # #print email, state['version']
      # ################################################
      #
      # working = 0
      # if 'working' in state and state['working']: working = 1
      # if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))
      #
      # waittime = 1
      # time = db.getTaskTimeAheadofQueue()
      # if time is not None:
      #   now = datetime.now(pytz.UTC)
      #   if now > time:
      #     delta = now - time
      #     waittime = int(math.ceil(delta.seconds/60.0)) + 1
      # if studyid == None: studyid = 0
      #
      # bet_flag = 1
      #
      # self.render('viz2_new.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)


class VizMultiNewV2(BaseHandler): #LoggedInRequiredHandler
    def get(self, para):
      global flag
      flag = 0
      print "para", para
      text = para.split('&')
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item.split('=')[1]
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('v2_viz2_new.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)

class PrivacyPolicy(BaseHandler):
    def get(self):
      self.render('privacy.html')

class VizDemo(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["almahaalmalki@gmail.com", "sanjay.guruprasad@gmail.com", "junezjx@gmail.com", "cesifoti@gmail.com"]
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('viz2.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)


class VizDemoNew(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["almahaalmalki@gmail.com", "sanjay.guruprasad@gmail.com", "junezjx@gmail.com", "who.is.kevin.hu@gmail.com", "cesifoti@gmail.com"]
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('viz2_new.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)

class VizDemoNewV2(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["almahaalmalki@gmail.com", "sanjay.guruprasad@gmail.com", "junezjx@gmail.com", "who.is.kevin.hu@gmail.com", "cesifoti@gmail.com"]
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('v2_viz2_new.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)

class VizDemoNewCK(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["who.is.kevin.hu@gmail.com", "cesifoti@gmail.com"]
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('viz2_new.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)


class VizDemoNewCKStudy(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["who.is.kevin.hu@gmail.com", "cesifoti@gmail.com"]
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('viz2_new_study.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)


class VizDemoNewStudy(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["almahaalmalki@gmail.com", "sanjay.guruprasad@gmail.com", "junezjx@gmail.com", "who.is.kevin.hu@gmail.com", "cristian.jara.figueroa@gmail.com", "flavio.lpp@gmail.com", "bogang33@gmail.com", "cesifoti@gmail.com"]
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('viz2_new_study.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)



class VizDemoNewCKV2(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["who.is.kevin.hu@gmail.com", "cesifoti@gmail.com"]
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('v2_viz2_new.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)


class VizDemoNewAll(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["almahaalmalki@gmail.com", "sanjay.guruprasad@gmail.com", "junezjx@gmail.com", "who.is.kevin.hu@gmail.com", "cristian.jara.figueroa@gmail.com", "flavio.lpp@gmail.com", "bogang33@gmail.com", "cesifoti@gmail.com"]
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('viz2_new.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)

# class CheckTeamTest(BaseHandler):
#     def get(self, para):
#       team_id = para.split('=')[1]
#       self.set_secure_cookie("team_id", team_id)
#       if db.hasTeamID(team_id): #the team has been created
#           # self.redirect(self.request.protocol + "://" + self.request.host + "/create")
#           self.set_secure_cookie("availability", '0')
#           self.redirect(self.reverse_url('create'))
#           # self.render('create.html', team_id=team_id, availability=0)
#       else: #team name available
#           self.set_secure_cookie("availability", '1')
#           link = "https://" + self.request.host + "/teamviz/" + team_id
#           teamInfo = []
#           team_id = db.saveTeam(teamInfo, team_id, link)
#           self.redirect(self.request.protocol + "://" + self.request.host + "/teams/" + team_id)

class CheckTeamTestV2(BaseHandler):
    def post(self):
      data = json.loads(self.get_argument("json", None))
      team_id = data['team_id']
      team_password = data['team_password']
      if db.hasTeamID(team_id):  # the team has been created
        self.write({"availability": 0, "password_match": 1, "first": 1})
      else: #team name available
          link = "https://" + self.request.host + "/teamviz/" + team_id
          teamInfo = []
          team_id = db.saveTeam(teamInfo, team_id, team_password, link)
          member_count = db.getTeamMemberCount(team_id)
          if member_count == 0:
            self.write({"availability": 1, "password_match": 1, "first": 1})
          else:
            self.write({"availability": 1, "password_match": 1, "first": 0})

    # def get(self, para):
    #   team_id = para.split('=')[1]
    #   self.set_secure_cookie("team_id", team_id)
    #   if db.hasTeamID(team_id): #the team has been created
    #       # self.redirect(self.request.protocol + "://" + self.request.host + "/create")
    #       self.set_secure_cookie("availability", '0')
    #       self.redirect(self.reverse_url('v2create'))
    #       # self.render('create.html', team_id=team_id, availability=0)
    #   else: #team name available
    #       link = "https://" + self.request.host + "/teamviz/" + team_id
    #       teamInfo = []
    #       team_id = db.saveTeam(teamInfo, team_id, link)
    #       # self.redirect(self.request.protocol + "://" + self.request.host + "/teams/" + team_id)
    #       member_count = db.getTeamMemberCount(team_id)
    #       if member_count == 0:
    #         self.set_secure_cookie("first", '1')
    #       else:
    #         self.set_secure_cookie("first", '0')
    #       self.redirect(self.request.protocol + "://" + self.request.host + "/login/" + team_id)

class JoinTeamCheck(BaseHandler):
    def post(self):
      data = json.loads(self.get_argument("json", None))
      team_id = data['team_id']
      team_password = data['team_password']
      # # team_id = para.split('=')[1]
      # self.set_secure_cookie("team_id", team_id)
      # self.set_secure_cookie("team_password", team_password)
      if not db.hasTeamID(team_id): #the team has not been created
          # self.redirect(self.request.protocol + "://" + self.request.host + "/create")
          # self.set_secure_cookie("availability", '0')
          # self.redirect(self.request.protocol + "://" + self.request.host + "/join/" + team_id)
          self.write({"availability": 0, "password_match": 1, "first": 1})
          # self.render('create.html', team_id=team_id, availability=0)
      else: #team has been created and ready to join
          if db.passwordMatch(team_id, team_password):
            member_count = db.getTeamMemberCount(team_id)
            if member_count == 0:
              # self.set_secure_cookie("first", '1')
              self.write({"availability": 1, "password_match": 1, "first": 1})
            else:
              # self.set_secure_cookie("first", '0')
              self.write({"availability": 1, "password_match": 1, "first": 0})
            # self.redirect(self.request.protocol + "://" + self.request.host + "/login/" + team_id)
          else:
            # self.set_secure_cookie("password_match", '0')
            # self.redirect(self.request.protocol + "://" + self.request.host + "/join/" + team_id)
            self.write({"availability": 1, "password_match": 0, "first": 1})

class CreateTeamTest(BaseHandler):
  def get(self):
    studyid = self.get_current_study()
    team_id = self.get_secure_cookie("team_id")
    if team_id is None: team_id = ''
    availability = self.get_secure_cookie("availability")
    if availability is None: availability = 1
    self.render('create.html', team_id=team_id, availability=availability)

class CreateTeamTestV2(BaseHandler):
  def get(self):
    studyid = self.get_current_study()
    team_id = self.get_secure_cookie("team_id")
    if team_id is None: team_id = ''
    availability = self.get_secure_cookie("availability")
    if availability is None: availability = 1
    # availability = 1
    self.render('create.html', team_id=team_id, availability=availability)

class JoinPage(BaseHandler):
  def get(self, para):
    studyid = self.get_current_study()
    team_id = para
    if team_id is None: team_id = ''
    availability = self.get_secure_cookie("availability")
    password_match = self.get_secure_cookie("password_match")
    if availability is None: availability = 1
    if password_match is None: password_match = 1
    self.render('join.html', team_id=team_id, team_password="", availability=availability, password_match=password_match)

class JoinPageFill(BaseHandler):
  def get(self):
    studyid = self.get_current_study()
    team_id = ''
    availability = 1
    password_match = 1
    self.render('join.html', team_id=team_id, team_password="", availability=availability, password_match=password_match)

class VizTeamTest(BaseHandler):
    def get(self, para):
      global flag
      flag = 0
      studyid = self.get_current_study()
      form_email = self.get_secure_cookie("form_email")
      if form_email is None: form_email = ''
      form_username = self.get_secure_cookie("form_username")
      if form_username is None: form_username = ''
      self.render('teamJoin.html', form_email=form_email, form_username=form_username, team_id=para)

class VizTeamTestV2(BaseHandler):
    def get(self, para):
      global flag
      flag = 0
      studyid = self.get_current_study()
      form_email = self.get_secure_cookie("form_email")
      if form_email is None: form_email = ''
      form_username = self.get_secure_cookie("form_username")
      if form_username is None: form_username = ''
      self.render('v2teamJoin.html', form_email=form_email, form_username=form_username, team_id=para)

class VizMyLogin(BaseHandler):
    def get(self):
      global flag
      flag = 0
      studyid = self.get_current_study()
      form_email = self.get_secure_cookie("form_email")
      if form_email is None: form_email = ''
      form_username = self.get_secure_cookie("form_username")
      if form_username is None: form_username = ''

      self.render('teamLogin_single.html', form_email=form_email, form_username=form_username, team_id='', first=-1)

class VizLoginTest(BaseHandler):
    def get(self, para):
      global flag
      flag = 0
      studyid = self.get_current_study()
      form_email = self.get_secure_cookie("form_email")
      if form_email is None: form_email = ''
      form_username = self.get_secure_cookie("form_username")
      if form_username is None: form_username = ''

      if not db.hasTeamID(para): #the team has not been created
          link = "https://" + self.request.host + "/teamviz/" + para
          teamInfo = []
          if db.getPassword(para) is not False:
            team_id = db.saveTeam(teamInfo, para, db.getPassword(para), link)
      member_count = db.getTeamMemberCount(para)
      if member_count == 0:
        first = 1
      else:
        first = 0
      self.render('teamLogin.html', form_email=form_email, form_username=form_username, team_id=para, first=first)

class VizLoginCreate(BaseHandler):
    def post(self):
      data = json.loads(self.get_argument("json", None))
      team_id = data['team_id']
      team_password = data['team_password']
      if not db.hasTeamID(team_id): #the team has not been created
          link = "https://" + self.request.host + "/teamviz/" + team_id
          teamInfo = []
          team_id = db.saveTeam(teamInfo, team_id, team_password, link)
      self.write({"success": True})


class VizOCP2015(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["data.immersion@gmail.com"]
      VizSingle.userName = "data.immersion@gmail.com"
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('viz2_new.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)

class VizOCP2016(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["data.immersion.2016@gmail.com"]
      VizSingle.userName = "data.immersion.2016@gmail.com"
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('viz2_new.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)

class VizOCP(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["data.immersion@gmail.com", "data.immersion.2016@gmail.com"]
      VizSingle.userName = "data.immersion@gmail.com"
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('viz2_new.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)


class VizDemo8K(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["almahaalmalki@gmail.com", "sanjay.guruprasad@gmail.com", "junezjx@gmail.com", "who.is.kevin.hu@gmail.com", "cesifoti@gmail.com"]
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('viz2_8K.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)


class XJ_Viz(BaseHandler): #LoggedInRequiredHandler
    def get(self):
      global flag
      flag = 0
      text = ["almahaalmalki@gmail.com", "sanjay.guruprasad@gmail.com", "junezjx@gmail.com", "cesifoti@gmail.com"]
      userinfo = ["" for i in range(len(text))]
      userNames = ["" for i in range(len(text))]
      studyid = self.get_current_study()
      for item in text:
          the_item = item
          userNames[text.index(item)] = (the_item)
          userinfo[text.index(item)] = (db.getState(the_item, studyid)['userinfo'])
      print userNames
      print userinfo

      # comment the next lines and uncomment the next section for testing
      # state = db.getState(self.current_user, studyid)
      state = db.getState(userNames[0], studyid)
      if state is None or 'userinfo' not in state:
        print self.current_user
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0

      bet_flag = 1

      self.render('XJ_viz2.html', version=state['version'], type="multi", userinfo = json.dumps(userinfo), working=working, waittime=waittime, studyid=studyid)



class indexJoin(BaseHandler):
  def get(self, para):
    para = para.split('&')
    group_id = para[0].split('=')[1]
    ind = para[1].split('=')[1]
    print "Group id is ", group_id

    # text = para.split('&')
    # adds = ["" for i in range(len(text))]
    # for item in text:
    #   the_item = item.split('=')[1]
    #   adds[text.index(item)] = the_item
    # restEmails = json.dumps([dict(add=pn) for pn in adds])
    # print "restEmails ", restEmails

    studyid = self.get_current_study()
    if studyid: self.redirect(self.reverse_url('indexStudy', studyid))
    #if self.request.protocol == 'http': self.redirect("https://" + self.request.host) # always redirect to secure traffic
    #redirect_uri = "https://" + self.request.host + "/" + client_info['web']['redirect_uris'][0]
    #flow = flow_from_clientsecrets('client_secrets.json', scope=client_info['web']['scope'], redirect_uri=redirect_uri)
    #authurl = flow.step1_get_authorize_url()#.replace('access_type=offline', 'access_type=online')
    form_email = self.get_secure_cookie("form_email")
    if form_email is None: form_email = ''
    form_username = self.get_secure_cookie("form_username")
    if form_username is None: form_username = ''
    # self.render('indexJoin.html', form_email=form_email, form_username=form_username, rest_emails=restEmails)
    self.render('indexJoin.html', form_email=form_email, form_username=form_username, group_id=group_id, ind=ind)

class VizHillary(BaseHandler):
    userName = ""
    def get(self):
      global flag
      flag = 0
      text = "Hillary Clinton"
      print text
      VizSingle.userName = text
      studyid = self.get_current_study()
      print studyid
      # studyid = None

      # comment the next lines and uncomment the next section for testing
      state = db.getState(VizSingle.userName, studyid)
      if state is None or 'userinfo' not in state:
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0
      self.render('hillary.html')


class VizPodesta(BaseHandler):
    userName = ""
    def get(self):
      global flag
      flag = 0
      text = "John Podesta"
      print text
      VizSingle.userName = text
      studyid = self.get_current_study()
      print studyid
      # studyid = None

      # comment the next lines and uncomment the next section for testing
      state = db.getState(VizSingle.userName, studyid)
      if state is None or 'userinfo' not in state:
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0
      self.render('podesta.html')


class VizDNC(BaseHandler):
    userName = ""
    def get(self):
      global flag
      flag = 0
      text = "DNC"
      print text
      VizSingle.userName = text
      studyid = self.get_current_study()
      print studyid
      # studyid = None

      # comment the next lines and uncomment the next section for testing
      state = db.getState(VizSingle.userName, studyid)
      if state is None or 'userinfo' not in state:
        self.redirect(self.reverse_url('index'))
        return

      ################################################
      #email = db.db.states.find().skip(random.randint(0, db.db.states.count() - 1)).limit(1)[0]['email']
      #email = 'dsmilkov@gmail.com'
      #state = db.getState(email, None)
      #if 'userinfo' not in state: state['userinfo'] = db.getState("dsmilkov@gmail.com", None)['userinfo']
      #self.set_secure_cookie("email", email)
      #print email, state['version']
      ################################################

      working = 0
      if 'working' in state and state['working']: working = 1
      if 'imap' in state and state['imap']: self.redirect(self.reverse_url('imap'))

      waittime = 1
      time = db.getTaskTimeAheadofQueue()
      if time is not None:
        now = datetime.now(pytz.UTC)
        if now > time:
          delta = now - time
          waittime = int(math.ceil(delta.seconds/60.0)) + 1
      if studyid == None: studyid = 0
      self.render('podesta.html')


class GetPersonalities(BaseHandler):
    def get(self, para):
      emails = para.split('=')[1]
      emails = emails.split('&')
      personalities = []
      for ii in range(0, len(emails)):
        personality = db.getPersonality(emails[ii])
        if personality is None:
            personalities.append({})
        else:
            personalities.append(personality)
      self.write(json_encode(personalities))

class GetOnePersonality(BaseHandler):
    def get(self, para):
      email = para.split('=')[1]
      personality = db.getPersonality(email)
      if personality is None:
         personality = {}
         self.write(personality)
      else:
         self.write(personality)

class GetDemographics(BaseHandler):
    def get(self, para):
      emails = para.split('=')[1]
      emails = emails.split('&')
      demographics = []
      for ii in range(0, len(emails)):
        demographic = db.getDemographic(emails[ii])
        if demographic is None:
            demographics.append({})
        else:
            demographics.append(demographic['demographics'])
      self.write(json_encode(demographics))

class GetOneDemographic(BaseHandler):
    def get(self, para):
      email = para.split('=')[1]
      demographic = db.getDemographic(email)
      if demographic is None:
         demographic = {}
         self.write(demographic)
      else:
         self.write(demographic['demographics'])

class GetMoralities(BaseHandler):
    def get(self, para):
      emails = para.split('=')[1]
      emails = emails.split('&')
      moralities = []
      for ii in range(0, len(emails)):
        morality = db.getMorality(emails[ii])
        if morality is None:
            moralities.append({})
        else:
            moralities.append(morality)
      self.write(json_encode(moralities))

class GetOneMorality(BaseHandler):
    def get(self, para):
      email = para.split('=')[1]
      morality = db.getMorality(email)
      if morality is None:
         morality = {}
         self.write(morality)
      else:
         self.write(morality)

class PersonalityStudy(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    current_year = 2017
    # self.write(str(data))
    personality = {'Open-Mindedness': 0, 'Conscientiousness': 0, 'Extraversion': 0, 'Agreeableness': 0, 'Negative Emotionality': 0}
    demographics = {'gender': data['gender'], 'YOB': current_year - data['age']}
    user_email = data['email']
    state = db.getState(user_email, None)
    print user_email
    print state
    saveurl = ""
    url = 'https://www.outofservice.com/bigfive/?score-bigfive'
    num_questions = 60
    payload = {}
    my_age = data['age']
    my_gender = data['gender']
    for i in range(1, num_questions + 1):
        name = 'bigfive-me-' + str('%02d'%i)
        payload[name] = data['personality'][str(i)]
    payload['bigfive-dem-gender'] = my_gender
    payload['bigfive-dem-age'] = my_age
    # print payload
    r = requests.post(url, data=payload)
    i = 0
    for m in re.findall('Your percentile: (.*)</nobr>', r.content):
        feature = match_personality(i)
        i += 1
        personality[feature] = m
    demographics['gender'] = my_gender
    demographics['age'] = my_age
    saveurl = r.url
    personality_info = {'email': user_email, 'personality': personality, 'demographics': demographics, 'url': saveurl}
    # db.savePersonality(personality_info)
    state['personalityinfo'] = personality_info
    new_state = db.storeState(user_email, None, state)
    db.storePersonality(user_email, personality_info)
    print new_state

    self.write(personality_info)

class PersonalityStudyLoggedin(LoggedInRequiredHandler):
  def post(self):
    studyid = self.get_current_study()
    state = db.getState(self.current_user, studyid)
    if state is None or 'userinfo' not in state:
      self.redirect(self.reverse_url('index'))
      return

    data = json.loads(self.get_argument("json", None))
    current_year = datetime.now().year
    personality = {'Open-Mindedness': 0, 'Conscientiousness': 0, 'Extraversion': 0, 'Agreeableness': 0, 'Negative Emotionality': 0}
    demographics = {'gender': data['gender'], 'YOB': data['age']}
    saveurl = ""
    url = 'https://www.outofservice.com/bigfive/?score-bigfive'
    num_questions = 60
    payload = {}
    my_age = current_year - data['age']
    my_gender = data['gender']
    for i in range(1, num_questions + 1):
        name = 'bigfive-me-' + str('%02d'%i)
        payload[name] = data['personality'][str(i)]
    payload['bigfive-dem-gender'] = my_gender
    payload['bigfive-dem-age'] = my_age
    # print payload
    r = requests.post(url, data=payload)
    i = 0
    for m in re.findall('Your percentile: (.*)</nobr>', r.content):
        feature = match_personality(i)
        i += 1
        personality[feature] = m
    demographics['gender'] = my_gender
    demographics['age'] = my_age
    saveurl = r.url

    personality_info = {'email': self.current_user, 'personality': personality, 'demographics': demographics, 'url': saveurl}
    state['personalityinfo'] = personality_info
    new_state = db.storeState(self.current_user, studyid, state)
    db.storePersonality(self.current_user, personality_info)

    self.write(personality_info)

class MoralityStudyLoggedin(LoggedInRequiredHandler):
  def post(self):
    studyid = self.get_current_study()
    state = db.getState(self.current_user, studyid)
    if state is None or 'userinfo' not in state:
      self.redirect(self.reverse_url('index'))
      return
    data_a = ["va12", "va14", "va15", "va10", "va02", "va07", "va05", "va03", "va01", "va08", "va11", "va06",
              "va13", "va09", "va04"]
    data_b = ["vb02", "vb07", "vb15", "vb14", "vb03", "vb12", "vb09", "vb01", "vb05", "vb11", "vb08", "vb10",
              "vb13", "vb04", "vb06"]
    data = json.loads(self.get_argument("json", None))
    morality = {'Fairness': 0, 'Harm': 0, 'Loyalty': 0, 'Authority': 0, 'Purity': 0}
    num_questions = 15

    # browser = webdriver.PhantomJS()
    # # browser = webdriver.Chrome('./chromedriver')
    # browser.get("http://www.yourpersonality.net/political/griffin1.pl")
    #
    # submit_button = browser.find_element_by_xpath('//input[@type="submit" and @value="Begin"]')
    # submit_button.click()
    # submit_button = browser.find_element_by_xpath('//input[@type="submit" and @value="Next"]')
    # submit_button.click()
    # for item in data_a:
    #   a = item + data['morality'][str(data_a.index(item) + 1)]
    #   radio = browser.find_element_by_id(a)
    #   radio.click()
    # submit_button = browser.find_element_by_xpath('//input[@type="submit" and @value="Next"]')
    # submit_button.click()
    # for item in data_b:
    #   a = item + data['morality'][str(data_b.index(item) + 1)]
    #   radio = browser.find_element_by_id(a)
    #   radio.click()
    # submit_button = browser.find_element_by_xpath('//input[@type="submit" and @value="Next"]')
    # submit_button.click()
    # results = browser.find_element_by_xpath("//tr[@class='tdbox3']")
    # results = results.find_element_by_xpath('..').find_elements_by_tag_name("tr")
    # for index in range(len(results)):
    #   if index == 1:
    #     morality['Fairness'] = results[index].find_elements_by_tag_name("td")[1].text
    #   elif index == 2:
    #     morality['Harm'] = results[index].find_elements_by_tag_name("td")[1].text
    #   elif index == 3:
    #     morality['Loyalty'] = results[index].find_elements_by_tag_name("td")[1].text
    #   elif index == 4:
    #     morality['Authority'] = results[index].find_elements_by_tag_name("td")[1].text
    #   elif index == 5:
    #     morality['Purity'] = results[index].find_elements_by_tag_name("td")[1].text
    # browser.quit()

    morality['Fairness'] = (float(data['morality'][str(data_a.index("va02") + 1)]) + float(data['morality'][str(data_a.index("va07") + 1)]) + float(data['morality'][str(data_a.index("va12") + 1)]) + float(data['morality'][str(data_b.index("vb02") + 1)]) + float(data['morality'][str(data_b.index("vb07") + 1)]) + float(data['morality'][str(data_b.index("vb12") + 1)])) / float(6)
    morality['Harm'] = (float(data['morality'][str(data_a.index("va01") + 1)]) + float(data['morality'][str(data_a.index("va06") + 1)]) + float(data['morality'][str(data_a.index("va11") + 1)]) + float(data['morality'][str(data_b.index("vb01") + 1)]) + float(data['morality'][str(data_b.index("vb06") + 1)]) + float(data['morality'][str(data_b.index("vb11") + 1)])) / float(6)
    morality['Loyalty'] = (float(data['morality'][str(data_a.index("va03") + 1)]) + float(data['morality'][str(data_a.index("va08") + 1)]) + float(data['morality'][str(data_a.index("va13") + 1)]) + float(data['morality'][str(data_b.index("vb03") + 1)]) + float(data['morality'][str(data_b.index("vb08") + 1)]) + float(data['morality'][str(data_b.index("vb13") + 1)])) / float(6)
    morality['Authority'] = (float(data['morality'][str(data_a.index("va04") + 1)]) + float(data['morality'][str(data_a.index("va09") + 1)]) + float(data['morality'][str(data_a.index("va14") + 1)]) + float(data['morality'][str(data_b.index("vb04") + 1)]) + float(data['morality'][str(data_b.index("vb09") + 1)]) + float(data['morality'][str(data_b.index("vb14") + 1)])) / float(6)
    morality['Purity'] = (float(data['morality'][str(data_a.index("va05") + 1)]) + float(data['morality'][str(data_a.index("va10") + 1)]) + float(data['morality'][str(data_a.index("va15") + 1)]) + float(data['morality'][str(data_b.index("vb05") + 1)]) + float(data['morality'][str(data_b.index("vb10") + 1)]) + float(data['morality'][str(data_b.index("vb15") + 1)])) / float(6)
    morality_info = {'email': self.current_user, 'morality': morality}
    state['moralityinfo'] = morality_info
    new_state = db.storeState(self.current_user, studyid, state)
    db.storeMorality(self.current_user, morality_info)

    self.write(morality_info)

class DemographicStudyLoggedin(LoggedInRequiredHandler):
  def post(self):
    studyid = self.get_current_study()
    state = db.getState(self.current_user, studyid)
    if state is None or 'userinfo' not in state:
      self.redirect(self.reverse_url('index'))
      return

    data = json.loads(self.get_argument("json", None))
    current_year = datetime.now().year
    demographics = {}
    if 'languages' in data:
      languages = []
      for lan in data['languages']:
        languages.append(lan['Language'])
      demographics['languages'] = languages
    if 'gender' in data:
      demographics['gender'] = data['gender']
    if 'yob' in data:
      demographics['yob'] = data['yob']
    if 'nationality' in data:
      demographics['nationality'] = data['nationality']
    if 'ethnicity' in data:
      demographics['ethnicity'] = data['ethnicity']
    if 'academic_degree' in data:
      demographics['degree'] = data['academic_degree']
    if 'major_college' in data:
      demographics['major_college'] = data['major_college']
    if 'major_graduate' in data:
      demographics['major_graduate'] = data['major_graduate']
    if 'position' in data:
      demographics['position'] = data['position']
    if 'office_location' in data:
      demographics['office'] = {}
      if 'Building' in data['office_location'] and data['office_location']['Building'] != '' and data['office_location']['Building'] != None:
        demographics['office']['building'] = data['office_location']['Building'][0:data['office_location']['Building'].index('+')]
        location = literal_eval(data['office_location']['Building'][data['office_location']['Building'].index('+') + 1:])
        demographics['office']['location'] = [location[0], location[1]]
      if 'Floor' in data['office_location'] and data['office_location']['Floor'] != '' and data['office_location']['Floor'] != None:
        demographics['office']['floor'] = data['office_location']['Floor']
      if 'Room' in data['office_location'] and data['office_location']['Room'] != '' and data['office_location']['Room'] != None:
        demographics['office']['room'] = data['office_location']['Room']
    if 'neighbors' in data:
      demographics['neighbors'] = int(data['neighbors'])

    demographic_info = {'email': self.current_user, 'demographics': demographics}
    db.storeDemographic(self.current_user, demographic_info)
    self.write({'success':demographic_info})

class NetworkX(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    network = data['network']
    org_network = data['org_network']
    g = nx.Graph()
    for node in network['nodes']:
      g.add_node(str(node[0]), weight=node[1]['weight'])
    for link in network['links']:
      g.add_edge(str(link[0]), str(link[1]), weight=link[2]['weight'])
    betweenness = nx.closeness_centrality(g)
    # betweenness = nx.betweenness_centrality(g, weight='weight')
    org_g = nx.Graph()
    for node in org_network['nodes']:
      org_g.add_node(node[0], weight=node[1]['weight'])
    for link in org_network['links']:
      org_g.add_edge(link[0], link[1], weight=link[2]['weight'])
    org_betweenness = nx.closeness_centrality(org_g)
    # org_betweenness = nx.betweenness_centrality(org_g, weight='weight')

    self.write({'success': True, 'b': betweenness, 'org_b': org_betweenness})

class SienaDataPrepare(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    skip = data['skip']
    users = data['users']
    matrix = data['matrix']
    all_betweenness = data['all_betweenness']
    all_closeness = data['all_closeness']
    all_degree = data['all_degree']
    all_density = data['all_density']
    all_giant_density = data['all_giant_density']
    all_ave_degree = data['all_ave_degree']
    team = data['team']
    thres = data['thres']

    name_header = []
    for k in range(len(users)):
      if k not in skip:
        name_header.append(users[k]['given_name'])
    #for waves
    for ind in range(len(matrix)):
      new_wave = []
      for i in range(len(matrix[ind])):
        new_row = []
        if i not in skip:
          for j in range(len(matrix[ind][i])):
            if j not in skip:
              new_row.append(matrix[ind][i][j])
          new_wave.append(new_row)
      with open("./siena/" + team + "_link" + str(ind + 1) + "_thres" + str(thres) + ".csv", "w") as ff:
        writer = csv.writer(ff, lineterminator='\n')
        writer.writerow(name_header)
        writer.writerows(new_wave)
      ff.close()

    dates = ["2016-09-01", "2016-10-01", "2016-11-01", "2016-12-01", "2017-01-01", "2017-02-01", "2017-03-01",
             "2017-04-01", "2017-05-01", "2017-06-01", "2017-07-01", "2017-08-01", "2017-09-01", "2017-10-01",
             "2017-11-01", "2017-12-01", "2018-01-01", "2018-02-01"]

    #for ave centralities
    ave_centrality = []
    for k in range(len(dates)):
      ave_centrality.append(["ave", dates[k], str(all_density[k]), str(all_giant_density[k]), str(all_ave_degree[k])])
    with open("./siena/" + team + "_centrality" + "_thres" + str(thres) + ".csv", "w") as ff:
      writer = csv.writer(ff, lineterminator='\n')
      writer.writerow(["name", "date", "density", "density_largest", "degree"])
      writer.writerows(ave_centrality)
    ff.close()

    #for member centralities
    member_centrality = []
    for k in range(len(users)):
      if k not in skip:
        for l in range(len(dates)):
          ave_centrality.append([users[k]['given_name'], "", dates[l], str(all_closeness[k][l]), str(all_betweenness[k][l]), str(all_degree[k][l])])
    with open("./siena/" + team + "_member_centrality" + "_thres" + str(thres) + ".csv", "w") as ff:
      writer = csv.writer(ff, lineterminator='\n')
      writer.writerow(["name", "position", "date", "closeness", "betweenness", "degree"])
      writer.writerows(member_centrality)
    ff.close()

    self.write({'success': True, 'data': data})

class SaveMetrics(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    users = data['users']
    all_betweenness = data['all_betweenness']
    all_closeness = data['all_closeness']
    all_degree = data['all_degree']
    all_density = data['all_density']
    all_giant_density = data['all_giant_density']
    all_ave_degree = data['all_ave_degree']
    months = data['months']
    team = data['team']

    metrics_info = {'id': team, 'users': users, 'months': months,
                    'betweenness': all_betweenness, 'closeness': all_closeness, 'degree': all_degree,
                    'density': all_density, 'giant_density': all_giant_density, 'ave_degree': all_ave_degree}
    db.storeMetrics(team, metrics_info)
    self.write({'success': True})

class SienaNetworkX(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    network = data['network']
    g = nx.Graph()
    for node in network['nodes']:
      g.add_node(str(node[0]), weight=node[1]['weight'])
    for link in network['links']:
      g.add_edge(str(link[0]), str(link[1]), weight=link[2]['weight'])
    closeness = nx.closeness_centrality(g)
    betweenness = nx.betweenness_centrality(g, weight='weight')
    degree = nx.degree_centrality(g)
    ave_degree = sum(degree[c] for c in degree) / len(degree)
    density = nx.density(g)
    density_largest = nx.density(max(nx.connected_component_subgraphs(g), key=len))

    self.write({'success': True, 'betweenness': betweenness, 'closeness': closeness,
                'degree': degree, 'ave_degree': ave_degree,
                'density': density, 'density_largest': density_largest})

class NetworkXReport(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    network = data['network']
    org_network = data['org_network']
    g = nx.Graph()
    for node in network['nodes']:
      g.add_node(str(node[0]), weight=node[1]['weight'])
    for link in network['links']:
      g.add_edge(str(link[0]), str(link[1]), weight=link[2]['weight'])
    betweenness = nx.closeness_centrality(g)
    # betweenness = nx.betweenness_centrality(g, weight='weight')
    org_g = nx.Graph()
    for node in org_network['nodes']:
      org_g.add_node(node[0], weight=node[1]['weight'])
    for link in org_network['links']:
      org_g.add_edge(link[0], link[1], weight=link[2]['weight'])
    org_betweenness = nx.closeness_centrality(org_g)
    # org_betweenness = nx.betweenness_centrality(org_g, weight='weight')

    density = nx.density(g)
    org_density = nx.density(org_g)

    # components = (nx.connected_components(g))
    # org_components = (nx.connected_components(org_g))
    components = sorted(nx.connected_components(g), key=len, reverse=True)
    components_graphs = sorted(nx.connected_component_subgraphs(g), key=len, reverse=True)
    component_map = []
    component_density = []
    for nodes in components:
      if len(list(nodes)) > 1:
        component_map.append(list(nodes))
        component_density.append(nx.density(components_graphs[components.index(nodes)])) #components_graphs[0].density()
    # for graph in components_graphs:
    #     component_density.append(graph.density())

    org_components = sorted(nx.connected_components(org_g), key=len, reverse=True)
    org_components_graphs = sorted(nx.connected_component_subgraphs(org_g), key=len, reverse=True)
    org_component_map = []
    org_component_density = []
    for nodes in org_components:
      if len(list(nodes)) > 1:
        org_component_map.append(list(nodes))
        org_component_density.append(
          nx.density(org_components_graphs[org_components.index(nodes)]))  # components_graphs[0].density()

    self.write({'success': True, 'components': {'nodes': component_map, 'density': component_density}, 'org_components': {'nodes': org_component_map, 'density': org_component_density},
                'b': betweenness, 'org_b': org_betweenness, 'density': density, 'org_density': org_density})

class SaveCommunication(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    batch = data['batch']
    year = data['year']
    dict = data['dict']
    sample = data['sample']

    new_sample = []
    for email in sample:
      new_email = {'from': dict[email['from']]['email'], 'to': dict[email['to']]['email'], 'time': email['time']}
      new_sample.append(new_email)

    communication_info = {'id': team_id, 'batch': batch, 'year': year, 'communication': new_sample}
    db.storeCommunication(team_id, batch, year, communication_info)

    self.write({'success': True})

class SaveWholeNetworkVersion(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    nodes_version = data['nodes_version']
    links_version = data['links_version']
    whole_network_version = {'id': team_id, 'nodes_version': nodes_version, 'links_version': links_version }
    db.storeWholeNetworkVersion(team_id, whole_network_version)

    self.write({'success': True})

class GetWholeNetworkVersion(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    version = db.getWholeNetworkVersion(team_id)

    if version:
      self.write({'success': True, 'nodes_version': version['nodes_version'], 'links_version': version['links_version']})
    else:
      self.write({'success': False})

class SaveWholeNetwork(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    type = data['type']
    batch = data['batch']
    data = data['data']
    network_info = {'id': team_id, 'type': type, 'batch': batch, 'data': data }
    db.storeWholeNetwork(team_id, type, batch, network_info)

    self.write({'success': True})

class GetWholeNetwork(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    type = data['type']
    batch = data['batch']
    part_of_network = db.getWholeNetwork(team_id, type, batch)

    if part_of_network:
      self.write({'success': True, 'data': part_of_network['data']})
    else:
      self.write({'success': False})

class SaveOrgsVersion(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    version = data['version']
    orgs_version = {'id': team_id, 'version': version }
    db.storeOrgsVersion(team_id, orgs_version)

    self.write({'success': True})

class GetOrgsVersion(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    orgs_version = db.getOrgsVersion(team_id)

    if orgs_version:
      self.write({'success': True, 'version': orgs_version['version']})
    else:
      self.write({'success': False})

class SaveOrgs(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    batch = data['batch']
    orgs = data['orgs']
    orgs_info = {'id': team_id, 'batch': batch, 'orgs': orgs }
    db.storeOrgs(team_id, batch, orgs_info)

    self.write({'success': True})

class GetOrgs(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    batch = data['batch']
    orgs = db.getOrgs(team_id, batch)

    if orgs:
      self.write({'success': True, 'orgs': orgs['orgs']})
    else:
      self.write({'success': False})

class SaveContacts(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    email = data['email']
    contacts = data['contacts']
    timestamp = data['timestamp']
    contacts_info = {'email': email, 'contacts': contacts, 'timestamp': timestamp }
    db.storeContacts(email, contacts_info)

    self.write({'success': True})

class GetContacts(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    email = data['email']
    contacts = db.getContacts(email)

    if contacts:
      self.write({'success': True, 'contacts': contacts['contacts'], 'timestamp': contacts['timestamp']})
    else:
      self.write({'success': False})

class SaveNetworkStructure(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    network = data['network']
    org_network = data['org_network']
    network_info = {'id': team_id, 'network': network, 'org_network': org_network, 'members': data['members']}
    db.storeNetworkStructure(team_id, network_info)

    self.write({'success': True})

class GetNetworkStructure(BaseHandler):
  def post(self):
    data = json.loads(self.get_argument("json", None))
    team_id = data['id']
    network = db.getNetworkStructure(team_id)

    if network:
      self.write({'success': True, 'network': network['network'], 'org_network': network['org_network'], 'members': network['members']})
    else:
      self.write({'success': False})


class Snapshot(LoggedInRequiredHandler):
  def post(self):
    email = self.current_user
    try:
      if self.get_argument('b64', False):
        b64 = self.get_argument('b64')
        png = base64.decodestring(b64)

        if not os.path.exists('static/snapshots/'): os.mkdir("static/snapshots/")
        while True:
          filename = 'static/snapshots/' + str(uuid.uuid4()) + '.png'
          if not os.path.exists(filename): break

        f = open(filename, "w")
        f.write(png)
        f.close()
        # send email unless the user is logging out
        self.write({'success':True ,'url':  "https://" + self.request.host + '/' + filename})
      else:
        self.write({'success':False})
    except:
      self.write({'success':False})
      db.log(email=email, ip=self.request.remote_ip, module="Snapshot",
        msg=traceback.format_exc(), level=logging.ERROR)


class AuthPage(AuthRequestRequiredHandler):
  def get(self):
    authRequest = db.getAuthRequest(self.get_authid())
    print authRequest['status']
    if authRequest['status'] == db.AuthStatus.AUTHORIZED:
      # login the user with the email
      #
      self.set_secure_cookie("email", authRequest['email'])
      # remove the auth request info from the db
      db.removeAuthRequest(self.get_authid())
      # remove the auth request id from cookie
      self.unset_authid()
      # redirect to main visualization page
      self.redirect(self.reverse_url('viz'))
      return
    if authRequest['status'] == db.AuthStatus.FAILED:
      self.redirect(self.reverse_url('authfailed'))
      # # should we do that? will it affect any later action?
      # remove the auth request info from the db
      # db.removeAuthRequest(self.get_authid())
      return
    if authRequest['status'] == db.AuthStatus.PENDING:
      self.render('auth/auth.html')
      return

class AuthPageJoin(AuthRequestRequiredHandler):
  def get(self, para):
    group_id_ind = para.split('=')[1]
    if group_id_ind.find('&') == -1:
      team_id = group_id_ind
      group_id = None
    else:
      print "group id + ind:", group_id_ind
      group_id = group_id_ind.split('&')[0]
      ind = int(group_id_ind.split('&')[1])
    studyid = self.get_current_study()
    state = db.getState(self.current_user, studyid)

    authRequest = db.getAuthRequest(self.get_authid())
    if authRequest['status'] == db.AuthStatus.AUTHORIZED:
      # login the user with the email
      #
      self.set_secure_cookie("email", authRequest['email'])
      # remove the auth request info from the db
      db.removeAuthRequest(self.get_authid())
      # remove the auth request id from cookie
      self.unset_authid()
      # redirect to main visualization page
      print "userinfo error check", authRequest['email'], state['userinfo']['name']

      new_member = False
      if group_id == None and team_id == None:
        # l = 0
        self.redirect(self.reverse_url('viz'))
      elif group_id == None:
          # new_member = db.inTeam(team_id, state['userinfo'])
          if team_id == "onlyfortest":
            self.redirect(self.request.protocol + "://" + self.request.host + "/dotest")

          team = db.joinTeam(team_id, state['userinfo'])
          if team == False:
            self.redirect(self.reverse_url('busy'))
          # if new_member == True:
          #   self.redirect(self.request.protocol + "://" + self.request.host + "/teamviz/" + team_id)
          # else:
          self.redirect(self.request.protocol + "://" + self.request.host + "/teamviz/" + team_id)
      else:
          if db.updateGroup(group_id, ind, authRequest['email'], state['userinfo']['name']) == True:
            self.redirect(self.request.protocol + "://" + self.request.host + "/viz_join/id=" + group_id)
          else:
            print "Group id not found and can't go to viz_join"
      return
    if authRequest['status'] == db.AuthStatus.FAILED:
      self.redirect(self.reverse_url('authfailed'))
      # # should we do that? will it affect any later action?
      # remove the auth request info from the db
      # db.removeAuthRequest(self.get_authid())
      return
    if authRequest['status'] == db.AuthStatus.PENDING:
      self.render('auth/auth.html')
      return

# class AuthPageJoin(AuthRequestRequiredHandler):
#   def get(self, para):
#     restEmails = para
#     authRequest = db.getAuthRequest(self.get_authid())
#     if authRequest['status'] == db.AuthStatus.AUTHORIZED:
#       # login the user with the email
#       #
#       self.set_secure_cookie("email", authRequest['email'])
#       # remove the auth request info from the db
#       db.removeAuthRequest(self.get_authid())
#       # remove the auth request id from cookie
#       self.unset_authid()
#       # redirect to main visualization page
#       # self.redirect(self.reverse_url('viz_multi'))
#       self.redirect(self.request.host + "/viz_multi/" + restEmails)
#
#       return
#     if authRequest['status'] == db.AuthStatus.FAILED:
#       self.redirect(self.reverse_url('authfailed'))
#       return
#     if authRequest['status'] == db.AuthStatus.PENDING:
#       self.render('auth/auth.html')
#       return

class AuthFailedPage(BaseHandler):
  def get(self):
    self.render('auth/authfailed.html')

class AuthEWS(BaseHandler):
  def post(self):
    studyid = self.get_current_study()
    email = self.get_argument('email', None)
    username = self.get_argument('username', None)
    password = self.get_argument('password', None)
    if email is None or username is None or password is None or email.strip() == '' or username.strip() == '' or password.strip() == '':
      self.redirect(self.reverse_url('index'))
    email = email.lower().strip()

    self.set_secure_cookie("form_email", email)
    self.set_secure_cookie("form_username", username)
    domain = email[email.find('@')+1:]
    #if domain in ['exchange.com', 'hotmail.com', 'live.com']: emailType = db.EmailType.HOTMAIL
    #else: emailType = db.EmailType.EXCHANGE
    emailType = db.EmailType.EXCHANGE

    authid = db.insertAuthRequest(username, email, password, emailType, studyid)
    print "authid", authid
    self.set_authid(authid)

    group_id_ind = self.get_argument("state", None)
    print group_id_ind
    if group_id_ind != None and group_id_ind != "":
      if group_id_ind.find('&') == -1:
        team_id = group_id_ind

      else:
        print "group id + ind:", group_id_ind
        group_id = group_id_ind.split('&')[0]
        ind = int(group_id_ind.split('&')[1])
        print "auth returned group id = ", group_id, " ind = ", ind

        # group = db.getGroupAdd(group_id)
        # adds = ["" for i in range(len(group['members']))]
        # for item in group['members']:
        #     adds[group['members'].index(item)] = item['email']

    # restEmails = self.get_argument("state", None)
    # rest_emails = ""
    # print restEmails
    # if restEmails != None:
    #   # restEmails = base64.b64decode(restEmails)
    #   restEmails = json.loads(restEmails)
    #   for item in restEmails:
    #     print item
    #     rest_emails = rest_emails + "add=" + item['add']
    #     if restEmails.index(item) != len(restEmails) - 1:
    #         rest_emails += "&"
    #   # restEmails = para
    #   print "State = ", rest_emails
    #   print "User: ", email

    # only add if there is no other task in the queue for the same person
    if not db.hasTask(email, studyid):
      db.pushTask(email, studyid, authid=authid)
      print 'Pushtask with', studyid
      db.log(email=email, ip=self.request.remote_ip, module="AuthEWS", msg='Added a fetching task')
    # else:
    #   db.updateTask(email, authid=authid)

    # if group_id == None and team_id == None:
    #   self.redirect(self.reverse_url('auth'))
    # elif group_id == None:
    #   if team_id == "onlyfortest":
    #     self.redirect(self.request.protocol + "://" + self.request.host + "/dotest")
    #   if new_member == True:
    #     self.redirect(self.request.protocol + "://" + self.request.host + "/teamviz/" + team_id)
    #   else:
    #     self.redirect(self.request.protocol + "://" + self.request.host + "/teamviz/" + team_id)
    # else:
    #   if db.updateGroup(group_id, ind, email, userinfo['name']) == True:
    #     self.redirect(self.request.protocol + "://" + self.request.host + "/viz_join/id=" + group_id)

    if group_id_ind == None or group_id_ind == "":
        self.redirect(self.reverse_url('auth'))
    else:
        self.redirect('/authJoin/para=' + group_id_ind)


# class AuthEWSJoin(BaseHandler):
#   def post(self, para):
#     restEmails = para
#     studyid = self.get_current_study()
#     email = self.get_argument('email', None)
#     username = self.get_argument('username', None)
#     password = self.get_argument('password', None)
#     if email is None or username is None or password is None or email.strip() == '' or username.strip() == '' or password.strip() == '':
#       self.redirect(self.reverse_url('index'))
#     email = email.lower().strip()
#
#     self.set_secure_cookie("form_email", email)
#     self.set_secure_cookie("form_username", username)
#     domain = email[email.find('@')+1:]
#     #if domain in ['exchange.com', 'hotmail.com', 'live.com']: emailType = db.EmailType.HOTMAIL
#     #else: emailType = db.EmailType.EXCHANGE
#     emailType = db.EmailType.EXCHANGE
#
#     authid = db.insertAuthRequest(username, email, password, emailType, studyid)
#     self.set_authid(authid)
#
#     # only add if there is no other task in the queue for the same person
#     if not db.hasTask(email, studyid):
#       db.pushTask(email, studyid, authid=authid)
#       print 'Pushtask with', studyid
#       db.log(email=email, ip=self.request.remote_ip, module="AuthEWS", msg='Added a fetching task')
#     # self.redirect(self.reverse_url('authJoin'))
#       self.redirect(self.request.host + "/authJoin/" + restEmails)

class AuthYahoo(BaseHandler):
  def post(self):
    studyid = self.get_current_study()
    email = self.get_argument('email', None)
    password = self.get_argument('password', None)
    if email is None or password is None or email.strip() == '' or password.strip() == '':
      self.redirect(self.reverse_url('index'))
    email = email.lower().strip()

    self.set_secure_cookie("form_email", email)
    domain = email[email.find('@')+1:]
    #if domain in ['exchange.com', 'hotmail.com', 'live.com']: emailType = db.EmailType.HOTMAIL
    #else: emailType = db.EmailType.EXCHANGE
    emailType = db.EmailType.YAHOO

    authid = db.insertAuthRequest(email, email, password, emailType, studyid)
    self.set_authid(authid)

    # only add if there is no other task in the queue for the same person
    if not db.hasTask(email, studyid):
      db.pushTask(email, studyid, authid=authid)
      print 'Pushtask with', studyid
      db.log(email=email, ip=self.request.remote_ip, module="AuthYahoo", msg='Added a fetching task')
    self.redirect(self.reverse_url('auth'))

# class AuthYahooJoin(BaseHandler):
#   def post(self, para):
#     restEmails = para
#     studyid = self.get_current_study()
#     email = self.get_argument('email', None)
#     password = self.get_argument('password', None)
#     if email is None or password is None or email.strip() == '' or password.strip() == '':
#       self.redirect(self.reverse_url('index'))
#     email = email.lower().strip()
#
#     self.set_secure_cookie("form_email", email)
#     domain = email[email.find('@')+1:]
#     #if domain in ['exchange.com', 'hotmail.com', 'live.com']: emailType = db.EmailType.HOTMAIL
#     #else: emailType = db.EmailType.EXCHANGE
#     emailType = db.EmailType.YAHOO
#
#     authid = db.insertAuthRequest(email, email, password, emailType, studyid)
#     self.set_authid(authid)
#
#     # only add if there is no other task in the queue for the same person
#     if not db.hasTask(email, studyid):
#       db.pushTask(email, studyid, authid=authid)
#       print 'Pushtask with', studyid
#       db.log(email=email, ip=self.request.remote_ip, module="AuthYahoo", msg='Added a fetching task')
#     # self.redirect(self.reverse_url('authJoin'))
#     self.redirect(self.request.host + "/authJoin/" + restEmails)

class DownloadEmails(LoggedInRequiredHandler):
  def get(self):
    self.render('downloademails.html')

class DataDecision(BaseHandler):
  def get(self):
    self.render('datadecision.html')

class Get_State(LoggedInRequiredHandler):
  def get(self):
    state = db.getStateJson(self.current_user, self.get_current_study())
    self.write(state)
    self.finish()

class GetEmails(BaseHandler): #LoggedInRequiredHandler
  theEmailAdd = ""
  @tornado.web.asynchronous
  def get(self, para):
    global flag
    studyid = self.get_current_study()
    if para[len(para)-1] == '&':
        version = para[0:para.index('&')]
        text = ""
        if flag == 0:
            text = VizSingle.userName
    else:
        version = para[0:para.index('&')]
        text = para[para.index('=')+1:]
    print "text", text
    GetEmails.theEmailAdd = text
    print "text", text
    print self.current_user

    if GetEmails.theEmailAdd == "":
        GetEmails.theEmailAdd = self.current_user
    modifiedTimestamp = db.getModifiedTimestamp(GetEmails.theEmailAdd, int(version), studyid)
    # modifiedTimestamp = db.getModifiedTimestamp(self.current_user, int(version), studyid)
    if modifiedTimestamp == None: raise tornado.web.HTTPError(404)
    contentLength = db.getContentLength(GetEmails.theEmailAdd, int(version), studyid)
    # contentLength = db.getContentLength(self.current_user, int(version), studyid)
    self.set_header("Content-Length", contentLength)
    self.set_header("Cache-Control", "no-cache")
    ifmodified = self.request.headers.get("If-Modified-Since", None)
    print ifmodified
    if ifmodified is not None:
      ifmodifiedTimestamp = email.utils.mktime_tz(email.utils.parsedate_tz(ifmodified))
      if int(modifiedTimestamp) == int(ifmodifiedTimestamp):
        self.set_status(304)
        self.finish()
        print "haha"
        # db.check_state({"email":"junezjx@gmail.com"})
        return

    content = db.getEmailsContent(GetEmails.theEmailAdd, int(version), studyid)
    # content = db.getEmailsContent(self.current_user, int(version), studyid)
    if content is None: raise tornado.web.HTTPError(404)
    self.set_header("Last-Modified", email.utils.formatdate(modifiedTimestamp, usegmt=True))
    self.set_header('Content-Encoding','gzip')
    self.set_header('Content-Type', 'application/json')
    self.write(content)
    self.finish()
  # def post(self):
  #   text = self.get_argument("json", None)
  #   text = json.loads(text)
  #   print text
  #   GetEmails.theEmailAdd = text


class GetHillaryEmails(LoggedInRequiredHandler):
  theEmailAdd = ""
  @tornado.web.asynchronous
  def get(self, para):
    global flag
    print para
    if para[len(para)-1] == '&':
        version = para[0:para.index('&')]
        text = ""
        if flag == 0:
            text = VizHillary.userName
    else:
        version = para[0:para.index('&')]
        text = para[para.index('=')+1:]
    GetEmails.theEmailAdd = text

    GetEmails.theEmailAdd = "Hillary Clinton"
    print GetEmails.theEmailAdd
    name = "Hillary Clinton"

    content = db.getLeakEmailsContent(name)
    # print content
    self.write(json_encode(content))
    self.finish()

class GetPodestaEmails(LoggedInRequiredHandler):
  theEmailAdd = ""
  @tornado.web.asynchronous
  def get(self, para):
    global flag
    print para
    if para[len(para)-1] == '&':
        version = para[0:para.index('&')]
        text = ""
        if flag == 0:
            text = "John Podesta"
    else:
        version = para[0:para.index('&')]
        text = para[para.index('=')+1:]
    GetEmails.theEmailAdd = text

    GetEmails.theEmailAdd = "John Podesta"
    print GetEmails.theEmailAdd
    name = "John Podesta"

    content = db.getLeakEmailsContent(name)
    # print content
    self.write(json_encode(content))
    self.finish()


class getVersion(BaseHandler): #LoggedInRequiredHandler
  version = 0
  def get(self, para):
    global flag
    studyid = 0#self.get_current_study()
    text = para[para.index('=')+1:]
    print "getversion text", text
    if text == "demo@demo.com":
        getVersion.version = 2
    else:
        # print db.check_state({"email":"junezjx@gmail.com"})
        state = db.getState(text, studyid)
        getVersion.version = state['version']

    self.write(str(getVersion.version))

class NetworkAnalysis(BaseHandler):
  version = 0
  def get(self, para):
    global flag, bet_flag
    studyid = 0#self.get_current_study()
    text = para[para.index('=')+1:]
    text = json.loads(text)
    nodes = text['nodes']
    links = text['links']
    ben_cen = db.networkAna(nodes, links, bet_flag)
    bet_flag = 0
    # print "ben_cen", json.dumps(ben_cen)

    # self.write(str(json.dumps(ben_cen)))

EMAIL_REGEX = re.compile(r"^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$")
def isValidEmail(email):
  return EMAIL_REGEX.match(email.lower())

class CreateStudy(BaseHandler):
  def get(self):
    self.render('study/create.html')

  def post(self):
    name  = self.get_argument("study_name", '').strip()
    description  = self.get_argument("study_description", '').strip()
    email = self.get_argument("study_email", '').strip()
    email2 = self.get_argument("study_email2", '').strip()
    if name and description and email and email == email2 and isValidEmail(email):
      study = db.createStudy(name, description, email)
      self.write({'success':True, 'id': study['id'], 'password' : study['password']})
    else: self.write({'success':False})


settings = {
  "cookie_secret": 'whateverImmersion2013',
  "debug": False,
  "logging": False,
  #"log_function" : lambda x: 0,
  "static_path": os.path.join(os.path.dirname(__file__), "static"),
  "template_path": "templates"
}

tornado.options.define("debug", default=True, help="Running in DEBUG mode")#default=False
tornado.options.define("port", default=80, help="Port number")
tornado.options.define("exhibit", default=False, help="Running in exhibit mode")

tornado.options.parse_command_line()
settings['debug'] = tornado.options.options.debug


application = tornado.web.Application([
  # URLSpec("/", BaseHandler),

  URLSpec("/XJ_viz", XJ_Viz),

  URLSpec("/create_check", CheckTeamTestV2),
  URLSpec("/join", JoinPageFill, name="join"),
  URLSpec("/join/(.*)", JoinPage),
  URLSpec("/join_check", JoinTeamCheck),
  URLSpec("/create", CreateTeamTestV2, name="v2create"),
  URLSpec("/teams/(.*)", VizTeamTestV2),
  URLSpec("/teamviz/(.*)", TeamVizV2),
  URLSpec("/demo/(.*)", DemoTeamVizV2),
  # URLSpec("/slack_login", SlackLogin),
  URLSpec("/admin_login", AdminLogin),
  URLSpec(r"/v2oauth2callback", AuthorizerReturnedV2),
  URLSpec("/analysis/(.*)", AnalysisPage),
  URLSpec("/mergedanalysis/(.*)", MergedAnalysisPage),
  URLSpec("/savecentralities", SaveCentralities),
  URLSpec("/savemergedcentralities", SaveMergedCentralities),
  URLSpec("/savepairs", SavePairs),
  URLSpec("/save_response_time", SaveResponseTime),
  URLSpec("/get_response_time", GetResponseTime),
  URLSpec("/save_aliases", SaveAliases),
  URLSpec("/save_emailSentTime", SaveEmailSentTime),
  URLSpec("/get_emailSentTime", GetEmailSentTime),
  URLSpec("/savemergedpairs", SaveMergedPairs),
  URLSpec("/save_communication", SaveCommunication),
  URLSpec("/save_network_structure", SaveNetworkStructure),
  URLSpec("/save_metrics", SaveMetrics),
  URLSpec("/save_contacts", SaveContacts),
  URLSpec("/save_orgs", SaveOrgs),
  URLSpec("/save_orgs_version", SaveOrgsVersion),
  URLSpec("/save_whole_network_version", SaveWholeNetworkVersion),
  URLSpec("/save_whole_network", SaveWholeNetwork),
  URLSpec("/get_network_structure", GetNetworkStructure),
  URLSpec("/get_slack_network", GetSlackNetwork),
  URLSpec("/get_contacts", GetContacts),
  URLSpec("/get_orgs", GetOrgs),
  URLSpec("/get_orgs_version", GetOrgsVersion),
  URLSpec("/get_whole_network_version", GetWholeNetworkVersion),
  URLSpec("/get_whole_network", GetWholeNetwork),
  URLSpec("/networkx_data", NetworkX),
  URLSpec("/siena_networkx", SienaNetworkX),
  URLSpec("/siena_data_prepare", SienaDataPrepare),
  URLSpec("/personal_report", PersonalReport),
  URLSpec("/networkx_report", NetworkXReport),
  URLSpec("/personal_report_single/(.*)", PersonalReport_single),
  URLSpec("/privacy", PrivacyPolicy),

  URLSpec("/", Index, name='index'),
  URLSpec("/viz", Viz, name='viz'),
  URLSpec("/invite_name", InviteName),
  URLSpec("/viz_single/(.*)", VizSingle),
  URLSpec("/viz_multi/(.*)", VizMulti, name="viz_multi"),
  URLSpec("/viz_multi_new/(.*)", VizMultiNew),
  URLSpec("/v2_viz_multi_new/(.*)", VizMultiNewV2),
  URLSpec("/team_demo", VizDemo),
  URLSpec("/team_demo_new", VizDemoNew),
  URLSpec("/team_demo_new_CK", VizDemoNewCK),
  URLSpec("/study_new_CK", VizDemoNewCKStudy),
  URLSpec("/study_new_all", VizDemoNewStudy),
  # URLSpec("/create_check/(.*)", CheckTeamTest),
  # URLSpec("/create", CreateTeamTest, name="create"),
  # URLSpec("/teams/(.*)", VizTeamTest),
  URLSpec("/login", VizLoginCreate),
  URLSpec("/login/(.*)", VizLoginTest),
  URLSpec("/mylogin", VizMyLogin),
  # URLSpec("/teamviz/(.*)", TeamViz),
  URLSpec("/getteams/(.*)", GetTeams),
  URLSpec("/merge/(.*)", MergeTeams),
  URLSpec("/mergetwo/(.*)", MergeTwo),
  URLSpec("/test", PreTest),
  URLSpec("/dotest", DoTest),
  URLSpec("/previz", PreViz),
  URLSpec("/exit_team/(.*)", exitTeam),
  URLSpec("/add_team/(.*)", addTeamName),
  URLSpec("/personality_survey_answer", PersonalityStudy),
  URLSpec("/personality_survey_answer_loggedin", PersonalityStudyLoggedin),
  URLSpec("/morality_survey_answer_loggedin", MoralityStudyLoggedin),
  URLSpec("/demographic_survey_answer_loggedin", DemographicStudyLoggedin),
  URLSpec("/team_demo_new_all", VizDemoNewAll),
  URLSpec("/team_demo_new2", VizDemoNewV2),
  URLSpec("/team_demo_new2_CK", VizDemoNewCKV2),
  URLSpec("/OCP2015", VizOCP2015),
  URLSpec("/OCP2016", VizOCP2016),
  URLSpec("/OCP", VizOCP),
  URLSpec("/team_demo_8K", VizDemo8K),
  URLSpec("/viz_join/(.*)", VizJoin, name='viz_join'),
  URLSpec("/viz_org/(.*)", VizOrg),
  URLSpec("/to_join/(.*)", indexJoin),
  URLSpec("/get_personality/(.*)", GetPersonalities),
  URLSpec("/get_one_personality/(.*)", GetOnePersonality),
  URLSpec("/get_morality/(.*)", GetMoralities),
  URLSpec("/get_one_morality/(.*)", GetOneMorality),
  URLSpec("/get_demographic/(.*)", GetDemographics),
  URLSpec("/get_one_demographic/(.*)", GetOneDemographic),
  URLSpec("/wikileaks", WikiLeaks),
  URLSpec("/clinton", VizHillary),
  URLSpec("/podesta", VizPodesta),
  URLSpec("/dnc", VizDNC),
  # URLSpec("/demo", Demo, name='demo'),
  URLSpec(r"/getemails/([0-9]+.*)", GetEmails),
  URLSpec(r"/getleakemails/([0-9]+.*)", GetHillaryEmails),
  URLSpec(r"/getPodestaemails/([0-9]+.*)", GetPodestaEmails),
  URLSpec(r"/getversion/(.*)", getVersion),
  URLSpec(r"/networkanalysis/(.*)", NetworkAnalysis),
  URLSpec("/logout", Logout),
  URLSpec("/snapshot", Snapshot),
  URLSpec("/feedback", SubmitFeedback),
  URLSpec("/waitlist", AddToWaitlist),
  URLSpec("/exittheteam", ExitTheTeam, name='exit_the_team'),
  URLSpec("/logoutdelete", LogoutDelete, name='logout_delete'),
  URLSpec("/logoutsave", LogoutSave, name="logout_save"),
  URLSpec("/imap", ImapPage, name="imap"),
  URLSpec("/busy", BusyPage, name="busy"),
  URLSpec("/getstate", Get_State),
  URLSpec("/sendstats", SendStats),
  URLSpec("/getstats/(.*)", GetStats),
  URLSpec("/senderror", SendError),
  URLSpec("/downloademails", DownloadEmails),
  URLSpec("/datadecision", DataDecision),

  #### authorization pages ####
  URLSpec(r"/authews", AuthEWS),
  URLSpec(r"/authyahoo", AuthYahoo),
  URLSpec(r"/oauth2callback", AuthorizerReturned),
  URLSpec(r"/oauth2callback_update", AuthorizerReturnedUpdate),
  URLSpec(r"/oauth2callback_outlook", AuthorizerReturnedOutlook),
  URLSpec(r"/slack_login", AuthorizerReturnedSlack),
  URLSpec("/auth", AuthPage, name="auth"),
  URLSpec("/authfailed", AuthFailedPage, name='authfailed'),
  ##############################

  #### authorization pages for joining network ####
  # URLSpec(r"/authewsJoin/(.*)", AuthEWSJoin),
  # URLSpec(r"/authyahooJoin/(.*)", AuthYahooJoin),
  # # URLSpec(r"/oauth2callbackJoin/(.*)", AuthorizerReturnedJoin),
  # URLSpec(r"/oauth2callback_updateJoin", AuthorizerReturnedUpdate),
  URLSpec("/authJoin/(.*)", AuthPageJoin, name="authJoin"),
  # URLSpec("/authfailedJoin", AuthFailedPage, name='authfailed'),
  ##############################

  ### study pages #############
  URLSpec("/study/create", CreateStudy),
  URLSpec(r"/study/([A-Z0-9]+)/?", IndexStudy, name="indexStudy"),

], **settings)


### load the client_info ###
f = open('client_secrets.json', 'r')
client_info = json.load(f)
f.close()
tmp = client_info['web']['redirect_uris'][0]
server_uri = tmp[0:tmp.rfind('/') + 1]
###

### load the outlook client_info ###
f = open('client_secrets_outlook.json', 'r')
client_info_outlook = json.load(f)
f.close()
###

### load the oslack client_info ###
f = open('client_secrets_slack.json', 'r')
client_info_slack = json.load(f)
f.close()
###


def clearSnapshots():
  mypath = 'static/snapshots/'
  onlyfiles = [ f for f in os.listdir(mypath) if os.path.isfile(os.path.join(mypath,f)) ]
  print '# of snapshots on disk', len(onlyfiles)

  nremoved = 0
  gap = 30*24*60*60 # 30 days X 24 hours X 60 minutes X 60 seconds
  for f in onlyfiles:
    fpath = os.path.join(mypath,f)
    timestamp = os.path.getmtime(fpath)
    if time.time() - timestamp > gap:
      os.remove(fpath)
      print 'removed', f, 'created at', datetime.fromtimestamp(timestamp)
      nremoved += 1
  print '# of snapshots removed', nremoved

def aggregateStats():
  # number of collaborators
  ncollabs, nsent, nrcv = [],[],[]
  for stat in db_direct.statistics.find():
    if 'ncollaborators' in stat and stat['ncollaborators'] >= 10:
      ncollabs.append(stat['ncollaborators'])
    if 'nsent' in stat and stat['nsent'] > 100:
      nsent.append(stat['nsent'])
    if 'nrcv' in stat and stat['nrcv'] > 100:
      nrcv.append(stat['nrcv'])
  ncollabs.sort()
  nsent.sort()
  nrcv.sort()


  db.put('ncollaborators', ncollabs)
  db.put('nsent', nsent)
  db.put('nrcv', nrcv)


if __name__ == "__main__":
    print tornado.options.options.port
    http_server = tornado.httpserver.HTTPServer(application, xheaders=True)
    http_server.listen(tornado.options.options.port)

    # application.listen(tornado.options.options.port, xheaders=True)
    #application.listen(port_num+1000, ssl_options = {
    #  "certfile": "immersion.crt",
    #  "keyfile": "immersion.key",
    #})
    if tornado.options.options.debug:
      db.log(email=None, ip=None, module="__main__", msg='running in debug mode')
      print 'running in debug mode'
    if tornado.options.options.exhibit:
      db.log(email=None, ip=None, module="__main__", msg='running in exhibit mode')
      print 'running in exhibit mode'
    db.log(email=None, ip=None, module="__main__", msg='starting on port %d' % tornado.options.options.port)
    print 'starting on port', tornado.options.options.port
    try:
      # run aggregate stats every 10min
      tornado.ioloop.PeriodicCallback(aggregateStats, 10*60*1000).start()
      # run cleanup of snapshots every 6 hours
      tornado.ioloop.PeriodicCallback(clearSnapshots, 6*60*60*1000).start()
      # start the server
      tornado.ioloop.IOLoop.instance().start()
    except (KeyboardInterrupt, SystemExit):
      print "Someone called ctrl+c"
    except:
      raise
