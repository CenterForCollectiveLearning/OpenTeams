from db import db as db_direct
import db

print db_direct.states.find({'version':-1}).count(), 'states with -1 version'
for state in db_direct.states.find({'version':-1}):
  if not db.hasTask(state['email']): db.pushTask(state['email'])

print db_direct.states.find({'imap':True}).count(), 'states with imap true'
for state in db_direct.states.find({'imap':True}):
  if not db.hasTask(state['email']): db.pushTask(state['email'])

print db_direct.states.find({'working':True}).count(), 'states with working true'
for state in db_direct.states.find({'working':True}):
  if not db.hasTask(state['email']): db.pushTask(state['email'])